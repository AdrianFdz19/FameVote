
# 1. REST API Gateway Instance
resource "aws_api_gateway_rest_api" "vote_api" {
  name        = "famvote-${var.environment}-ingestion-api"
  description = "High-concurrency direct SQS vote ingestion engine"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# 2. Path Resources: /v1/vote 

resource "aws_api_gateway_resource" "v1" {
  rest_api_id = aws_api_gateway_rest_api.vote_api.id
  parent_id   = aws_api_gateway_rest_api.vote_api.root_resource_id
  path_part   = "v1"
}

resource "aws_api_gateway_resource" "vote" {
  rest_api_id = aws_api_gateway_rest_api.vote_api.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "vote"
}

# -----------------------------------------------------------------------------
# POST METHOD (/v1/vote) - Direct SQS Ingestion
# -----------------------------------------------------------------------------

resource "aws_api_gateway_method" "post_vote" {
  rest_api_id   = aws_api_gateway_rest_api.vote_api.id
  resource_id   = aws_api_gateway_resource.vote.id
  http_method   = "POST"
  authorization = "NONE"
}

# Direct AWS Proxy Integration to SQS
resource "aws_api_gateway_integration" "sqs_integration" {
  rest_api_id             = aws_api_gateway_rest_api.vote_api.id
  resource_id             = aws_api_gateway_resource.vote.id
  http_method             = aws_api_gateway_method.post_vote.http_method
  type                    = "AWS"
  integration_http_method = "POST"
  credentials             = aws_iam_role.apigw_sqs_role.arn

  # MUST match sqs:path/ACCOUNT_ID/QUEUE_NAME
  uri = "arn:aws:apigateway:${var.aws_region}:sqs:path/${data.aws_caller_identity.current.account_id}/${aws_sqs_queue.vote_queue.name}"

  request_parameters = {
    "integration.request.header.Content-Type" = "'application/x-www-form-urlencoded'"
  }

  request_templates = {
    "application/json" = "Action=SendMessage&MessageBody=$util.urlEncode($input.body)"
  }

  # CRITICAL: Wait for SQS Queue and IAM Policy Attachment to complete first!
  depends_on = [
    aws_sqs_queue.vote_queue,
    aws_iam_role_policy_attachment.apigw_sqs_attach
  ]
}

# Response 200 OK Mapping
resource "aws_api_gateway_method_response" "post_200" {
  rest_api_id = aws_api_gateway_rest_api.vote_api.id
  resource_id = aws_api_gateway_resource.vote.id
  http_method = aws_api_gateway_method.post_vote.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "sqs_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.vote_api.id
  resource_id = aws_api_gateway_resource.vote.id
  http_method = aws_api_gateway_method.post_vote.http_method
  status_code = aws_api_gateway_method_response.post_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  response_templates = {
    "application/json" = <<EOF
{
  "success": true,
  "message": "Vote queued successfully"
}
EOF
  }

  depends_on = [aws_api_gateway_integration.sqs_integration]
}

# -----------------------------------------------------------------------------
# OPTIONS METHOD (/v1/vote) - CORS Preflight
# -----------------------------------------------------------------------------

resource "aws_api_gateway_method" "options_vote" {
  rest_api_id   = aws_api_gateway_rest_api.vote_api.id
  resource_id   = aws_api_gateway_resource.vote.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.vote_api.id
  resource_id = aws_api_gateway_resource.vote.id
  http_method = aws_api_gateway_method.options_vote.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.vote_api.id
  resource_id = aws_api_gateway_resource.vote.id
  http_method = aws_api_gateway_method.options_vote.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.vote_api.id
  resource_id = aws_api_gateway_resource.vote.id
  http_method = aws_api_gateway_method.options_vote.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options_integration]
}

# -----------------------------------------------------------------------------
# DEPLOYMENT & STAGE
# -----------------------------------------------------------------------------

resource "aws_api_gateway_deployment" "vote_deployment" {
  rest_api_id = aws_api_gateway_rest_api.vote_api.id

  triggers = {
    redeployment = sha256(jsonencode([
      aws_api_gateway_resource.vote.id,
      aws_api_gateway_method.post_vote.id,
      aws_api_gateway_integration.sqs_integration.id,
    ]))
  }

  depends_on = [
    aws_api_gateway_integration.sqs_integration,
    aws_api_gateway_integration.options_integration,
    aws_api_gateway_integration_response.sqs_integration_response
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.vote_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.vote_api.id
  stage_name    = var.environment
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.vote_api.id
  stage_name  = aws_api_gateway_stage.api_stage.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled    = true
    logging_level      = "INFO"
    data_trace_enabled = true
  }

  depends_on = [
    aws_api_gateway_account.main,
    aws_api_gateway_stage.api_stage,
    aws_cloudwatch_log_group.api_gw_logs,
    aws_cloudwatch_log_group.api_gw_execution_logs
  ]
}
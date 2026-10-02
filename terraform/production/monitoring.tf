# 1. Rol IAM e Integración Global de CloudWatch para API Gateway
resource "aws_iam_role" "apigw_cloudwatch" {
  name = "apigw_cloudwatch_push_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apigw_cloudwatch_attach" {
  role       = aws_iam_role.apigw_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch.arn
}

# 2. Grupo de Logs para API Gateway
resource "aws_cloudwatch_log_group" "api_gw_logs" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.vote_api.name}"
  retention_in_days = 7
}

# 3. Alarma en CloudWatch para la Cola SQS
resource "aws_cloudwatch_metric_alarm" "sqs_backlog_alarm" {
  alarm_name          = "famvote-sqs-high-backlog"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Alerta si los votos en SQS se están acumulando por lentitud en la Lambda."

  dimensions = {
    QueueName = aws_sqs_queue.vote_queue.name
  }
}
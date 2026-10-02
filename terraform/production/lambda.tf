# lambda.tf

# 1. Empaquetar el código Python
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda"
  output_path = "${path.module}/lambda_vote_processor.zip"
}

# 2. Rol IAM para la Lambda
resource "aws_iam_role" "lambda_sqs_role" {
  name = "famvote_lambda_sqs_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# 3. Permisos básicos de SQS y CloudWatch
resource "aws_iam_role_policy_attachment" "lambda_sqs_basic_execution" {
  role       = aws_iam_role.lambda_sqs_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

# 4. Adjuntar la Política de DynamoDB al Rol
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attach" {
  role       = aws_iam_role.lambda_sqs_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
}

# 5. Función Lambda
resource "aws_lambda_function" "vote_processor" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "famvote-vote-processor"
  role          = aws_iam_role.lambda_sqs_role.arn

  # Coincide con lambda_function.py -> def lambda_handler
  handler = "lambda_function.lambda_handler"

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.12"
  timeout          = 10

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.famvote_records.name
    }
  }
}

# 6. Trigger SQS -> Lambda
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn                   = aws_sqs_queue.vote_queue.arn
  function_name                      = aws_lambda_function.vote_processor.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
}

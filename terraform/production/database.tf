# database.tf

# 1. Tabla DynamoDB On-Demand
resource "aws_dynamodb_table" "famvote_records" {
  name         = "famvote_records"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Project     = "FamVote"
  }
}

# 2. Política IAM de acceso a la Tabla
resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name        = "famvote_lambda_dynamodb_policy"
  description = "Permite a la Lambda leer/escribir en la tabla de DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:BatchWriteItem"
      ]
      Resource = aws_dynamodb_table.famvote_records.arn
    }]
  })
}
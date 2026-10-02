# IAM Role
resource "aws_iam_role" "apigw_sqs_role" {
  name = "famvote-${var.environment}-apigw-sqs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
    }]
  })
}

# Policy allowing SendMessage
resource "aws_iam_policy" "apigw_sqs_policy" {
  name = "famvote-${var.environment}-apigw-sqs-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = aws_sqs_queue.vote_queue.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apigw_sqs_attach" {
  role       = aws_iam_role.apigw_sqs_role.name
  policy_arn = aws_iam_policy.apigw_sqs_policy.arn
}
# 1. Dead Letter Queue (DLQ) - Catches poison messages or processing failures
resource "aws_sqs_queue" "vote_dlq" {
  name                      = "famvote-${var.environment}-votes-dlq"
  message_retention_seconds = 1209600 # Retain unprocessable messages for 14 days

  tags = {
    Name = "famvote-${var.environment}-votes-dlq"
  }
}

# 2. Main Ingestion SQS Queue - Buffers incoming vote payload bursts
resource "aws_sqs_queue" "vote_queue" {
  name                       = "famvote-${var.environment}-votes-queue"
  delay_seconds              = 0
  max_message_size           = 262144 # 256 KB
  message_retention_seconds  = var.queue_retention_seconds
  receive_wait_time_seconds  = 10     # Long polling (reduces worker CPU & AWS costs)

  # Redrive policy sends messages to the DLQ after failed attempts
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.vote_dlq.arn
    maxReceiveCount     = var.dlq_max_receive_count
  })

  tags = {
    Name = "famvote-${var.environment}-votes-queue"
  }
}

# 3. Queue Policy - Grants permissions if needed by downstream services
resource "aws_sqs_queue_policy" "vote_queue_policy" {
  queue_url = aws_sqs_queue.vote_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAPIGatewayDirectSendMessage"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.vote_queue.arn
      }
    ]
  })
}
output "api_gateway_vote_url" {
  description = "Full URL for POST requests to vote"
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}/v1/vote"
}

output "sqs_queue_url" {
  description = "URL of the primary SQS Queue"
  value       = aws_sqs_queue.vote_queue.id
}

output "sqs_queue_arn" {
  description = "ARN of the primary SQS Queue"
  value       = aws_sqs_queue.vote_queue.arn
}

output "sqs_dlq_arn" {
  description = "ARN of the Dead Letter Queue"
  value       = aws_sqs_queue.vote_dlq.arn
}
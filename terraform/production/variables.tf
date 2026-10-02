variable "environment" {
  type        = string
  default     = "dev"
  description = "Project environment (dev, staging, production)"
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS Region"
}

variable "queue_retention_seconds" {
  type        = number
  default     = 86400 # 1 day retention by default
  description = "Number of seconds SQS retains a message"
}

variable "dlq_max_receive_count" {
  type        = number
  default     = 3 # Move to DLQ after 3 failed processing attempts
  description = "Max receive attempts before routing to Dead Letter Queue"
}
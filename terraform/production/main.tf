terraform {
    required_providers {
      aws = {
        source = "hashicorp/aws"
        version = "~> 5.92"
      }
    }

    # Remote State Storage
    backend "s3" {
      bucket = "famvote-prod-bucket"
      key = "famvote/prod/terraform.tfstate"
      region = "us-east-1"
      use_lockfile = true
    }
}

provider "aws" {
    region = "us-east-1"


    default_tags {
      tags = {
        Project = "FamVote"
        ManagedBy = "Terraform"
        Environment = var.environment 
      }
    } 
}

data "aws_caller_identity" "current" {}
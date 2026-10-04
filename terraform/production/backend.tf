terraform {
  backend "s3" {
    bucket         = "famvote-prod-bucket" # Ajusta con tu bucket real
    key            = "famvote/terraform.tfstate"
    region         = "us-east-1"
    use_lockfile = true
  }
}
provider "aws" {
  version = "~> 2.0"
  region = "${var.aws_region}"
}

terraform {
  backend "s3" {
    key            = "marsha.tfstate"
    bucket         = "marsha-terraform"
    dynamodb_table = "terraform_state_locks"
    encrypt        = true
  }
}

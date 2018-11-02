provider "aws" {
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

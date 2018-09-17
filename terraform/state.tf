provider "aws" {}

terraform {
  backend "s3" {
    region = "eu-west-1"
    key            = "marsha.tfstate"
    bucket         = "marsha-terraform"
    dynamodb_table = "terraform_state_locks"
    encrypt        = true
  }
}

provider "aws" {
  version = "~> 3.20"
}

terraform {
  backend "s3" {
    key            = "marsha.tfstate"
    bucket         = "marsha-terraform"
    dynamodb_table = "terraform_state_locks"
    encrypt        = true
  }
}

provider "aws" {
  version = "~> 3.14"
}

terraform {
  backend "s3" {
    key            = "marsh-shared-state.tfstate"
    bucket         = "marsha-terraform"
    dynamodb_table = "terraform_state_locks"
    encrypt        = true
  }
}

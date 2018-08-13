provider "aws" {}

terraform {
  backend "s3" {
    bucket = "marsha-terraform"
    key    = "state_file/marsha.tfstate"
    region = "eu-west-1"
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.63"
    }
    tls = {
      source = "hashicorp/tls"
      version = "3.3.0"
    }
  }
}

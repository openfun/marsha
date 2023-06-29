terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.5.0"
    }
    tls = {
      source = "hashicorp/tls"
      version = "3.3.0"
    }
  }
}

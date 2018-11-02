variable "cloudfront_price_class" {
  type = "map"

  default = {
    production = "PriceClass_All"
  }
}

variable "cloudfront_access_key_id" {
  type = "string"
}

variable "aws_region" {
  type    = "string"
  default = "eu-west-1"
}

variable "update_state_endpoint" {
  type    = "string"
}

variable "update_state_secret" {
  type    = "string"
}

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

variable "upload_confirm_endpoint" {
  type    = "string"
}

variable "deployment_stamp" {
  type    = "string"
}


variable "aws_region" {
  type    = "string"
  default = "eu-west-1"
}

variable "cloudfront_price_class" {
  type = "map"

  default = {
    production = "PriceClass_All"
  }
}

variable "cloudfront_trusted_signer_id" {
  type = "string"
}

variable "update_state_disable_ssl_validation" {
  type    = "string"
  default = "false"
}

variable "marsha_base_url" {
  type    = "string"
}

variable "update_state_endpoint" {
  type    = "string"
}

variable "update_state_secret" {
  type    = "string"
}

variable "migrations" {
  type    = "string"
}

variable "medialive_lambda_name" {
  type    = "string"
  default = "marsha-medialive"
}

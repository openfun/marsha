
variable "cloudfront_price_class" {
  type = map(string)

  default = {
    production = "PriceClass_All"
  }
}

variable "cloudfront_trusted_signer_id" {
  type = string
}

variable "update_state_disable_ssl_validation" {
  type    = string
  default = "false"
}

variable "marsha_base_url" {
  type    = string
}

variable "update_state_endpoint" {
  type    = string
}

variable "update_state_secret" {
  type    = string
}

variable "migrations" {
  type    = list(string)

  default = []
}

variable "medialive_lambda_name" {
  type    = string
  default = "marsha-medialive"
}

variable "lambda_image_name" {
  type    = string
}

variable "lambda_image_tag" {
  type    = string
  default = "master"
}

variable "ecr_lambda_marsha_arn" {
  type    = string
}

variable "s3_bucket_unique_suffix" {
  type = string
}

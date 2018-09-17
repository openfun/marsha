variable "cloudfront_price_class" {
  type = "map"

  default = {
    production = "PriceClass_All"
  }
}

variable "cloudfront_access_key_id" {
  type = "string"
}


variable "medialive_lambda_name" {
  type    = string
  default = "marsha-medialive"
}

variable "mediapackage_lambda_name" {
  type    = string
  default = "marsha-mediapackage"
}

variable "lambda_image_tag" {
  type    = string
  default = "production"
}

variable "s3_bucket_unique_suffix" {
  type = string
}

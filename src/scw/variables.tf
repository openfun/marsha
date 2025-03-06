
variable "disable_ssl_validation" {
  type    = string
  default = "false"
}

variable "marsha_base_url" {
  type    = string
}

variable "shared_secret" {
  type    = string
}

variable "s3_bucket_unique_suffix" {
  type    = string
}

variable "s3_access_key" {
  type      = string
  sensitive = true
}

variable "s3_secret_key" {
  type      = string
  sensitive = true
}

variable "s3_region" {
  type      = string
  default   = "fr-par"
}

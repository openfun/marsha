

variable "s3_bucket_unique_suffix" {
  type = string
}

variable "scw_group_id" {
  description = "Scaleway group id"
  type = string
  default = ""
}

variable "deletion_retention_period" {
  description = "The time duration (in days) an object will exist in the 'deleted' directory"
  type = number
  default = 21
}

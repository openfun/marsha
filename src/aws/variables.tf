
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
  default = "/api/update-state"
}

variable "recording_slices_manifest_endpoint" {
  type    = string
  default = "/api/recording-slices-manifest"
}

variable "recording_slices_state_endpoint" {
  type    = string
  default = "/api/recording-slices-state"
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

variable "mediapackage_lambda_name" {
  type    = string
  default = "marsha-mediapackage"
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

variable "video_chunk_duration" {
  type = number
  default = 1200
}

variable "ffmpeg_transmux_image_name" {
  type    = string
  default = "fundocker/marsha-ffmpeg-transmux"
}

variable "ffmpeg_transmux_image_tag" {
  type    = string
  default = "latest"
}

variable "ffmpeg_transmux_container_memory_reservation" {
  type    = number
  default = 500
}

# see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size
variable "ffmpeg_transmux_container_memory" {
  type    = number
  default = 2048
}

# see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size
variable "ffmpeg_transmux_container_cpu" {
  type    = number
  default = 1024
}

variable "ffmpeg_transmux_container_port" {
  type    = number
  default = 8081
}

variable "lambda_convert_memory" {
  type    = number
  default = 1536
}

variable "lambda_convert_ephemeral_storage" {
  type    = number
  default = 512
}

variable "create_vpc" {
  description = "Whether to create vpc or not"
  type    = bool
  default = true
}

variable "vpc_id" {
  description = "Custom vpc id"
  type        = string
  default     = ""
}

variable "subnets_id" {
  description = "List of exactly two subnets"
  type        = list
  default     = []
}

variable "create_user" {
  description = "Whether to create user or not"
  type = bool
  default = true
}

variable "user_arn" {
  description = "User arn"
  type = string
  default = ""
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

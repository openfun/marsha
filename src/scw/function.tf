
resource "scaleway_function_namespace" "main" {
  name        = "marsha"
  description = "Namespace to gather all functions dedicated to Marsha"
}

resource "scaleway_function" "transfer" {
  namespace_id = scaleway_function_namespace.main.id
  name         = "${terraform.workspace}-marsha-transfer"
  runtime      = "node18"
  handler      = "index.handler"
  privacy      = "private"
  zip_file     = "dist/marsha_transfer.zip"
  zip_hash     = filesha256("dist/marsha_transfer.zip")
  http_option  = "redirected"
  deploy       = true

  environment_variables = {
      DISABLE_SSL_VALIDATION = var.disable_ssl_validation
      MARSHA_BASE_URL = var.marsha_base_url
      SHARED_SECRET = var.shared_secret
      ENV_TYPE = terraform.workspace
      S3_ACCESS_KEY = var.s3_access_key
      S3_SECRET_KEY = var.s3_secret_key
      S3_REGION = var.s3_region

  }
}

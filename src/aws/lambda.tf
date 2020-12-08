# Configuration
#################

resource "aws_lambda_function" "marsha_configure_lambda" {
  function_name    = "${terraform.workspace}-marsha-configure"
  image_uri        = "${var.lambda_image_name}:${var.lambda_image_tag}"
  package_type     = "Image"
  role             = aws_iam_role.lambda_invocation_role.arn

  # The configuration lambda is invocated by Terraform upon deployment and may take
  # some time (for example when creating all the media convert presets from scratch)
  timeout = 60

  image_config {
    command = ["/var/task/lambda-configure/index.handler"]
  }

  environment {
    variables = {
      ENV_TYPE = terraform.workspace
    }
  }
}

# Call the configuration lambda to create a Media Convert endpoint
data "aws_lambda_invocation" "configure_lambda_endpoint" {
  depends_on    = [aws_lambda_function.marsha_configure_lambda]
  function_name = aws_lambda_function.marsha_configure_lambda.function_name

  input = <<EOF
{"Resource": "MediaConvertEndPoint"}
EOF
}

# Encoding
############

resource "aws_lambda_function" "marsha_encode_lambda" {
  function_name    = "${terraform.workspace}-marsha-encode"
  image_uri        = "${var.lambda_image_name}:${var.lambda_image_tag}"
  package_type     = "Image"
  role             = aws_iam_role.lambda_invocation_role.arn
  memory_size      = "1536"
  timeout          = "90"

  image_config {
    command = ["/var/task/lambda-encode/index.handler"]
  }

  environment {
    variables = {
      DISABLE_SSL_VALIDATION = var.update_state_disable_ssl_validation
      ENDPOINT = "${var.marsha_base_url}${var.update_state_endpoint}"
      ENV_TYPE = terraform.workspace
      MEDIA_CONVERT_ROLE      = aws_iam_role.media_convert_role.arn
      MEDIA_CONVERT_END_POINT = jsondecode(data.aws_lambda_invocation.configure_lambda_endpoint.result)["EndpointUrl"]
      S3_DESTINATION_BUCKET   = aws_s3_bucket.marsha_destination.id
      SHARED_SECRET = var.update_state_secret
    }
  }
}

resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.marsha_encode_lambda.arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.marsha_source.arn
}

# Confirmation
################

resource "aws_lambda_function" "marsha_complete_lambda" {
  function_name    = "${terraform.workspace}-marsha-complete"
  image_uri        = "${var.lambda_image_name}:${var.lambda_image_tag}"
  package_type     = "Image"
  role             = aws_iam_role.lambda_invocation_role.arn

  image_config {
    command = ["/var/task/lambda-complete/index.handler"]
  }

  environment {
    variables = {
      DISABLE_SSL_VALIDATION = var.update_state_disable_ssl_validation
      ENDPOINT = "${var.marsha_base_url}${var.update_state_endpoint}"
      ENV_TYPE = terraform.workspace
      SHARED_SECRET = var.update_state_secret
    }
  }
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.marsha_complete_lambda.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.marsha_encode_complete_rule.arn
}

# Migrations
################
resource "aws_lambda_function" "marsha_migrate_lambda" {
  function_name    = "${terraform.workspace}-marsha-migrate"
  image_uri        = "${var.lambda_image_name}:${var.lambda_image_tag}"
  package_type     = "Image"
  role             = aws_iam_role.lambda_migrate_invocation_role.arn

  timeout = 900

  image_config {
    command = ["/var/task/lambda-migrate/index.handler"]
  }

  environment {
    variables = {
      S3_SOURCE_BUCKET        = aws_s3_bucket.marsha_source.id
      LAMBDA_ENCODE_NAME      = aws_lambda_function.marsha_encode_lambda.function_name
      NODE_ENV                = "production"
    }
  }
}

# Invoke marsha-migrate lambda on each deploy with an empty input
data "aws_lambda_invocation" "invoke_migration" {
  depends_on    = [
    aws_lambda_function.marsha_migrate_lambda,
    aws_lambda_function.marsha_encode_lambda
  ]
  function_name     = aws_lambda_function.marsha_migrate_lambda.function_name
  input             = jsonencode({
    "migrations" = var.migrations
  })
}

# MediaLive
###########

resource "aws_lambda_function" "marsha_medialive_lambda" {
  function_name    = "${terraform.workspace}-${var.medialive_lambda_name}"
  image_uri        = "${var.lambda_image_name}:${var.lambda_image_tag}"
  package_type     = "Image"
  role             = aws_iam_role.lambda_medialive_invocation_role.arn

  image_config {
    command = ["/var/task/lambda-medialive/index.handler"]
  }

  environment {
    variables = {
      DISABLE_SSL_VALIDATION = var.update_state_disable_ssl_validation
      MARSHA_URL = var.marsha_base_url
      SHARED_SECRET = var.update_state_secret
    }
  }
}

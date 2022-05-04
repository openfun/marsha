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

# Call the configuration lambda to create Media Convert presets
# Passing as argument the endpoint url that we just retrieved
data "aws_lambda_invocation" "configure_lambda_presets" {
  depends_on    = [
    aws_lambda_function.marsha_configure_lambda,
    data.aws_lambda_invocation.configure_lambda_endpoint
  ]
  function_name = aws_lambda_function.marsha_configure_lambda.function_name

  input = jsonencode({
    "Resource": "MediaConvertPresets",
    "EndPoint": jsondecode(data.aws_lambda_invocation.configure_lambda_endpoint.result)["EndpointUrl"]
  })
}

# Convert
###########

resource "aws_lambda_function" "marsha_convert_lambda" {
  function_name    = "${terraform.workspace}-marsha-convert"
  image_uri        = "${var.lambda_image_name}:${var.lambda_image_tag}"
  package_type     = "Image"
  role             = aws_iam_role.lambda_invocation_role.arn
  memory_size      = "1536"
  timeout          = "90"

  image_config {
    command = ["/var/task/lambda-convert/index.handler"]
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
  function_name = aws_lambda_function.marsha_convert_lambda.arn
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
  source_arn    = aws_cloudwatch_event_rule.marsha_convert_complete_rule.arn
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
      LAMBDA_CONVERT_NAME     = aws_lambda_function.marsha_convert_lambda.function_name
      NODE_ENV                = "production"
    }
  }
}

# Invoke marsha-migrate lambda on each deploy with an empty input
data "aws_lambda_invocation" "invoke_migration" {
  depends_on    = [
    aws_lambda_function.marsha_migrate_lambda,
    aws_lambda_function.marsha_convert_lambda
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
  timeout          = 120

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

# Mediapackage

data "aws_region" "current" {}

resource "aws_lambda_function" "marsha_mediapackage_lambda" {
  function_name    = "${terraform.workspace}-${var.mediapackage_lambda_name}"
  image_uri        = "${var.lambda_image_name}:${var.lambda_image_tag}"
  package_type     = "Image"
  role             = aws_iam_role.lambda_mediapackage_invocation_role.arn
  timeout          = 90

  image_config {
    command = ["/var/task/lambda-mediapackage/index.handler"]
  }

  environment {
    variables = {
      CLOUDFRONT_ENDPOINT = aws_cloudfront_distribution.marsha_cloudfront_distribution.domain_name
      CONTAINER_NAME = "${terraform.workspace}-marsha-ffmpeg-transmux"
      DESTINATION_BUCKET_NAME = aws_s3_bucket.marsha_destination.bucket
      DESTINATION_BUCKET_REGION = data.aws_region.current.name
      DISABLE_SSL_VALIDATION = var.update_state_disable_ssl_validation
      ECS_CLUSTER = aws_ecs_cluster.marsha_ffmpeg_transmux_cluster.arn
      ECS_TASK_DEFINITION = aws_ecs_task_definition.marsha_ffmpeg_transmux_definition.arn
      MARSHA_URL = var.marsha_base_url
      RECORDING_SLICES_MANIFEST_ENDPOINT = "${var.marsha_base_url}${var.recording_slices_manifest_endpoint}"
      RECORDING_SLICES_STATE_ENDPOINT = "${var.marsha_base_url}${var.recording_slices_state_endpoint}"
      SECURITY_GROUP = aws_security_group.fargate_ffmpeg_transmux_security_group.id
      SHARED_SECRET = var.update_state_secret
      VPC_SUBNET1 = aws_subnet.fargate_ffmpeg_transmux_vpc_public_subnet1.id
      VPC_SUBNET2 = aws_subnet.fargate_ffmpeg_transmux_vpc_public_subnet2.id
    }
  }
}

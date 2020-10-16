# Lambda Layers
###############

resource "aws_lambda_layer_version" "media_info_layer" {
  filename    = "layers/MediaInfo_CLI_20.03.20200523_Lambda.zip"
  source_code_hash = "${base64sha256(file("layers/MediaInfo_CLI_20.03.20200523_Lambda.zip"))}"
  layer_name  = "media_info_layer"

  description = "Layer containing mediainfo binary file compatible with AWS lambda servers (from https://mediaarea.net/download/snapshots/binary/mediainfo/)"
}

# Configuration
#################

resource "aws_lambda_function" "marsha_configure_lambda" {
  function_name    = "${terraform.workspace}-marsha-configure"
  handler          = "index.handler"
  # Run on the highest version of node available on AWS lambda
  # https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime          = "nodejs10.x"
  filename         = "dist/marsha_configure.zip"
  source_code_hash = "${base64sha256(file("dist/marsha_configure.zip"))}"
  role             = "${aws_iam_role.lambda_invocation_role.arn}"

  # The configuration lambda is invocated by Terraform upon deployment and may take
  # some time (for example when creating all the media convert presets from scratch)
  timeout = 60

  environment {
    variables = {
      ENV_TYPE = "${terraform.workspace}"
    }
  }
}

# Call the configuration lambda to create a Media Convert endpoint
data "aws_lambda_invocation" "configure_lambda_endpoint" {
  depends_on    = ["aws_lambda_function.marsha_configure_lambda"]
  function_name = "${aws_lambda_function.marsha_configure_lambda.function_name}"

  input = <<EOF
{"Resource": "MediaConvertEndPoint"}
EOF
}

# Call the configuration lambda to create Media Convert presets
# Passing as argument the endpoint url that we just retrieved
data "aws_lambda_invocation" "configure_lambda_presets" {
  depends_on    = ["aws_lambda_function.marsha_configure_lambda"]
  function_name = "${aws_lambda_function.marsha_configure_lambda.function_name}"

  input = <<EOF
{
  "Resource": "MediaConvertPresets",
  "EndPoint": "${data.aws_lambda_invocation.configure_lambda_endpoint.result_map["EndpointUrl"]}"
}
EOF
}

# Encoding
############

resource "aws_lambda_function" "marsha_encode_lambda" {
  function_name    = "${terraform.workspace}-marsha-encode"
  handler          = "index.handler"
  # Run on the highest version of node available on AWS lambda
  # https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime          = "nodejs10.x"
  filename         = "dist/marsha_encode.zip"
  source_code_hash = "${base64sha256(file("dist/marsha_encode.zip"))}"
  role             = "${aws_iam_role.lambda_invocation_role.arn}"
  memory_size      = "1536"
  timeout          = "90"
  layers           = ["${aws_lambda_layer_version.media_info_layer.arn}"]
  depends_on       = ["aws_lambda_layer_version.media_info_layer"]


  environment {
    variables = {
      DISABLE_SSL_VALIDATION = "${var.update_state_disable_ssl_validation}"
      ENDPOINT = "${var.marsha_base_url}${var.update_state_endpoint}"
      ENV_TYPE = "${terraform.workspace}"
      MEDIA_CONVERT_ROLE      = "${aws_iam_role.media_convert_role.arn}"
      MEDIA_CONVERT_END_POINT = "${data.aws_lambda_invocation.configure_lambda_endpoint.result_map["EndpointUrl"]}"
      S3_DESTINATION_BUCKET   = "${aws_s3_bucket.marsha_destination.id}"
      SHARED_SECRET = "${var.update_state_secret}"
    }
  }
}

resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.marsha_encode_lambda.arn}"
  principal     = "s3.amazonaws.com"
  source_arn    = "${aws_s3_bucket.marsha_source.arn}"
}

# Confirmation
################

resource "aws_lambda_function" "marsha_complete_lambda" {
  function_name    = "${terraform.workspace}-marsha-complete"
  handler          = "index.handler"
  # Run on the highest version of node available on AWS lambda
  # https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime          = "nodejs10.x"
  filename         = "dist/marsha_complete.zip"
  source_code_hash = "${base64sha256(file("dist/marsha_complete.zip"))}"
  role             = "${aws_iam_role.lambda_invocation_role.arn}"

  environment {
    variables = {
      DISABLE_SSL_VALIDATION = "${var.update_state_disable_ssl_validation}"
      ENDPOINT = "${var.marsha_base_url}${var.update_state_endpoint}"
      ENV_TYPE = "${terraform.workspace}"
      SHARED_SECRET = "${var.update_state_secret}"
    }
  }
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.marsha_complete_lambda.arn}"
  principal     = "events.amazonaws.com"
  source_arn    = "${aws_cloudwatch_event_rule.marsha_encode_complete_rule.arn}"
}

# Migrations
################
resource "aws_lambda_function" "marsha_migrate_lambda" {
  function_name    = "${terraform.workspace}-marsha-migrate"
  handler          = "index.handler"
  # Run on the highest version of node available on AWS lambda
  # https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime          = "nodejs10.x"
  filename         = "dist/marsha_migrate.zip"
  source_code_hash = "${base64sha256(file("dist/marsha_migrate.zip"))}"
  role             = "${aws_iam_role.lambda_migrate_invocation_role.arn}"

  timeout = 900

  environment {
    variables = {
      S3_SOURCE_BUCKET        = "${aws_s3_bucket.marsha_source.id}"
      MIGRATIONS              = "${var.migrations}"
      LAMBDA_ENCODE_NAME      = "${aws_lambda_function.marsha_encode_lambda.function_name}"
      NODE_ENV                = "production"
    }
  }
}

# Invoke marsha-migrate lambda on each deploy with an empty input
data "aws_lambda_invocation" "invoke_migration" {
  depends_on    = [
    "aws_lambda_function.marsha_migrate_lambda",
    "aws_lambda_function.marsha_encode_lambda"
  ]
  function_name     = "${aws_lambda_function.marsha_migrate_lambda.function_name}"
  input = "{}"
}

# MediaLive
###########

resource "aws_lambda_function" "marsha_medialive_routing_lambda" {
  function_name    = "marsha-medialive-routing"
  handler          = "index.handler"
  # Run on the highest version of node available on AWS lambda
  # https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime          = "nodejs10.x"
  filename         = "dist/marsha_medialive-routing.zip"
  source_code_hash = "${base64sha256(file("dist/marsha_medialive-routing.zip"))}"
  role             = "${aws_iam_role.lambda_medialive_routing_invocation_role.arn}"

  environment {
    variables = {
      MEDIALIVE_LAMBDA_NAME = "${var.medialive_lambda_name}"
    }
  }
}

resource "aws_lambda_permission" "allow_cloudwatch_medialive_routing" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.marsha_medialive_routing_lambda.arn}"
  principal     = "events.amazonaws.com"
  source_arn    = "${aws_cloudwatch_event_rule.marsha_medialive_routing_channel_state_change.arn}"
}

resource "aws_lambda_function" "marsha_medialive_lambda" {
  function_name    = "${terraform.workspace}-${var.medialive_lambda_name}"
  handler          = "index.handler"
  # Run on the highest version of node available on AWS lambda
  # https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime          = "nodejs10.x"
  filename         = "dist/marsha_medialive.zip"
  source_code_hash = "${base64sha256(file("dist/marsha_medialive.zip"))}"
  role             = "${aws_iam_role.lambda_medialive_invocation_role.arn}"

  environment {
    variables = {
      DISABLE_SSL_VALIDATION = "${var.update_state_disable_ssl_validation}"
      MARSHA_URL = "${var.marsha_base_url}"
      SHARED_SECRET = "${var.update_state_secret}"
    }
  }
}

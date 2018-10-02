# Configuration
#################

resource "aws_lambda_function" "marsha_configure_lambda" {
  function_name    = "${terraform.workspace}-marsha-configure"
  handler          = "index.handler"
  runtime          = "nodejs8.10"
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
  runtime          = "nodejs8.10"
  filename         = "dist/marsha_encode.zip"
  source_code_hash = "${base64sha256(file("dist/marsha_encode.zip"))}"
  role             = "${aws_iam_role.lambda_invocation_role.arn}"

  environment {
    variables = {
      ENV_TYPE                = "${terraform.workspace}"
      S3_DESTINATION_BUCKET   = "${aws_s3_bucket.marsha_destination.id}"
      MEDIA_CONVERT_ROLE      = "${aws_iam_role.media_convert_role.arn}"
      MEDIA_CONVERT_END_POINT = "${data.aws_lambda_invocation.configure_lambda_endpoint.result_map["EndpointUrl"]}"
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

resource "aws_lambda_function" "marsha_confirm_lambda" {
  function_name    = "${terraform.workspace}-marsha-confirm"
  handler          = "index.handler"
  runtime          = "nodejs8.10"
  filename         = "dist/marsha_confirm.zip"
  source_code_hash = "${base64sha256(file("dist/marsha_confirm.zip"))}"
  role             = "${aws_iam_role.lambda_invocation_role.arn}"

  environment {
    variables = {
      ENDPOINT = "${var.upload_confirm_endpoint}"
      ENV_TYPE = "${terraform.workspace}"
      SHARED_SECRET = "${var.upload_confirm_secret}"
    }
  }
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.marsha_confirm_lambda.arn}"
  principal     = "events.amazonaws.com"
  source_arn    = "${aws_cloudwatch_event_rule.marsha_encode_complete_rule.arn}"
}

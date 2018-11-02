# Lambda invocation role
#########################

resource "aws_iam_role" "lambda_invocation_role" {
  name = "${terraform.workspace}-marsha-lambda-invocation-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "lambda_logging_policy" {
  name        = "${terraform.workspace}-marsha-lambda-logging-policy"
  path        = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logging_policy_attachment" {
  role       = "${aws_iam_role.lambda_invocation_role.name}"
  policy_arn = "${aws_iam_policy.lambda_logging_policy.arn}"
}

resource "aws_iam_policy" "lambda_media_convert_policy" {
  name        = "${terraform.workspace}-marsha-lambda-media-convert-policy"
  path        = "/"
  description = "IAM policy for configuring media convert from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "mediaconvert:CreateJob",
        "mediaconvert:CreatePreset",
        "mediaconvert:GetPreset",
        "mediaconvert:UpdatePreset",
        "mediaconvert:DescribeEndpoints"
      ],
      "Resource": "arn:aws:mediaconvert:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_media_convert_policy_attachment" {
  role       = "${aws_iam_role.lambda_invocation_role.name}"
  policy_arn = "${aws_iam_policy.lambda_media_convert_policy.arn}"
}

resource "aws_iam_policy" "lambda_pass_role_policy" {
  name        = "${terraform.workspace}-marsha-lambda-pass-role-policy"
  path        = "/"
  description = "IAM policy for passing a role from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": ["iam:PassRole"],
      "Resource": "${aws_iam_role.media_convert_role.arn}",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_pass_role_policy_attachment" {
  role       = "${aws_iam_role.lambda_invocation_role.name}"
  policy_arn = "${aws_iam_policy.lambda_pass_role_policy.arn}"
}

# Media Convert role
#####################

resource "aws_iam_role" "media_convert_role" {
  name = "${terraform.workspace}-marsha-media-convert-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "mediaconvert.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "media_convert_s3_policy" {
  name        = "${terraform.workspace}-marsha-media-convert-s3-policy"
  path        = "/"
  description = "IAM policy for accessing S3 from Media Convert"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:*"
      ],
      "Resource":[
          "arn:aws:s3:::${aws_s3_bucket.marsha_source.id}/*",
          "arn:aws:s3:::${aws_s3_bucket.marsha_destination.id}/*"
      ],
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "media_convert_s3_policy_attachment" {
  role       = "${aws_iam_role.media_convert_role.name}"
  policy_arn = "${aws_iam_policy.media_convert_s3_policy.arn}"
}

# Event rule role
###################

resource "aws_iam_role" "event_rule_role" {
  name = "${terraform.workspace}-marsha-event-rule-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "event_rule_lambda_invoke_policy" {
  name        = "${terraform.workspace}-marsha-event-lambda-invoke-policy"
  path        = "/"
  description = "IAM policy for invoking a lambda from an event rule"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "${aws_lambda_function.marsha_update_state_lambda.arn}",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "event_rule_lambda_invoke_policy_attachment" {
  role       = "${aws_iam_role.event_rule_role.name}"
  policy_arn = "${aws_iam_policy.event_rule_lambda_invoke_policy.arn}"
}

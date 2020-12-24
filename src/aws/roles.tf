
# Global policy added to all lambda to access ECR image
resource "aws_iam_policy" "lambda_ecr_access_policy" {
  name        = "${terraform.workspace}-marsha-lambda-ecr-access-policy"
  path        = "/"
  description = "IAM policy needed by all lambda to access ECR"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ecr:SetRepositoryPolicy",
        "ecr:GetRepositoryPolicy"
      ],
      "Effect": "Allow",
      "Resource": "${var.ecr_lambda_marsha_arn}/"
    }
  ]
}
EOF
}


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

resource "aws_iam_role_policy_attachment" "lambda_invocation_ecr_policy_attachment" {
  role       = aws_iam_role.lambda_invocation_role.name
  policy_arn = aws_iam_policy.lambda_ecr_access_policy.arn
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
  role       = aws_iam_role.lambda_invocation_role.name
  policy_arn = aws_iam_policy.lambda_logging_policy.arn
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
  role       = aws_iam_role.lambda_invocation_role.name
  policy_arn = aws_iam_policy.lambda_media_convert_policy.arn
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
  role       = aws_iam_role.lambda_invocation_role.name
  policy_arn = aws_iam_policy.lambda_pass_role_policy.arn
}

resource "aws_iam_policy" "lambda_s3_access_policy" {
  name        = "${terraform.workspace}-marsha-lambda-s3-access-policy"
  path        = "/"
  description = "IAM policy to read in source bucket and write in destination bucket"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": ["s3:GetObject"],
      "Effect": "Allow",
      "Resource": "arn:aws:s3:::${aws_s3_bucket.marsha_source.bucket}/*"
    },
    {
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Effect": "Allow",
      "Resource": "arn:aws:s3:::${aws_s3_bucket.marsha_destination.bucket}/*"
    }
  ]
}
EOF
}

# `lambda-encode` needs read access to the source bucket and write access to the destination
# bucket to read timed text files from the former and write them to the latter.
resource "aws_iam_role_policy_attachment" "lambda_s3_access_policy_attachment" {
  role        = aws_iam_role.lambda_invocation_role.name
  policy_arn  = aws_iam_policy.lambda_s3_access_policy.arn
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
  role       = aws_iam_role.media_convert_role.name
  policy_arn = aws_iam_policy.media_convert_s3_policy.arn
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
      "Resource": "${aws_lambda_function.marsha_complete_lambda.arn}",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "event_rule_lambda_invoke_policy_attachment" {
  role       = aws_iam_role.event_rule_role.name
  policy_arn = aws_iam_policy.event_rule_lambda_invoke_policy.arn
}

# Migrate lambda role
#####################

resource "aws_iam_role" "lambda_migrate_invocation_role" {
  name = "${terraform.workspace}-marsha-lambda-migrate-invocation-role"

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

resource "aws_iam_role_policy_attachment" "lambda_migrate_logging_policy_attachment" {
  role       = aws_iam_role.lambda_migrate_invocation_role.name
  policy_arn = aws_iam_policy.lambda_logging_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_migrate_ecr_policy_attachment" {
  role       = aws_iam_role.lambda_migrate_invocation_role.name
  policy_arn = aws_iam_policy.lambda_ecr_access_policy.arn
}

resource "aws_iam_policy" "lambda_migrate_s3_access_policy" {
  name        = "${terraform.workspace}-marsha-migrate-lambda-s3-access-policy"
  path        = "/"
  description = "IAM policy needed by lambda-migrate on S3"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": ["s3:ListBucket"],
      "Effect": "Allow",
      "Resource": "arn:aws:s3:::${aws_s3_bucket.marsha_source.bucket}"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_migrate_s3_access_policy_attachment" {
  role        = aws_iam_role.lambda_migrate_invocation_role.name
  policy_arn  = aws_iam_policy.lambda_migrate_s3_access_policy.arn
}

resource "aws_iam_policy" "lambda_migrate_lambda_invoke_policy" {
  name        = "${terraform.workspace}-marsha-migrate-lambda-invoke-policy"
  path        = "/"
  description = "IAM policy needed by lambda-migrate on S3"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "lambda:invokeAsync",
        "lambda:invokeFunction"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:lambda:*:*:function:${aws_lambda_function.marsha_encode_lambda.function_name}"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_migrate_lambda_invoke_policy_attachment" {
  role        = aws_iam_role.lambda_migrate_invocation_role.name
  policy_arn  = aws_iam_policy.lambda_migrate_lambda_invoke_policy.arn
}

# MediaLive role
#####################
resource "aws_iam_role" "medialive_access_role" {
  name = "${terraform.workspace}-marsha-medialive-access-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "medialive.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "ssm_read_only" {
  name        = "${terraform.workspace}-marsha-medialive-ssm-read-only-policy"
  path        = "/"
  description = "IAM policy needed access SSM in read-only mode"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:Describe*",
                "ssm:Get*",
                "ssm:List*"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "medialive_ssm_access_policy_attachment" {
  role        = aws_iam_role.medialive_access_role.name
  policy_arn  = aws_iam_policy.ssm_read_only.arn
}

# Medialive lambda role
#####################
resource "aws_iam_role" "lambda_medialive_invocation_role" {
  name = "${terraform.workspace}-marsha-lambda-medialive-invocation-role"

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


resource "aws_iam_role_policy_attachment" "lambda_medialive_logging_policy_attachment" {
  role       = aws_iam_role.lambda_medialive_invocation_role.name
  policy_arn = aws_iam_policy.lambda_logging_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_medialive_access_ecr_policy_attachment" {
  role       = aws_iam_role.lambda_medialive_invocation_role.name
  policy_arn = aws_iam_policy.lambda_ecr_access_policy.arn
}

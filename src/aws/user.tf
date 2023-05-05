# Define a user and associate appropriate policies
resource "aws_iam_user" "marsha_user" {
  count = var.create_user ? 1 : 0
  name  = "${terraform.workspace}-marsha"
}

resource "aws_iam_access_key" "marsha_access_key" {
  count = var.create_user ? 1 : 0
  user = aws_iam_user.marsha_user[0].name
}

# Grant user access to the source bucket
resource "aws_s3_bucket_policy" "marsha_source_bucket_policy" {
  bucket = aws_s3_bucket.marsha_source.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "User access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${var.create_user ? aws_iam_user.marsha_user[0].arn : var.user_arn}"
      },
      "Action": [ "s3:*" ],
      "Resource": [
        "${aws_s3_bucket.marsha_source.arn}",
        "${aws_s3_bucket.marsha_source.arn}/*"
      ]
    }
  ]
}
EOF
}

# Grant user access to the destination bucket
resource "aws_s3_bucket_policy" "marsha_destination_bucket_policy" {
  bucket = aws_s3_bucket.marsha_destination.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "User access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${var.create_user ? aws_iam_user.marsha_user[0].arn : var.user_arn}"
      },
      "Action": [ "s3:*" ],
      "Resource": [
        "${aws_s3_bucket.marsha_destination.arn}",
        "${aws_s3_bucket.marsha_destination.arn}/*"
      ]
    },
    {
      "Sid": "Cloudfront",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_cloudfront_origin_access_identity.marsha_oai.iam_arn}"
      },
      "Action": "s3:GetObject",
      "Resource": "${aws_s3_bucket.marsha_destination.arn}/*"
    }
  ]
}
EOF
}

# Grant user access to the static bucket
resource "aws_s3_bucket_policy" "marsha_static_bucket_policy" {
  bucket = aws_s3_bucket.marsha_static.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "User access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${var.create_user ? aws_iam_user.marsha_user[0].arn : var.user_arn}"
      },
      "Action": [ "s3:*" ],
      "Resource": [
        "${aws_s3_bucket.marsha_static.arn}",
        "${aws_s3_bucket.marsha_static.arn}/*"
      ]
    },
    {
      "Sid": "Cloudfront",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_cloudfront_origin_access_identity.marsha_oai.iam_arn}"
      },
      "Action": "s3:GetObject",
      "Resource": "${aws_s3_bucket.marsha_static.arn}/*"
    }
  ]
}
EOF
}

# Grant user to manage live streaming. Affects medialive, mediapackage and sns.
resource "aws_iam_user_policy" "live-streaming-policies" {
  count = var.create_user ? 1 : 0
  name = "${terraform.workspace}-marsha-live-streaming-policies"
  user = aws_iam_user.marsha_user[0].name

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MediaLive",
      "Action": [
        "medialive:UpdateInput",
        "medialive:DeleteChannel",
        "medialive:UpdateChannel",
        "medialive:StartChannel",
        "medialive:StopChannel",
        "medialive:CreateTags",
        "medialive:CreateInput",
        "medialive:DescribeInput",
        "medialive:UpdateChannelClass",
        "medialive:DeleteInput",
        "medialive:CreateChannel",
        "medialive:CreateInputSecurityGroup",
        "medialive:DescribeChannel",
        "medialive:ListInputs",
        "medialive:TagResource",
        "medialive:ListInputSecurityGroups",
        "medialive:ListChannels",
        "medialive:BatchUpdateSchedule"
      ],
      "Effect": "Allow",
      "Resource": "*"
    },
    {
      "Sid": "MediaPackage",
      "Effect": "Allow",
      "Action": [
        "mediapackage:DeleteChannel",
        "mediapackage:DeleteOriginEndpoint",
        "mediapackage:CreateOriginEndpoint",
        "mediapackage:DescribeOriginEndpoint",
        "mediapackage:UpdateChannel",
        "mediapackage:ListOriginEndpoints",
        "mediapackage:DescribeChannel",
        "mediapackage:CreateChannel",
        "mediapackage:ListChannels",
        "mediapackage:UpdateOriginEndpoint",
        "mediapackage:TagResource",
        "mediapackage:CreateHarvestJob",
        "mediapackage:ListHarvestJobs"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMPassRole",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "${aws_iam_role.medialive_access_role.arn}"
    },
    {
      "Sid": "IAMPassRoleMediapackage",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "${aws_iam_role.mediapackage_harvest_job_s3_role.arn}"
    },
    {
      "Sid": "SSM",
      "Effect": "Allow",
      "Action": [
        "ssm:PutParameter",
        "ssm:AddTagsToResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": "logs:FilterLogEvents",
      "Resource": "*"
    }
  ]
}
POLICY
}

# Grant user to invoke convert lambda function
resource "aws_iam_user_policy" "convert-lambda-invocation-policy" {
  count = var.create_user ? 1 : 0
  name = "${terraform.workspace}-marsha-convert-lambda-invocation-policy"
  user = aws_iam_user.marsha_user[0].name

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "${aws_lambda_function.marsha_convert_lambda.arn}"
    }
  ]
}
EOF
}


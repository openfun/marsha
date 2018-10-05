# Create source S3 Bucket for uploaded videos to be converted
resource "aws_s3_bucket" "marsha_source" {
  bucket = "${terraform.workspace}-marsha-source"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["POST"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }

  tags {
    Name        = "marsha-source"
    Environment = "${terraform.workspace}"
  }
}

# Create destination S3 Bucket for converted videos and images
resource "aws_s3_bucket" "marsha_destination" {
  bucket = "${terraform.workspace}-marsha-destination"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }

  tags {
    Name        = "marsha-destination"
    Environment = "${terraform.workspace}"
  }
}

# Defines a user that should be able to write to the videos bucket
resource "aws_iam_user" "marsha_user" {
  name = "${terraform.workspace}-marsha"
}

resource "aws_iam_access_key" "marsha_access_key" {
  user = "${aws_iam_user.marsha_user.name}"
}

# Grant user access to the source bucket
resource "aws_s3_bucket_policy" "marsha_source_bucket_policy" {
  bucket = "${aws_s3_bucket.marsha_source.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "User access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_iam_user.marsha_user.arn}"
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
  bucket = "${aws_s3_bucket.marsha_destination.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "User access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_iam_user.marsha_user.arn}"
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

# Add notification invoking Lambda to convert video files each time a video is
# uploaded to the source bucket.
resource "aws_s3_bucket_notification" "marsha_source_bucket_notification" {
  bucket = "${aws_s3_bucket.marsha_source.id}"

  lambda_function {
    lambda_function_arn = "${aws_lambda_function.marsha_encode_lambda.arn}"
    events              = ["s3:ObjectCreated:*"]
  }
}

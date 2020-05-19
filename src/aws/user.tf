# Define a user and associate appropriate policies
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

# Grant user access to the static bucket
resource "aws_s3_bucket_policy" "marsha_static_bucket_policy" {
  bucket = "${aws_s3_bucket.marsha_static.id}"

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

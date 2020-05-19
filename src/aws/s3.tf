# Create source S3 Bucket for uploaded videos to be converted
resource "aws_s3_bucket" "marsha_source" {
  bucket = "${terraform.workspace}-marsha-source"
  acl    = "private"
  region = "${var.aws_region}"

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
  region = "${var.aws_region}"

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

# Create S3 Bucket for static files
resource "aws_s3_bucket" "marsha_static" {
  bucket = "${terraform.workspace}-marsha-static"
  acl    = "private"
  region = "${var.aws_region}"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }

  tags {
    Name        = "marsha-static"
    Environment = "${terraform.workspace}"
  }
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

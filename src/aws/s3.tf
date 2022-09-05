# Create source S3 Bucket for uploaded videos to be converted
resource "aws_s3_bucket" "marsha_source" {
  bucket = "${terraform.workspace}-marsha-source${var.s3_bucket_unique_suffix}"

  tags = {
    Name        = "marsha-source"
    Environment = terraform.workspace
  }
}

resource "aws_s3_bucket_cors_configuration" "marsha_source_cors_rule" {
  bucket = aws_s3_bucket.marsha_source.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["POST"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_acl" "marsha_source_acl" {
  bucket = aws_s3_bucket.marsha_source.id
  acl    = "private"
}

# Create destination S3 Bucket for converted videos and images
resource "aws_s3_bucket" "marsha_destination" {
  bucket = "${terraform.workspace}-marsha-destination${var.s3_bucket_unique_suffix}"

  tags = {
    Name        = "marsha-destination"
    Environment = terraform.workspace
  }
}

resource "aws_s3_bucket_cors_configuration" "marsha_destination_cors_rule" {
  bucket = aws_s3_bucket.marsha_destination.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_acl" "marsha_destination_acl" {
  bucket = aws_s3_bucket.marsha_destination.id
  acl    = "private"
}


# Create S3 Bucket for static files
resource "aws_s3_bucket" "marsha_static" {
  bucket = "${terraform.workspace}-marsha-static${var.s3_bucket_unique_suffix}"

  tags = {
    Name        = "marsha-static"
    Environment = terraform.workspace
  }
}

resource "aws_s3_bucket_cors_configuration" "marsha_static_cors_rule" {
  bucket = aws_s3_bucket.marsha_static.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_acl" "marsha_static_acl" {
  bucket = aws_s3_bucket.marsha_static.id
  acl    = "private"
}

# Add notification invoking Lambda to convert video files each time a video is
# uploaded to the source bucket.
resource "aws_s3_bucket_notification" "marsha_source_bucket_notification" {
  bucket = aws_s3_bucket.marsha_source.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.marsha_convert_lambda.arn
    events              = ["s3:ObjectCreated:*"]
  }
}

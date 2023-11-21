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

resource "aws_s3_bucket_lifecycle_configuration" "marsha_source_lifecycle_configuration" {
  bucket = aws_s3_bucket.marsha_source.id

  rule {
    id = "marsha-source-expiration-rule"
    # Apply to all objects in the bucket
    filter {}

    # A created object will expire after 3 weeks
    expiration {
      days = 21
    } 

    # This rule is enabled
    status = "Enabled"
  }
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

resource "aws_s3_bucket_lifecycle_configuration" "marsha_destination_deleted_lifecycle_configuration" {
  bucket = aws_s3_bucket.marsha_destination.id

  rule {
    id = "marsha-destination-deleted-expiration-rule"
    
    # Apply to deleted objects in the bucket
    filter {
      prefix = "deleted/"
    }

    # A deleted object will expire after 3 weeks
    expiration {
      days = var.deletion_retention_period
    } 

    # This rule is enabled
    status = "Enabled"
  }
}

# Create S3 Bucket for static files
resource "aws_s3_bucket" "marsha_static" {
  bucket = "${terraform.workspace}-marsha-static${var.s3_bucket_unique_suffix}"

  force_destroy = true

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

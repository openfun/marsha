locals {
  s3_origin_id = "marsha-origin"
}

# Create an origin access identity that will allow CloudFront to access S3
# See documentation for details:
# https://www.terraform.io/docs/providers/aws/r/cloudfront_origin_access_identity.html
resource "aws_cloudfront_origin_access_identity" "marsha_oai" {
  comment = "Marsha origin for the ${terraform.workspace} environment"
}

resource "aws_cloudfront_distribution" "marsha_cloudfront_distribution" {
  origin {
    domain_name = "${aws_s3_bucket.marsha_destination.bucket_domain_name}"
    origin_id   = "${local.s3_origin_id}"

    s3_origin_config {
      origin_access_identity = "${aws_cloudfront_origin_access_identity.marsha_oai.cloudfront_access_identity_path}"
    }
  }

  enabled         = true
  is_ipv6_enabled = true

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${local.s3_origin_id}"
    trusted_signers  = ["${var.cloudfront_access_key_id}"]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "${lookup(var.cloudfront_price_class, terraform.workspace, "PriceClass_100")}"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags {
    Environment = "${terraform.workspace}"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

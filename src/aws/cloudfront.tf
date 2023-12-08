locals {
  s3_destination_origin_id = "marsha-destination-origin"
  scw_object_storage_origin_id = "marsha-scw-object-storage-origin"
  static_origin_id = "marsha-static-origin"
}

resource "tls_private_key" "marsha_cloudfront_ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "aws_cloudfront_public_key" "marsha_cloudfront_signer_public_key" {
  comment     = "Public key signing cloudfront urls"
  encoded_key = tls_private_key.marsha_cloudfront_ssh_key.public_key_pem
  name        = "${terraform.workspace}-marsha_cloudfront_signer_public_key"
}

resource "aws_cloudfront_key_group" "marsha_cloudfront_signer_key_group" {
  comment = "Key group containing public key signing cloudfront urls"
  items   = [aws_cloudfront_public_key.marsha_cloudfront_signer_public_key.id]
  name    = "${terraform.workspace}-marsha_cloudfront_signer_key_group"
}

# Create an origin access identity that will allow CloudFront to access S3
# See bucket policies in s3.tf or documentation for more details:
# https://www.terraform.io/docs/providers/aws/r/cloudfront_origin_access_identity.html
resource "aws_cloudfront_origin_access_identity" "marsha_oai" {
  comment = "Marsha origin for the ${terraform.workspace} environment"
}

resource "aws_cloudfront_distribution" "marsha_cloudfront_distribution" {
  # Origin for the destination S3 bucket
  origin {
    domain_name = aws_s3_bucket.marsha_destination.bucket_domain_name
    origin_id   = local.s3_destination_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.marsha_oai.cloudfront_access_identity_path
    }
  }

  # Origin for the scw object storage bucket
  origin {
    domain_name = "${scaleway_object_bucket.marsha_object_bucket.name}.s3.${scaleway_object_bucket.marsha_object_bucket.region}.scw.cloud"
    origin_id   = local.scw_object_storage_origin_id

    custom_origin_config {
      http_port = 80
      https_port = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols = ["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  # Origin for static distribution
  origin {
    domain_name = trimprefix(var.marsha_base_url, "https://")
    origin_id   = local.static_origin_id

    custom_origin_config {
      http_port = 80
      https_port = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols = ["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  wait_for_deployment = false

  ordered_cache_behavior {
    path_pattern     = "scw/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.scw_object_storage_origin_id

    forwarded_values {
      query_string = false
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

   ordered_cache_behavior {
    path_pattern     = "tmp/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.scw_object_storage_origin_id

    forwarded_values {
      query_string = false
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Destination bucket: allow public access by default
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id
    trusted_signers  = []
    trusted_key_groups = [aws_cloudfront_key_group.marsha_cloudfront_signer_key_group.id]

    forwarded_values {
      query_string = false
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Destination bucket: access to MP4 videos is restricted to signed urls/cookies
  ordered_cache_behavior {
    path_pattern     = "*/mp4/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id
    trusted_signers  = []
    trusted_key_groups = [aws_cloudfront_key_group.marsha_cloudfront_signer_key_group.id]

    forwarded_values {
      query_string = true
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "*/document/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id
    trusted_signers  = []
    trusted_key_groups = [aws_cloudfront_key_group.marsha_cloudfront_signer_key_group.id]

    forwarded_values {
      query_string = true
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

    ordered_cache_behavior {
    path_pattern     = "*/markdown-image/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id
    trusted_signers  = []
    trusted_key_groups = [aws_cloudfront_key_group.marsha_cloudfront_signer_key_group.id]

    forwarded_values {
      query_string = true
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "*/depositedfile/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id
    trusted_signers  = []
    trusted_key_groups = [aws_cloudfront_key_group.marsha_cloudfront_signer_key_group.id]

    forwarded_values {
      query_string = true
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "*/sharedlivemedia/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id
    trusted_signers  = []
    trusted_key_groups = [aws_cloudfront_key_group.marsha_cloudfront_signer_key_group.id]

    forwarded_values {
      query_string = true
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Classroom document bucket: public access to allow BBB download
  ordered_cache_behavior {
    path_pattern     = "*/classroomdocument/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id

    forwarded_values {
      query_string = true
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Destination bucket: access to timed text tracks is restricted to signed urls/cookies
  ordered_cache_behavior {
    path_pattern     = "*/timedtext/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id
    trusted_signers  = []
    trusted_key_groups = [aws_cloudfront_key_group.marsha_cloudfront_signer_key_group.id]

    forwarded_values {
      query_string = true
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "*/thumbnails/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id

    forwarded_values {
      query_string = false
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "*/cmaf/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id

    forwarded_values {
      query_string = false
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "*/previews/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_destination_origin_id

    forwarded_values {
      query_string = false
      headers = ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Static bucket: allow public access
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.static_origin_id

    forwarded_values {
      query_string = false
      headers = [
        "Access-Control-Request-Headers",
        "Access-Control-Request-Method",
        "Origin",
        "Accept-Encoding"
      ]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  price_class = lookup(var.cloudfront_price_class, terraform.workspace, "PriceClass_100")

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Environment = terraform.workspace
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

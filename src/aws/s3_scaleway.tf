# Create Scaleway Object Bucket for videos
resource "scaleway_object_bucket" "marsha_object_bucket" {
  name = "${terraform.workspace}-marsha${var.s3_bucket_unique_suffix}"

  tags = {
    Name        = "marsha-object-bucket"
    Environment = terraform.workspace
  }

  lifecycle_rule {
      id      = "tmp-directory-expiration-rule"
      prefix  = "tmp/"
      enabled = true

      expiration {
        days = "21"
      }
  }

  lifecycle_rule {
      id      = "deleted-directory-expiration-rule"
      prefix  = "deleted/"
      enabled = true

      expiration {
        days = var.deletion_retention_period
      }
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }

}

resource "scaleway_object_bucket_acl" "marsha_object_bucket_acl" {
  bucket = scaleway_object_bucket.marsha_object_bucket.name
  acl    = "private"
}

data "scaleway_iam_group" "users_group" {
  group_id = var.scw_group_id
}

resource "scaleway_object_bucket_policy" "policy" {
  bucket = scaleway_object_bucket.marsha_object_bucket.name
  policy = jsonencode(
    {
      Version = "2023-04-17",
      Id      = "marsha-object-bucket-policy",
      Statement = [
        {
          Sid    = "Give GetObject to All Users",
          Effect = "Allow",
          Principal = "*",
          Action = "s3:GetObject",
          Resource = [
            "${scaleway_object_bucket.marsha_object_bucket.name}/vod/*",
            "${scaleway_object_bucket.marsha_object_bucket.name}/tmp/*"
          ]
        },
        {
          Sid    = "Give All Permissions to marsha user",
          Effect = "Allow",
          Principal = {
            SCW = concat(
              [for app in data.scaleway_iam_group.users_group.application_ids : "application_id:${app}"], 
              [for user in data.scaleway_iam_group.users_group.user_ids : "user_id:${user}"]
            )
          },
          Action = "s3:*",
          Resource = [
            "${scaleway_object_bucket.marsha_object_bucket.name}",
            "${scaleway_object_bucket.marsha_object_bucket.name}/*"
          ]
        }
      ]
    }
  )
}
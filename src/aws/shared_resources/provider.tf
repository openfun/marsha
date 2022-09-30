provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    cloudwatch = "http://10.1.0.1:5000"
    cloudfront = "http://10.1.0.1:5000"
    ec2 = "http://10.1.0.1:5000"
    ecr = "http://10.1.0.1:5000"
    ecs = "http://10.1.0.1:5000"
    eks = "http://10.1.0.1:5000"
    iam = "http://10.1.0.1:5000"
    lambda = "http://10.1.0.1:5000"
    medialive = "http://10.1.0.1:5000"
    mediapackage = "http://10.1.0.1:5000"
    mediaconvert = "http://10.1.0.1:5000"
    s3  = "http://10.1.0.1:5000"
    route53 = "http://10.1.0.1:5000"
  }
}

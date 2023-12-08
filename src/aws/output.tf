output "cloudfront_domain" {
  value = aws_cloudfront_distribution.marsha_cloudfront_distribution.domain_name
}

output "cloudfront_publick_key_id" {
  value = aws_cloudfront_public_key.marsha_cloudfront_signer_public_key.id
}

output "cloudfront_ssh_private_key" {
  value = tls_private_key.marsha_cloudfront_ssh_key.private_key_pem
  sensitive = true
}

output "endpoint" {
  value = data.aws_lambda_invocation.configure_lambda_endpoint.result
}

output "presets" {
  value = data.aws_lambda_invocation.configure_lambda_presets.result
}

output "iam_trusted_signer_access_key_id" {
  value = aws_iam_access_key.marsha_access_key.*.id
}

output "iam_secret_access_key" {
  value = aws_iam_access_key.marsha_access_key.*.secret
  sensitive = true
}

output "medialive_role_arn" {
  value = aws_iam_role.medialive_access_role.arn
}

output "mediapackage_harvest_job_role_arn" {
  value = aws_iam_role.mediapackage_harvest_job_s3_role.arn
}

output "scaleway_object_bucket_name" {
  value = scaleway_object_bucket.marsha_object_bucket.name
}

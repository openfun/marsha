output "cloudfront_url" {
  value = "${aws_cloudfront_distribution.marsha_cloudfront_distribution.domain_name}"
}

output "endpoint" {
  value = "${data.aws_lambda_invocation.configure_lambda_endpoint.result}"
}

output "presets" {
  value = "${data.aws_lambda_invocation.configure_lambda_presets.result}"
}

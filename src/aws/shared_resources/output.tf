output "ecr_lambda_arn" {
  value = aws_ecr_repository.marsha_lambda.arn
}

output "ecr_lambda_url" {
  value = aws_ecr_repository.marsha_lambda.repository_url
}

resource "aws_ecr_repository" "marsha_lambda" {
  name                 = "marsha/lambda"
  image_tag_mutability = "MUTABLE"
}

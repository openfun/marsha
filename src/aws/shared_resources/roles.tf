# Medialive routing role
#####################
resource "aws_iam_policy" "lambda_logging_policy" {
  name        = "marsha-lambda-logging-policy"
  path        = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role" "lambda_medialive_routing_invocation_role" {
  name = "marsha-lambda-medialive-routing-invocation-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}


resource "aws_iam_role_policy_attachment" "lambda_medialive_routing_logging_policy_attachment" {
  role       = aws_iam_role.lambda_medialive_routing_invocation_role.name
  policy_arn = aws_iam_policy.lambda_logging_policy.arn
}

resource "aws_iam_policy" "lambda_medialive_routing_access_policy" {
  name        = "marsha-medialive-routing-access-policy"
  path        = "/"
  description = "IAM policy needed by lambda-medialive-routing to access medialive and lambda functions"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "medialive:describeChannel",
        "lambda:invokeAsync",
        "lambda:invokeFunction"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_medialive_routing_access_policy_attachment" {
  role       = aws_iam_role.lambda_medialive_routing_invocation_role.name
  policy_arn = aws_iam_policy.lambda_medialive_routing_access_policy.arn
}

resource "aws_iam_policy" "lambda_medialive_routing_ecr_access_policy" {
  name        = "marsha-medialive-routing-ecr-access-policy"
  path        = "/"
  description = "IAM policy needed by lambda-medialive-routing to access ECR"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ecr:SetRepositoryPolicy",
        "ecr:GetRepositoryPolicy"
      ],
      "Effect": "Allow",
      "Resource": "${aws_ecr_repository.marsha_lambda.arn}/"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_medialive_routing_ecr_access_policy_attachment" {
  role       = aws_iam_role.lambda_medialive_routing_invocation_role.name
  policy_arn = aws_iam_policy.lambda_medialive_routing_ecr_access_policy.arn
}

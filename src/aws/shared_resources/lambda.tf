resource "aws_lambda_function" "marsha_elemental_routing_lambda" {
  function_name    = "marsha-elemental-routing"
  # Run on the highest version of node available on AWS lambda
  # https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  package_type     = "Image"
  image_uri        = "${aws_ecr_repository.marsha_lambda.repository_url}:${var.lambda_image_tag}"
  role             = aws_iam_role.lambda_elemental_routing_invocation_role.arn

  image_config {
    command = ["/var/task/lambda-elemental-routing/index.handler"]
  }

  environment {
    variables = {
      MEDIALIVE_LAMBDA_NAME = var.medialive_lambda_name
      MEDIAPACKAGE_LAMBDA_NAME = var.mediapackage_lambda_name
    }
  }
}

resource "aws_lambda_permission" "allow_cloudwatch_medialive_routing" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.marsha_elemental_routing_lambda.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.marsha_elemental_routing_channel_state_change.arn
}

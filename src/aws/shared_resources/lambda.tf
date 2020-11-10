resource "aws_lambda_function" "marsha_medialive_routing_lambda" {
  function_name    = "marsha-medialive-routing"
  handler          = "index.handler"
  # Run on the highest version of node available on AWS lambda
  # https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime          = "nodejs10.x"
  filename         = "dist/marsha_medialive-routing.zip"
  source_code_hash = filebase64sha256("../dist/marsha_medialive-routing.zip")
  role             = aws_iam_role.lambda_medialive_routing_invocation_role.arn

  environment {
    variables = {
      MEDIALIVE_LAMBDA_NAME = var.medialive_lambda_name
    }
  }
}

resource "aws_lambda_permission" "allow_cloudwatch_medialive_routing" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.marsha_medialive_routing_lambda.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.marsha_medialive_routing_channel_state_change.arn
}

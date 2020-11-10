resource "aws_cloudwatch_event_rule" "marsha_medialive_routing_channel_state_change" {
  name        = "marsha-medialive-routing-channel-state-change"
  description = "Fires each time a medialive channel state changes."

  event_pattern = <<PATTERN
{
  "source": [
    "aws.medialive"
  ]
}
PATTERN
}


resource "aws_cloudwatch_event_target" "marsha_medialive_routing_channel_state_change_target" {
  rule      = aws_cloudwatch_event_rule.marsha_medialive_routing_channel_state_change.name
  target_id = "medialive"
  arn       = aws_lambda_function.marsha_medialive_routing_lambda.arn
}

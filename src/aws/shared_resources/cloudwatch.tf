resource "aws_cloudwatch_event_rule" "marsha_elemental_routing_channel_state_change" {
  name        = "marsha-elemental-routing-channel-state-change"
  description = "Fires on every elemental events."

  event_pattern = <<PATTERN
{
  "source": [
    "aws.medialive"
  ]
}
PATTERN
}


resource "aws_cloudwatch_event_target" "marsha_elemental_routing_channel_state_change_target" {
  rule      = aws_cloudwatch_event_rule.marsha_elemental_routing_channel_state_change.name
  target_id = "elemental"
  arn       = aws_lambda_function.marsha_elemental_routing_lambda.arn
}

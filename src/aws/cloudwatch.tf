resource "aws_cloudwatch_event_rule" "marsha_encode_complete_rule" {
  name        = "${terraform.workspace}-marsha-encode-complete-rule"
  description = "Fires each time the encoding of a video source by MediaConvert is completed."

  event_pattern = <<PATTERN
{
  "source": [ "aws.mediaconvert" ],
  "detail": {
    "status": [ "COMPLETE" ],
    "userMetadata": {
      "Bucket": [ "${aws_s3_bucket.marsha_source.id}" ]
    }
  }
}
PATTERN
}

resource "aws_cloudwatch_event_target" "marsha_encode_complete_target" {
  rule      = "${aws_cloudwatch_event_rule.marsha_encode_complete_rule.name}"
  target_id = "check_foo"
  arn       = "${aws_lambda_function.marsha_complete_lambda.arn}"
}

resource "aws_cloudwatch_event_rule" "marsha_medialive_channel_state_change" {
  name        = "${terraform.workspace}-marsha-medialive-channel-state-change"
  description = "Fires each time a medialive channel state changes."

  event_pattern = <<PATTERN
{
  "source": [
    "aws.medialive"
  ],
  "detail-type": [
    "MediaLive Channel State Change"
  ]
}
PATTERN
}


resource "aws_cloudwatch_event_target" "marsha_medialive_channel_state_change_target" {
  rule      = "${aws_cloudwatch_event_rule.marsha_medialive_channel_state_change.name}"
  target_id = "medialive"
  arn       = "${aws_lambda_function.marsha_medialive_lambda.arn}"
}

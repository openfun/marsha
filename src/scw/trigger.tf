
resource "scaleway_function_trigger" "main_sqs" {
  function_id = scaleway_function.transfer.id
  name        = "${terraform.workspace}-marsha-transfer"

  sqs {
    queue = scaleway_mnq_sqs_queue.transfer.name
  }
}
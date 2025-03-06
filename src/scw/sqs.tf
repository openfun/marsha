
# Activate SQS in the current project
resource "scaleway_mnq_sqs" "main" {}

resource "scaleway_mnq_sqs_credentials" "main" {
  name = "sqs-credentials"

  permissions {
    can_publish = true
    can_receive = true
    can_manage  = true
  }
}

resource "scaleway_mnq_sqs_queue" "transfer" {
  name = "${terraform.workspace}-marsha-transfer"

  access_key = scaleway_mnq_sqs_credentials.main.access_key
  secret_key = scaleway_mnq_sqs_credentials.main.secret_key
}

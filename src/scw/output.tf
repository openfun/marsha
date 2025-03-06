

output "transfer_function_endpoint" {
  value = scaleway_mnq_sqs_queue.transfer.url
}

output "queue_access_key" {
  value = scaleway_mnq_sqs_credentials.main.access_key
  sensitive = true
}

output "queue_secret_key" {
  value = scaleway_mnq_sqs_credentials.main.secret_key
  sensitive = true
}

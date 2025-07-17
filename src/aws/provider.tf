terraform {
  required_providers {
    scaleway = {
      source = "scaleway/scaleway"
      version = "2.31.0"
    }
    tls = {
      source = "hashicorp/tls"
      version = "3.3.0"
    }
  }
}

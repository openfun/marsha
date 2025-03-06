
terraform {
  required_providers {
    scaleway = {
      source = "scaleway/scaleway"
      version = "2.51.0"
    }
  }
  required_version = ">= 0.13"
}

provider "scaleway" {
  zone   = "fr-par-1"
  region = "fr-par"
}

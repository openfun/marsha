# A separate terraform project that just creates the bucket where
# we will store the state. It needs to be created before the other
# project because that's where the other project will store its
# state.

provider "aws" {}

resource "aws_s3_bucket" "state" {
  bucket = "marsha-terraform"
  acl    = "private"

  versioning {
    enabled = true
  }

  tags {
    Name = "terraform"
  }
}

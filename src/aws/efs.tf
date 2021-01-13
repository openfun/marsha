resource "aws_efs_file_system" "marsha_efs" {
  performance_mode = lookup(var.efs_performace_mode, terraform.workspace, "generalPurpose")
  encrypted        = true

  tags = {
    Name        = "${terraform.workspace}-marsha-efs"
    Environment = terraform.workspace
  }
}

resource "aws_efs_mount_target" "marsha_efs_to_mediapckage_lambda" {
  file_system_id = aws_efs_file_system.marsha_efs.id
  subnet_id      = aws_subnet.lambda_mediapackage_vpc_private_subnet.id
}

resource "aws_efs_access_point" "marsha_efs_to_mediapckage_lambda_access_point" {
  file_system_id = aws_efs_file_system.marsha_efs.id
  
  posix_user {
    gid = 1001
    uid = 1001
  }

  root_directory {
    path = "/transcoded_video"
    creation_info {
      owner_gid = 1001
      owner_uid = 1001
      permissions = 0750
    }
  }
}

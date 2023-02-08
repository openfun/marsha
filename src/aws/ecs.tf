resource "aws_ecs_cluster" "marsha_ffmpeg_transmux_cluster" {
  name = "${terraform.workspace}-marsha"
}

resource "aws_ecs_service" "marsha_ffmpeg_transmux_service" {
  name            = "${terraform.workspace}-marsha-ffmpeg-transmux-service"
  cluster         = aws_ecs_cluster.marsha_ffmpeg_transmux_cluster.id
  task_definition = aws_ecs_task_definition.marsha_ffmpeg_transmux_definition.arn
  launch_type     = "FARGATE"

  network_configuration {
    subnets = var.create_vpc ? [aws_subnet.fargate_ffmpeg_transmux_vpc_public_subnet1[0].id, aws_subnet.fargate_ffmpeg_transmux_vpc_public_subnet2[0].id] : var.subnets_id 
    security_groups = [ aws_security_group.fargate_ffmpeg_transmux_security_group.id ]
    assign_public_ip = true
  }

  depends_on = [aws_iam_role.ecs_task_ffmpeg_transmux_execution_role]
}

resource "aws_ecs_task_definition" "marsha_ffmpeg_transmux_definition" {
  family = "${terraform.workspace}-marsha-ffmpeg-transmux-definition"
  container_definitions = <<TASK_DEFINITION
[
  {
    "name": "${terraform.workspace}-marsha-ffmpeg-transmux",
    "dnsSearchDomains": null,
    "environmentFiles": null,
    "logConfiguration": {
      "logDriver": "awslogs",
      "secretOptions": null,
      "options": {
        "awslogs-group": "/ecs/${terraform.workspace}-fargate-ffmpeg-transmux",
        "awslogs-region": "${data.aws_region.current.name}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "entryPoint": [],
    "portMappings": [
      {
        "hostPort": ${var.ffmpeg_transmux_container_port},
        "protocol": "tcp",
        "containerPort": ${var.ffmpeg_transmux_container_port}
      }
    ],
    "command": [],
    "linuxParameters": null,
    "cpu": 0,
    "environment": [
      {
        "name": "DESTINATION_BUCKET_NAME",
        "value": "${aws_s3_bucket.marsha_destination.bucket}"
      }
    ],
    "resourceRequirements": null,
    "ulimits": null,
    "dnsServers": null,
    "mountPoints": [],
    "workingDirectory": null,
    "secrets": null,
    "dockerSecurityOptions": null,
    "memory": null,
    "memoryReservation": ${var.ffmpeg_transmux_container_memory_reservation},
    "volumesFrom": [],
    "stopTimeout": null,
    "image": "${var.ffmpeg_transmux_image_name}:${var.ffmpeg_transmux_image_tag}",
    "startTimeout": null,
    "firelensConfiguration": null,
    "dependsOn": null,
    "disableNetworking": null,
    "interactive": null,
    "healthCheck": null,
    "essential": true,
    "links": [],
    "hostname": null,
    "extraHosts": null,
    "pseudoTerminal": null,
    "user": null,
    "readonlyRootFilesystem": null,
    "dockerLabels": null,
    "systemControls": null,
    "privileged": null
  }
]
TASK_DEFINITION

  execution_role_arn        = aws_iam_role.ecs_task_ffmpeg_transmux_execution_role.arn
  task_role_arn             = aws_iam_role.ecs_task_ffmpeg_transmux_execution_role.arn
  requires_compatibilities  = [ "FARGATE" ]
  network_mode              = "awsvpc"
  memory                    = var.ffmpeg_transmux_container_memory
  cpu                       = var.ffmpeg_transmux_container_cpu
}

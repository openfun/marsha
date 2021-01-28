# FARGATE SERVICE VPC
#####################
resource "aws_vpc" "fargate_ffmpeg_transmux_service_vpc" {
  cidr_block            = "10.0.0.0/16"
  enable_dns_support    = true
  enable_dns_hostnames  = true

  tags = {
    Name        = "${terraform.workspace}-fargate-ffmpeg-transmux-service-vpc"
    Environment = terraform.workspace
  }
}

resource "aws_internet_gateway" "fargate_ffmpeg_transmux_service_gateway" {
  vpc_id = aws_vpc.fargate_ffmpeg_transmux_service_vpc.id

  tags = {
    Name        = "${terraform.workspace}-fargate-ffmpeg-transmux-service-gateway"
    Environment = terraform.workspace
  }
}

resource "aws_subnet" "fargate_ffmpeg_transmux_vpc_public_subnet1" {
  cidr_block = "10.0.0.0/24"
  vpc_id     = aws_vpc.fargate_ffmpeg_transmux_service_vpc.id

  tags = {
    Name        = "${terraform.workspace}-fargate-ffmpeg-transmux-public-subnet-1"
    Environment = terraform.workspace
  }

  depends_on = [aws_internet_gateway.fargate_ffmpeg_transmux_service_gateway]
}

resource "aws_subnet" "fargate_ffmpeg_transmux_vpc_public_subnet2" {
  cidr_block = "10.0.1.0/24"
  vpc_id     = aws_vpc.fargate_ffmpeg_transmux_service_vpc.id

  tags = {
    Name        = "${terraform.workspace}-fargate-ffmpeg-transmux-public-subnet-2"
    Environment = terraform.workspace
  }

  depends_on = [aws_internet_gateway.fargate_ffmpeg_transmux_service_gateway]
}

resource "aws_route_table" "fargate_ffmpeg_transmux_vpc_public_route" {
  vpc_id = aws_vpc.fargate_ffmpeg_transmux_service_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.fargate_ffmpeg_transmux_service_gateway.id
  }

  tags = {
    Name        = "${terraform.workspace}-fargate-ffmpeg-transmux-vpc-public-route"
    Environment = terraform.workspace
  }
}

resource "aws_route_table_association" "fargate_ffmpeg_transmux_public_route_subnet1_association" {
  subnet_id       = aws_subnet.fargate_ffmpeg_transmux_vpc_public_subnet1.id
  route_table_id  = aws_route_table.fargate_ffmpeg_transmux_vpc_public_route.id
}

resource "aws_route_table_association" "fargate_ffmpeg_transmux_public_route_subnet2_association" {
  subnet_id       = aws_subnet.fargate_ffmpeg_transmux_vpc_public_subnet2.id
  route_table_id  = aws_route_table.fargate_ffmpeg_transmux_vpc_public_route.id
}

resource "aws_security_group" "fargate_ffmpeg_transmux_security_group" {
  name = "${terraform.workspace}-fargate-ffmpeg-transmux-security-group"
  description = "${terraform.workspace} fargate allowed ports"
  vpc_id = aws_vpc.fargate_ffmpeg_transmux_service_vpc.id

  ingress {
    description = "Custom TCP"
    from_port   = var.ffmpeg_transmux_container_port
    to_port     = var.ffmpeg_transmux_container_port
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.fargate_ffmpeg_transmux_service_vpc.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${terraform.workspace}-fargate-ffmpeg-transmux-security-group"
    Environment = terraform.workspace
  }
}

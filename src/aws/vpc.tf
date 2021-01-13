// first create a VPC
resource "aws_vpc" "lamda_mediapackage_vpc" {
  cidr_block            = "10.0.0.0/16"
  enable_dns_support    = true
  enable_dns_hostnames  = true

  tags = {
    Name        = "${terraform.workspace}-lambda-mediapackage-vpc"
    Environment = terraform.workspace
  }
}

// Create private subnet
resource "aws_subnet" "lambda_mediapackage_vpc_private_subnet" {
  cidr_block = "10.0.1.0/24"
  vpc_id     = aws_vpc.lamda_mediapackage_vpc.id

  tags = {
    Name        = "${terraform.workspace}-lambda-mediapackage-private-subnet"
    Environment = terraform.workspace
  }
}


// Create internet gateway
resource "aws_internet_gateway" "lambda_mediapackage_internet_gateway" {
  vpc_id = aws_vpc.lamda_mediapackage_vpc.id

  tags = {
    Name        = "${terraform.workspace}-lambda-mediapackage-internet-gateway"
    Environment = terraform.workspace
  }
}

// Create public subnet
resource "aws_subnet" "lambda_mediapackage_vpc_public_subnet" {
  cidr_block = "10.0.0.0/24"
  vpc_id     = aws_vpc.lamda_mediapackage_vpc.id

  tags = {
    Name        = "${terraform.workspace}-lambda-mediapackage-public-subnet"
    Environment = terraform.workspace
  }

  depends_on = [aws_internet_gateway.lambda_mediapackage_internet_gateway]
}

// Create an elastic ip
resource "aws_eip" "lambda_mediapackage_vpc_elastic_ip" {
  vpc = true
  public_ipv4_pool = "amazon"

  tags = {
    Name        = "${terraform.workspace}-lambda-mediapackage-vpc-elastic-ip"
    Environment = terraform.workspace
  }

  depends_on = [aws_internet_gateway.lambda_mediapackage_internet_gateway]
}


// create NAT gateway and associate the public subnet and elastic id to it
resource "aws_nat_gateway" "lambda_mediapacakge_vpc_nat_gateway" {
  allocation_id = aws_eip.lambda_mediapackage_vpc_elastic_ip.id
  subnet_id     = aws_subnet.lambda_mediapackage_vpc_public_subnet.id

  tags = {
    Name        = "${terraform.workspace}-lambda-mediapackage-nat-gateway"
    Environment = terraform.workspace
  }

  depends_on = [aws_internet_gateway.lambda_mediapackage_internet_gateway]
}

// create a route and associate it to the public subnet
resource "aws_route_table" "lambda_mediapackage_vpc_public_route" {
  vpc_id = aws_vpc.lamda_mediapackage_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lambda_mediapackage_internet_gateway.id
  }

  tags = {
    Name        = "${terraform.workspace}-lambda-mediapackage-vpc-public-route"
    Environment = terraform.workspace
  }
}

resource "aws_route_table_association" "lambda_mediapackage_public_route_and_subnet_association" {
  subnet_id       = aws_subnet.lambda_mediapackage_vpc_public_subnet.id
  route_table_id  = aws_route_table.lambda_mediapackage_vpc_public_route.id
}

// create a route and associate it with the private subnet
resource "aws_route_table" "lambda_mediapackage_vpc_private_route" {
  vpc_id = aws_vpc.lamda_mediapackage_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.lambda_mediapacakge_vpc_nat_gateway.id
  }

  tags = {
    Name        = "${terraform.workspace}-lambda-mediapackage-vpc-private-route"
    Environment = terraform.workspace
  }
}

resource "aws_route_table_association" "lambda_mediapackage_private_route_and_subnet_association" {
  subnet_id       = aws_subnet.lambda_mediapackage_vpc_private_subnet.id
  route_table_id  = aws_route_table.lambda_mediapackage_vpc_private_route.id
}

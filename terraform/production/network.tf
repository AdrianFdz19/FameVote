# 1. VPC Principal
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "famvote-${var.environment}-vpc"
    Environment = var.environment
  }
}

# 2. Internet Gateway (Para dar salida a internet a subredes públicas)
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "famvote-${var.environment}-igw"
    Environment = var.environment
  }
}

# 3. Subredes Públicas (en 2 Zonas de Disponibilidad)
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "famvote-${var.environment}-public-a"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "famvote-${var.environment}-public-b"
    Environment = var.environment
  }
}

# 4. Subredes Privadas (Para ElastiCache Redis y recursos aislados)
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name        = "famvote-${var.environment}-private-a"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name        = "famvote-${var.environment}-private-b"
    Environment = var.environment
  }
}

# 5. Tabla de Ruteo Pública
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name        = "famvote-${var.environment}-public-rt"
    Environment = var.environment
  }
}

# Asociación de Subredes Públicas a la Tabla de Ruteo
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# 6. Tabla de Ruteo Privada (Aislada)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "famvote-${var.environment}-private-rt"
    Environment = var.environment
  }
}

# Asociación de Subredes Privadas
resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

# 7. Subnet Group Requerido para ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "famvote-${var.environment}-redis-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name        = "famvote-${var.environment}-redis-subnet-group"
    Environment = var.environment
  }
}
# 1. Security Group para ElastiCache Redis
resource "aws_security_group" "redis_sg" {
  name        = "famvote-${var.environment}-redis-sg"
  description = "Permitir acceso a Redis en el puerto 6379 desde la VPC"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block] # O "10.0.0.0/16"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "famvote-${var.environment}-redis-sg"
    Environment = var.environment
  }
}

# 2. Cluster de ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "famvote-redis-cluster"
  engine               = "redis"
  node_type            = "cache.t4g.micro" # Nodo económico para pruebas
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids   = [aws_security_group.redis_sg.id]
}
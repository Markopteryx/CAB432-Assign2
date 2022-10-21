terraform {
    required_providers {
        aws = {
            source = "hashicorp/aws"
            #version = "~> 3.0"
        }
    }
}

provider "aws" {
    region = "ap-southeast-2"
    shared_credentials_files = ["C:/Users/Marko/.aws/credentials"]
    profile = "901444280953_CAB432-STUDENT"
}

resource "random_id" "name" {
  keepers = {
    first = "${timestamp()}"
  }

  prefix = "n8039062-TF-"
  byte_length = 6
}

resource "aws_launch_configuration" "n8039062-frontend" {
  name = random_id.name.hex

  key_name = "marko-assign1"

  iam_instance_profile = "ec2SSMCab432"

  image_id = "ami-066a35fb8bb4d12eb"

  instance_type = "t2.micro"

  security_groups = ["sg-032bd1ff8cf77dbb9"]
  
  user_data = data.template_file.frontend.rendered
}

resource "aws_db_instance" "renders-db" {
  allocated_storage = 20
  max_allocated_storage = 1000
  engine = "mysql"
  engine_version = "8.0.30"
  instance_class = "db.t3.micro"
  db_name = "n8038062-assign2"
  username = "admin"
  parameter_group_name = "default.mysql8.0"
  publicly_accessible = true
}

data "template_file" "backend" {
  template = "${file("./template_file.tpl")}"

  vars = {
    GITHUB_TOKEN = var.GITHUB_TOKEN
    DB_CONNECTION = var.DB_CONNECTION
    DB_HOST = aws_db_instance.renders-db.address
    DB_PORT = var.DB_PORT
    DB_DATABASE = var.DB_DATABASE
    DB_USERNAME = var.DB_USERNAME
    DB_PASSWORD = var.DB_PASSWORD
    IMAGE_URL = "ghcr.io/markopteryx/cab432-n8039062-backend:main"
  }
}

data "template_file" "frontend" {
  template = "${file("./template_file.tpl")}"

  vars = {
    GITHUB_TOKEN = var.GITHUB_TOKEN
    DB_CONNECTION = var.DB_CONNECTION
    DB_HOST = aws_db_instance.renders-db.address
    DB_PORT = var.DB_PORT
    DB_DATABASE = var.DB_DATABASE
    DB_USERNAME = var.DB_USERNAME
    DB_PASSWORD = var.DB_PASSWORD
    IMAGE_URL = "ghcr.io/markopteryx/cab432-n8039062-frontend:main"
  }
}

variable "GITHUB_TOKEN" {
    description = "A personal access token with read:packages permissions"
    type = string
}

variable "DB_CONNECTION" {
    description = "The type of RDS used"
    default = "mysql"
    type = string
}

variable "DB_PORT" {
    description = "The port of the RDS"
    default = "3306"
    type = string
}

variable "DB_DATABASE" {
    description = "The name of the RDS"
    default = "renders"
    type = string
}

variable "DB_USERNAME" {
    description = "The username of the RDS"
    default = "admin"
    type = string
}

variable "DB_PASSWORD" {
    description = "The address of the RDS"
    type = string
}

resource "aws_autoscaling_group" "bar" {
  name                 = "${aws_launch_configuration.n8039062-frontend.name}"
  launch_configuration = aws_launch_configuration.n8039062-frontend.name
  min_size             = 1
  max_size             = 1

  lifecycle {
    create_before_destroy = true
  }

  vpc_zone_identifier = [
    "subnet-05a3b8177138c8b14",
    "subnet-075811427d5564cf9",
    "subnet-04ca053dcbe5f49cc"
  ]
}
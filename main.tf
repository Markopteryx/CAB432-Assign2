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

resource "aws_launch_configuration" "n8039062-backend" {
  name = random_id.name.hex

  key_name = "marko-assign1"

  iam_instance_profile = "ec2SSMCab432"

  image_id = "ami-066a35fb8bb4d12eb"

  instance_type = "t2.micro"

  security_groups = ["sg-032bd1ff8cf77dbb9"]
  
  user_data = data.template_file.backend.rendered
}

resource "aws_sqs_queue" "n8039062-Assign2-SQS" {
  name = "n8039062-Assign2-SQS"
}

data "template_file" "backend" {
  template = "${file("./template_file.tpl")}"

  vars = {
    GITHUB_TOKEN = var.GITHUB_TOKEN
    DB_CONNECTION = var.DB_CONNECTION
    DB_HOST = var.MYSQL_ENDPOINT
    DB_PORT = var.DB_PORT
    DB_DATABASE = var.DB_DATABASE
    DB_USERNAME = var.DB_USERNAME
    DB_PASSWORD = var.DB_PASSWORD
    REDIS_HOST = var.REDIS_ENDPOINT
    COMPOSE = file("${path.module}/ami/docker-compose-backend.yml")
  }
}

data "template_file" "worker" {
  template = "${file("./template_file.tpl")}"

  vars = {
    GITHUB_TOKEN = var.GITHUB_TOKEN
    DB_CONNECTION = var.DB_CONNECTION
    DB_HOST = var.MYSQL_ENDPOINT
    DB_PORT = var.DB_PORT
    DB_DATABASE = var.DB_DATABASE
    DB_USERNAME = var.DB_USERNAME
    DB_PASSWORD = var.DB_PASSWORD
    REDIS_HOST = var.REDIS_ENDPOINT
    INSTANCE_TYPE = "worker"
    COMPOSE = file("${path.module}/ami/docker-compose-worker.yml")
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

variable "REDIS_ENDPOINT" {
    default = "n8039062-assign2.km2jzi.ng.0001.apse2.cache.amazonaws.com"
    description = "AWS Redis Primary Endpoint"
    type = string
}

variable "MYSQL_ENDPOINT" {
    default = "n8039062-assign2.ce2haupt2cta.ap-southeast-2.rds.amazonaws.com"
    description = "AWS MySQL Primary Endpoint"
    type = string
}

resource "aws_autoscaling_group" "bar" {
  name                 = "${aws_launch_configuration.n8039062-backend.name}"
  launch_configuration = aws_launch_configuration.n8039062-backend.name
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

output "rendered" {
  value = "${data.template_file.backend.rendered}"
}
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
    shared_credentials_files = ["credentials"]
    profile = "901444280953_CAB432-STUDENT"
}

resource "random_id" "name" {
  keepers = {
    first = "${timestamp()}"
  }

  prefix = "n8039062-TF-"
  byte_length = 6
}

resource "aws_launch_configuration" "n8039062" {
  name = random_id.name.hex

  key_name = "marko-assign1"

  iam_instance_profile = "ec2SSMCab432"

  image_id = "ami-055166f8a8041fbf1"

  instance_type = "t2.micro"

  security_groups = ["sg-032bd1ff8cf77dbb9"]
  
  user_data = data.template_file.init.rendered
}

data "template_file" "init" {
  template = "${file("./template_file.tpl")}"

  vars = {
    victory = "McDonalds"
    GITHUB_TOKEN = var.GITHUB_TOKEN
  }
}

variable "GITHUB_TOKEN" {
    description = "A personal access token with read:packages permissions"
    type = string
}

resource "aws_autoscaling_group" "bar" {
  name                 = "${aws_launch_configuration.n8039062.name}"
  launch_configuration = aws_launch_configuration.n8039062.name
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



#!/bin/bash

echo "TEST=TRUE" >> /home/ubuntu/app/.env
echo "GITHUB_TOKEN=${GITHUB_TOKEN}" >> /home/ubuntu/app/.env
echo "IMAGE_URL=${IMAGE_URL}" >> /home/ubuntu/app/.env

export GITHUB_TOKEN="${GITHUB_TOKEN}"

echo "${GITHUB_TOKEN}" | sudo docker login ghcr.io -u Markopteryx --password-stdin

sudo docker-compose -f /home/ubuntu/app/docker-compose.yml --env-file /home/ubuntu/app/.env up -d

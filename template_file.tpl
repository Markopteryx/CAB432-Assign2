#!/bin/bash

echo "TEST=TRUE" >> /home/ubuntu/app/.env
echo "GITHUB_TOKEN=${GITHUB_TOKEN}" >> /home/ubuntu/app/.env
echo "IMAGE_URL=${IMAGE_URL}" >> /home/ubuntu/app/.env

echo "DB_CONNECTION=${DB_CONNECTION}" >> /home/ubuntu/app/.env
echo "DB_HOST=${DB_HOST}" >> /home/ubuntu/app/.env
echo "DB_PORT=${DB_PORT}" >> /home/ubuntu/app/.env
echo "DB_DATABASE=${DB_DATABASE}" >> /home/ubuntu/app/.env
echo "DB_USERNAME=${DB_USERNAME}" >> /home/ubuntu/app/.env
echo "DB_PASSWORD=${DB_PASSWORD}" >> /home/ubuntu/app/.env

export GITHUB_TOKEN="${GITHUB_TOKEN}"

echo "${GITHUB_TOKEN}" | sudo docker login ghcr.io -u Markopteryx --password-stdin

sudo docker-compose -f /home/ubuntu/app/docker-compose.yml --env-file /home/ubuntu/app/.env up -d

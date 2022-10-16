#!/bin/bash

echo "TEST=gmaer" >> /tmp/app/.env

export GITHUB_TOKEN="${GITHUB_TOKEN}"

export IMAGE_URL="${IMAGE_URL}"

echo "${GITHUB_TOKEN}" | docker login ghcr.io -u Markopteryx --password-stdin

docker-compose -f /tmp/app/docker-compose.yml --env-file /tmp/app/.env up -d

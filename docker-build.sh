#!/bin/bash

# Usage: ./docker-build.sh <repo name (local or remote)> <version> [push]
# Example: ./docker-build.sh inatrace-be 2.4.0
# Needed docker command.
#
# If "push" is provided, the image will be pushed to the specified repo with the prepended version.

set -e

repoName=$1
version=$2
push=$3

if [ "$repoName" == "" ] || [ "$version" == "" ]; then
  echo "Usage: $0 <repo name (local or remote)> <version>"
  exit 1
fi

tag=$version

docker build -t $repoName:$tag .

if [ "$push" == "push" ]; then
  docker push $repoName:$tag
fi

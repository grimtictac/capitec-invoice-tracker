#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Version argument required"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.0"
    exit 1
fi

VERSION=$1

echo "Building Docker image for version $VERSION..."

docker build -t registry.digitalocean.com/deno-on-digital-ocean/deno-image:$VERSION .

if [ $? -eq 0 ]; then
    echo "Docker image built successfully!"    
    echo "Pushing to DigitalOcean registry..."
    
    docker push registry.digitalocean.com/deno-on-digital-ocean/deno-image:$VERSION
    
    if [ $? -eq 0 ]; then
        echo "Image pushed successfully to registry!"
    else
        echo "Failed to push image to registry"
        exit 1
    fi
else
    echo "Failed to build Docker image"
    exit 1
fi
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
    
    read -p "Push to registry? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo "Pushing to registry..."
        
        docker push registry.digitalocean.com/deno-on-digital-ocean/deno-image:$VERSION
        
        if [ $? -eq 0 ]; then
            echo "Image pushed successfully to registry!"
           else
            echo "Failed to push image to registry"
            exit 1
        fi
    else
        echo "Image built but not pushed. You can push it later with:"
        echo "docker push registry.digitalocean.com/deno-on-digital-ocean/deno-image:$VERSION"
        echo ""
        
        read -p "Run the image locally? (y/N): " run_local
        
        if [[ $run_local =~ ^[Yy]$ ]]; then
            echo "Starting container locally on port 8000..."
            docker run -p 8000:8000 --env-file .env registry.digitalocean.com/deno-on-digital-ocean/deno-image:$VERSION
        else
            echo "You can run it locally later with:"
            echo "docker run -p 8000:8000 --env-file .env registry.digitalocean.com/deno-on-digital-ocean/deno-image:$VERSION"
        fi
    fi
else
    echo "Failed to build Docker image"
    exit 1
fi
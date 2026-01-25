# Docker Setup

This document explains how to build and run the Firework React app using Docker.

## Building the Docker Image Locally

From the project root directory:

```bash
# Build the image (context is the firework directory)
docker build -t firework-demo:local -f firework/examples/web/Dockerfile ./firework

# Run the container
docker run -p 8080:80 firework-demo:local
```

Then open http://localhost:8080 in your browser.

## GitHub Actions Workflow

The project includes a GitHub Actions workflow that builds and pushes Docker images to Docker Hub.

### Setup Requirements

Before using the workflow, you need to configure the following secrets in your GitHub repository:

1. Go to your repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: Your Docker Hub access token (create one at https://hub.docker.com/settings/security)

### Running the Workflow

The workflow can be triggered manually:

1. Go to the "Actions" tab in your GitHub repository
2. Select "Build and Push Docker Image" workflow
3. Click "Run workflow"
4. Optionally, provide a custom tag suffix (otherwise it will use the commit hash)
5. Click "Run workflow"

### Docker Tags

The workflow automatically creates the following tags:
- `<username>/firework-demo:<commit-hash>` - Tagged with the short commit hash (always)
- `<username>/firework-demo:latest` - Latest build (always)
- `<username>/firework-demo:<custom-suffix>` - Custom tag if provided (optional)

### Pulling and Running from Docker Hub

Once the image is pushed to Docker Hub:

```bash
# Pull the image
docker pull <your-dockerhub-username>/firework-demo:latest

# Run the container
docker run -p 8080:80 <your-dockerhub-username>/firework-demo:latest
```

## Dockerfile Details

The Dockerfile uses a multi-stage build:

1. **Build Stage**: Uses Node.js 18 Alpine to install dependencies and build the React app with Vite
2. **Production Stage**: Uses Nginx Alpine to serve the static files with proper SPA routing configuration

This approach creates a minimal production image (~25MB) that only contains the built assets and Nginx.

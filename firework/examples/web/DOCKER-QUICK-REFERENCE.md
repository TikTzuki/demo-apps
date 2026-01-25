# Docker & GitHub Actions Setup - Quick Reference

## Files Created/Modified

1. **Dockerfile** (`firework/examples/web/Dockerfile`)
   - Multi-stage build (Node.js builder + Nginx server)
   - Builds the library and React app
   - Serves static files with SPA routing

2. **GitHub Workflow** (`.github/workflows/docker-build.yml`)
   - Manual trigger via workflow_dispatch
   - Tags images with commit hash
   - Pushes to Docker Hub

3. **Documentation** (`firework/examples/web/DOCKER.md`)
   - Build and run instructions
   - GitHub Actions setup guide

## Quick Setup

### 1. Configure GitHub Secrets

Add these secrets to your repository (Settings → Secrets and variables → Actions):
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token from https://hub.docker.com/settings/security

### 2. Test Locally

```bash
# From project root
docker build -t firework-demo:local -f firework/examples/web/Dockerfile ./firework
docker run -p 8080:80 firework-demo:local
# Visit http://localhost:8080
```

### 3. Deploy via GitHub Actions

1. Go to Actions tab in GitHub
2. Select "Build and Push Docker Image"
3. Click "Run workflow"
4. (Optional) Add a custom tag suffix
5. Click "Run workflow" button

### Image Tags

Every successful workflow run creates:
- `<username>/firework-demo:<commit-hash>` (e.g., `abc123f`)
- `<username>/firework-demo:latest`
- `<username>/firework-demo:<custom-tag>` (if provided)

### Pull and Run from Docker Hub

```bash
docker pull <your-username>/firework-demo:latest
docker run -p 8080:80 <your-username>/firework-demo:latest
```

## Architecture

**Build Stage:**
1. Install library dependencies and build library
2. Install example app dependencies
3. Link built library to example app
4. Build React app with Vite

**Production Stage:**
1. Copy built static files to Nginx
2. Configure SPA routing (fallback to index.html)
3. Expose port 80
4. Serve the app

**Result:** ~25MB production image

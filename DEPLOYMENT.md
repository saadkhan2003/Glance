# DigitalOcean deployment

The app is ready for a single-instance Docker deployment. Account access, a destination, and a domain are still required to publish it. No DigitalOcean resources have been created.

## Recommended: one Droplet

Use a Docker-capable Ubuntu Droplet. Allow sufficient memory for the Next.js build (2 GB or more is a practical starting point); build elsewhere if the server is smaller. Install Docker Engine and the Compose plugin using Docker's official Ubuntu instructions. Keep inbound access limited to SSH and HTTP/HTTPS. The app port binds to loopback by default.

Copy this project to the server without `.env.local`, `node_modules`, `.next`, or the original `.data` directory. From the project folder:

```sh
cp .env.example .env
# Edit .env on the server: set APP_ORIGIN to https://your-domain.example.
# Leave AI_ENABLED=false for a credential-free launch.
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:3000/api/health
```

Configure a TLS reverse proxy, for example Caddy, with the domain's DNS pointing at the Droplet. `Caddyfile.example` provides the proxy configuration for a Caddy service running on the host. Replace the example hostname. Use your exact HTTPS origin as `APP_ORIGIN`; this permits the browser origin behind the reverse proxy. Health checks should use `/api/health`.

The `budget` named volume persists the daily AI request counter across container replacements. The container runs as the unprivileged `node` user. Verify that the volume is writable by that user; if not, AI fails closed and the local fallback still works.

## Enable AI when ready

Set these in the server's `.env`:

```dotenv
AI_ENABLED=true
OPENROUTER_API_KEY=your-server-only-key
JEV_MODEL=typesafe/jev-1.13
APP_ORIGIN=https://your-domain.example
AI_DAILY_REQUEST_LIMIT=100
```

Set a provider-side hard credit limit on the key. Then run `docker compose up -d`. Do not commit `.env`. No key is baked into the image. Keep one application process/replica for the filesystem budget implementation.

## Updates and rollback

Build and verify an image before switching traffic. Keep the previous image tag and deployment configuration. For a release, tag the verified image, deploy it, then check `/api/health` and the demo workflow. For rollback, point the service to the prior image and recreate the container. Do not remove the budget volume during an update. Downloaded/saved dashboards remain on visitors' devices, not the server.

## Before presenting

- Health endpoint returns HTTP 200.
- HTTPS works and no browser console errors appear.
- Revenue & customers renders, filters change the data, and CSV downloads.
- Import the example, save a view, reload, and restore it.
- Disable AI temporarily and verify that the local fallback remains usable.
- Run the demo on a phone-width viewport.
- Record the three-minute walkthrough as a backup.

## DigitalOcean App Platform alternative

The included Dockerfile can be used for an App Platform web service with HTTP port 3000 and `/api/health`. The default no-key mode is stateless and works there. For AI, use a durable shared budget store before enabling it on ephemeral or multiple instances; do not treat an ephemeral filesystem counter as a persistent spending limit.

## Package an already verified Linux build

If registry downloads on the server are slow, build and test on a Linux machine with the same CPU architecture first, then package the standalone output without reinstalling dependencies:

```sh
npm run build
node scripts/package-image.mjs
docker save jev-interfaces:hackathon | gzip > jev-interfaces-image.tar.gz
```

Transfer the archive to the Droplet and load it with `gunzip -c jev-interfaces-image.tar.gz | docker load`. Change the Compose service's `build: .` to `image: jev-interfaces:hackathon`, then run `docker compose up -d`. The packaging script excludes environment files and database files. Native runtime dependencies are platform-specific; use matching Linux architecture, or use the normal multi-stage Dockerfile on the target instead.

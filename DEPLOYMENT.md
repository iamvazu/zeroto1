# Zeroto1 Academy - VPS Deployment & CI/CD Architecture

## Production Environment
- **Host VPS**: `2.25.90.226`
- **Application Directory**: `/var/www/zeroto1`
- **Domain**: `zeroto1.academy` / `www.zeroto1.academy`
- **Process Manager**: PM2 (`zeroto1-web` running on internal port `3025`)
- **Web Server / Reverse Proxy**: Nginx (reverse proxies port 80 / 443 to `127.0.0.1:3025`)
- **Database**: SQLite (`/var/www/zeroto1/dev.db`) with 1,570 curriculum lessons
- **Node.js**: v20.20.2

## Zero-Impact Server Isolation
The VPS hosts multiple production applications (`strongerbuilt`, `lumora`, `burngrid`, `dozeles`, `hygeia`, `tacit`, `hermes`). Zeroto1 Academy operates in complete isolation:
- Dedicated PM2 process name: `zeroto1-web`
- Dedicated port: `3025`
- Dedicated Nginx virtual host: `/etc/nginx/sites-available/zeroto1`

## Continuous Integration & Deployment (CI/CD)
Automated deployments are managed by GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

Whenever changes are pushed to `main`, GitHub Actions:
1. Checks out repository and sets up Node 20
2. Installs dependencies & runs Prisma client generation
3. Connects to Hostinger VPS via SSH
4. Pulls latest code into `/var/www/zeroto1`
5. Builds Next.js production bundle
6. Reloads PM2 process `zeroto1-web` with zero downtime
7. Verifies HTTP status 200 on health checks

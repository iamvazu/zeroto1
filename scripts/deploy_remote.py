import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

HOST = '2.25.90.226'
USER = 'root'
PASS = '1302@Sanjose'

def run_command(client, cmd, check=True):
    print(f"\n>>> EXECUTING: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out_lines = []
    for line in iter(stdout.readline, ""):
        print(line, end="")
        out_lines.append(line)
    exit_status = stdout.channel.recv_exit_status()
    if check and exit_status != 0:
        raise RuntimeError(f"Command failed with exit code {exit_status}: {cmd}")
    return "".join(out_lines), exit_status

def deploy():
    print("=========================================================")
    print("  STARTING ZEROTO1 ACADEMY ZERO-IMPACT SERVER DEPLOYMENT")
    print("=========================================================\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=20)

    try:
        # 1. Check if /var/www/zeroto1 already exists
        out, status = run_command(client, "test -d /var/www/zeroto1 && echo 'EXISTS' || echo 'NEW'", check=False)
        is_existing = 'EXISTS' in out

        if not is_existing:
            print("Cloning repository into /var/www/zeroto1...")
            run_command(client, "git clone https://github.com/iamvazu/zeroto1.git /var/www/zeroto1")
        else:
            print("Repository exists in /var/www/zeroto1. Pulling latest main...")
            run_command(client, "cd /var/www/zeroto1 && git fetch origin && git reset --hard origin/main")

        # 2. Setup production .env in /var/www/zeroto1
        env_content = """NEXT_PUBLIC_APP_URL="http://2.25.90.226:3020"
NODE_ENV="production"
PORT=3025
DATABASE_URL="file:./dev.db"
JWT_SECRET="zeroto1-secret-key-32-bytes-minimum-security-2026"
"""
        sftp = client.open_sftp()
        with sftp.open('/var/www/zeroto1/.env', 'w') as f:
            f.write(env_content)
        sftp.close()
        print("✓ Created production .env in /var/www/zeroto1")

        # 3. Install dependencies and generate prisma
        print("\nInstalling npm dependencies...")
        run_command(client, "cd /var/www/zeroto1 && npm ci || npm install")

        print("\nGenerating Prisma Client...")
        run_command(client, "cd /var/www/zeroto1 && npx prisma generate")

        # 4. Verify dev.db exists and contains full content library
        print("\nVerifying SQLite database content...")
        run_command(client, "cd /var/www/zeroto1 && npx tsx scripts/import_content_library.ts")

        # 5. Build Next.js application
        print("\nBuilding Next.js production bundle...")
        run_command(client, "cd /var/www/zeroto1 && npm run build")

        # 6. Setup PM2 process (zeroto1-web on internal port 3025)
        print("\nConfiguring PM2 process...")
        out, _ = run_command(client, "pm2 jlist", check=False)
        if '"name":"zeroto1-web"' in out:
            run_command(client, "pm2 reload zeroto1-web || pm2 restart zeroto1-web")
        else:
            run_command(client, "cd /var/www/zeroto1 && pm2 start npm --name 'zeroto1-web' -- start -- -p 3025")
        run_command(client, "pm2 save")

        # 7. Configure Nginx (Dedicated site config on port 3020)
        nginx_conf = """server {
    listen 3020;
    server_name _;

    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3025;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""
        sftp = client.open_sftp()
        with sftp.open('/etc/nginx/sites-available/zeroto1', 'w') as f:
            f.write(nginx_conf)
        sftp.close()
        print("✓ Created Nginx site configuration at /etc/nginx/sites-available/zeroto1")

        run_command(client, "ln -sf /etc/nginx/sites-available/zeroto1 /etc/nginx/sites-enabled/zeroto1")
        print("Testing Nginx configuration...")
        run_command(client, "nginx -t")

        print("Reloading Nginx gracefully (zero downtime to existing sites)...")
        run_command(client, "systemctl reload nginx")

        # 8. Test live endpoints
        print("\nVerifying live endpoints...")
        time.sleep(3)
        run_command(client, "curl -I -s http://127.0.0.1:3025/ | head -n 5")
        run_command(client, "curl -I -s http://127.0.0.1:3020/ | head -n 5")
        run_command(client, "curl -s http://127.0.0.1:3020/api/metrics/summary | head -n 10")

        print("\n=========================================================")
        print("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!")
        print("  Zeroto1 Academy is live at: http://2.25.90.226:3020")
        print("=========================================================")

    finally:
        client.close()

if __name__ == '__main__':
    deploy()

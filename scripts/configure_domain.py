import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

HOST = '2.25.90.226'
USER = 'root'
PASS = '1302@Sanjose'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=20)

def run(cmd):
    print(f"\n>>> EXECUTING: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode()
    print(out)
    return out

# 1. Update /var/www/zeroto1/.env
env_content = """NEXT_PUBLIC_APP_URL="https://zeroto1.academy"
NODE_ENV="production"
PORT=3025
DATABASE_URL="file:./dev.db"
JWT_SECRET="zeroto1-secret-key-32-bytes-minimum-security-2026"
"""
sftp = client.open_sftp()
with sftp.open('/var/www/zeroto1/.env', 'w') as f:
    f.write(env_content)
print("✓ Updated /var/www/zeroto1/.env with NEXT_PUBLIC_APP_URL=https://zeroto1.academy")

# 2. Update /etc/nginx/sites-available/zeroto1
nginx_conf = """server {
    listen 80;
    listen [::]:80;
    server_name zeroto1.academy www.zeroto1.academy;

    client_max_body_size 50M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

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
with sftp.open('/etc/nginx/sites-available/zeroto1', 'w') as f:
    f.write(nginx_conf)
sftp.close()
print("✓ Updated Nginx config for zeroto1.academy on port 80")

# 3. Ensure certbot directory and test nginx
run("mkdir -p /var/www/certbot")
run("nginx -t")
run("systemctl reload nginx")

# 4. Restart PM2 with updated env
run("pm2 restart zeroto1-web --update-env")
run("pm2 save")

# 5. Test curl with domain header
run("curl -I -s -H 'Host: zeroto1.academy' http://127.0.0.1/ | head -n 8")
run("curl -s -H 'Host: zeroto1.academy' http://127.0.0.1/api/metrics/summary | head -n 10")

client.close()
print("Domain configuration successfully activated!")

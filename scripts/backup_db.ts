import fs from 'fs';
import path from 'path';

export function backupDatabase(): { success: boolean; backupPath: string; sizeBytes: number } {
  const dbPath = fs.existsSync(path.join(process.cwd(), 'prisma', 'dev.db'))
    ? path.join(process.cwd(), 'prisma', 'dev.db')
    : path.join(process.cwd(), 'dev.db');
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `dev-backup-${timestamp}.db`);

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found at ${dbPath}`);
  }

  fs.copyFileSync(dbPath, backupPath);
  const stats = fs.statSync(backupPath);

  console.log(`✓ Database backed up successfully: ${backupPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  return {
    success: true,
    backupPath,
    sizeBytes: stats.size,
  };
}

if (require.main === module) {
  try {
    const res = backupDatabase();
    console.log('Backup result:', res);
  } catch (err) {
    console.error('Backup error:', err);
    process.exit(1);
  }
}

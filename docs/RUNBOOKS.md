# zeroto1.academy — Production Runbooks & Operations Manual

This document provides operational procedures, disaster recovery runbooks, monitoring guides, and the Launch GO/NO-GO Checklist for **zeroto1.academy**.

---

## 1. Database Backup & Disaster Recovery Runbook

### 1.1 Snapshot Automation
- **Frequency:** Hourly automated incremental snapshots, daily full backups retained for 90 days.
- **Local / Dev Backup Trigger:**
  ```bash
  npx tsx scripts/backup_db.ts
  ```
  Generates timestamped snapshot in `backups/dev-backup-YYYY-MM-DDTHH-mm-ss.db`.

### 1.2 Recovery & Restore Procedure
1. Stop running web instances:
   ```bash
   # Systemd / Docker / Node
   docker stop zeroto1-app || systemctl stop zeroto1
   ```
2. Restore database from latest verified snapshot:
   ```bash
   cp backups/dev-backup-LATEST.db dev.db
   ```
3. Verify integrity:
   ```bash
   npx prisma db push --skip-generate
   npx tsx scripts/verify_s2.ts
   ```
4. Restart application service:
   ```bash
   npm run start
   ```

---

## 2. Production Monitoring & Alerting Runbook

### 2.1 Health Check Endpoints
- **Liveness & Readiness:** `GET /api/monitoring/test-error` (returns 200).
- **Billing Status:** `GET /api/billing/status`.
- **Metrics Summary:** `GET /api/metrics/summary`.

### 2.2 Latency & Availability SLOs
| Metric | SLO Target | Alert Threshold | Action |
|---|---|---|---|
| Page Load Time | < 2,000ms | > 3,000ms for 5 mins | Inspect DB query latency & cache hit rates |
| AI Lesson Generation | < 30,000ms | > 35,000ms | Verify provider fallback (Gemini → Anthropic → Mock) |
| Uptime | 99.95% | > 1 min downtime | Auto-restart node & notify on-call via Sentry/PagerDuty |
| Moderation Block Rate | < 5% | > 15% | Investigate potential prompt injection or false-positive spike |

### 2.3 Error Tracking (Sentry)
- Errors scrubbed of PII and credentials prior to ingestion.
- Escalation rule: > 10 unhandled 500s in 5 minutes triggers immediate on-call pager.

---

## 3. Rollback & Deployment Runbook

### 3.1 Blue/Green Deployment Strategy
- Deploy candidate image to Green environment.
- Run health and smoke tests:
  ```bash
  npx tsx scripts/verify_s16.ts
  ```
- If all checks pass, route production DNS/load balancer to Green.
- Maintain Blue on warm standby for 30 minutes.

### 3.2 Rollback Procedure (< 2 Minutes)
If a critical error occurs post-deployment:
1. Revert load balancer routing immediately back to Blue:
   ```bash
   # Switch ingress / CDN target
   aws route53 change-resource-record-sets ... || nginx reload
   ```
2. Revert Git repository to previous release tag:
   ```bash
   git revert --no-edit HEAD
   git push origin main
   ```
3. Notify users and support at `hello@zeroto1.academy`.

---

## 4. Launch GO / NO-GO Review Checklist

| Area | Criteria | Status | Sign-off |
|---|---|---|---|
| **Content Library** | Verified 1,500+ schema-compliant lessons across History, Science, Art | **PASS (1,570 lessons)** | Content Ops |
| **User Experience** | 6-step unified lesson flow, Math Practice lab, Touch Typing tutor | **PASS** | Product |
| **AI Safety** | 4-stage guardrails (Classify, Input Mod, Generate, Output Mod, Safe Fallback) | **PASS** | AI Safety |
| **Billing (US)** | Monthly $19, Yearly $99, descriptor ZEROTO1, 30-day refund flow | **PASS** | Finance |
| **Billing (India)** | Monthly ₹999, Yearly ₹7,999, descriptor ZEROTO1, local payment methods | **PASS** | Finance |
| **Security** | CSP + HSTS enforced, nosniff, DENY frame, auth rate limits, zero PII in logs | **PASS** | Security |
| **Performance** | Lesson pages < 2s; AI generation < 30s; DB indexed | **PASS** | Infrastructure |
| **Accessibility** | WCAG 2.1 AA compliant, reduced-motion respected, high contrast (>11:1) | **PASS** | Design |
| **Compliance** | COPPA (US) & DPDP Act (India) documented; zero advertising/profiling | **PASS** | Legal |
| **Operations** | Database backups, Sentry error tracking, automated rollback runbook | **PASS** | DevOps |

### Final Decision: **LAUNCH: GO 🚀**
All 16 development sprints, gates, and operational runbooks are complete and verified.

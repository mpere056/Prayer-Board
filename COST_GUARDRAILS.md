# Prayer Board Cost Guardrails

This project is intended to run at no cost while usage remains inside provider free-tier limits.

## Current free-first setup

- Vercel hosts the Next.js app. Use the Hobby/free plan unless the project becomes commercial or needs Pro features.
- Firebase Authentication uses Google, Facebook, and email/password sign-in. Do not enable phone/SMS auth.
- Firestore uses the single `(default)` database for the project.
- Firestore point-in-time recovery is disabled.
- Firestore delete protection is enabled.
- Firestore backups, restores, clones, and TTL deletes are not used.
- Firebase Hosting, Cloud Functions, Cloud Storage, App Hosting, SQL Connect, and Firebase AI services are not used by this app.

## Firestore free quota to preserve

Firestore has a free quota for one database per project. Keep this project to one database and avoid paid Firestore features unless the group explicitly accepts costs.

Practical habits:

- Keep submission links unlisted.
- Keep the built-in anonymous submission rate limit enabled.
- Do not add polling, live listeners, analytics-heavy logging, or automated jobs that repeatedly read large request collections.
- Archive old requests manually until an explicitly cost-aware archival approach is added.
- Avoid storing attachments or images in Firebase.

## Billing reality

Billing is attached only because Google required it for the API/database operation in this project. A billing account does not itself create charges, but usage above free quotas or paid features can.

Google Cloud budget alerts are useful, but they are alerts, not hard spending caps. If zero spend is mandatory, periodically check the Google Cloud Billing page and keep paid features disabled.

## Before launch

- Confirm the Vercel project is on the free/Hobby plan.
- Confirm the Google Cloud billing budget alert is set very low, such as $1.
- Confirm Firestore PITR remains disabled.
- Confirm no backup schedules exist.
- Confirm no Cloud Functions, Cloud Run, Firebase Hosting, Cloud Storage buckets, or App Hosting backends were created for this app.

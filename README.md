# Prayer Board

Prayer Board collects prayer requests through a simple app, gives administrators a moderation and lifecycle workflow, and publishes approved requests into a generated view-only Google Doc for easy sharing.

## Architecture

- **Vercel + Next.js:** the app, protected server routes, and Google Docs publishing.
- **Firebase Authentication:** Google and Facebook sign-in plus verified email/password accounts for named submission, member access, and administration.
- **Cloud Firestore:** group-scoped requests, membership, moderation, lifecycle state, prayer marks, and publishing configuration.
- **Google Docs:** a generated, view-only reading surface for each group.

The first two groups are completely isolated: **Actualize** and **AVBC**. Each has its own opaque submission token, private app route, membership, administrators, and Google Doc. A person submitting a request never chooses a group — the link they received determines it.

Cost-sensitive setup notes are tracked in [COST_GUARDRAILS.md](COST_GUARDRAILS.md). The current setup intentionally avoids paid Firebase features such as Firestore PITR, backups, TTL deletes, Cloud Functions, Firebase Hosting, Cloud Storage, and App Hosting.

## Implemented app surfaces

- Anonymous guest submission through a group-specific unlisted link.
- Google and Facebook sign-in plus verified email/password accounts for named submissions, member board access, and administration.
- Admin moderation for pending requests, including privacy edits before approval.
- Signed-in “My requests” history with moderated update, answered, and removal requests.
- Admin lifecycle views for active, answered, and archived requests.
- No-cost manual archival maintenance for due active requests; no scheduled cloud job is required.
- Per-group retention settings for archive timing and ongoing-request exemptions.
- Admin dashboard share tools for each group’s submission, board, and admin links.
- Protected per-group launch-readiness checklist for setup, publishing, members, pending review, and maintenance.
- Protected per-group admin quick-start guide with sharing guidance and suggested messages.
- Private member board views for active, answered, and archived requests.
- Private “I prayed” markers on active requests.
- Google Doc connection, retry, answered-section setting, and disconnect controls.
- Member management for adding existing Firebase users, promoting/demoting roles, removing access, and preventing removal of the final administrator.
- Read-only administrator audit log for recent submissions, moderation, member changes, and Google Doc actions.
- Privacy notice page and submission-form privacy reminder for request visibility, Google Doc sharing, and anonymous/named handling.
- Public account-data deletion instructions for Meta/Facebook requirements and user privacy requests.

## Local setup

1. Create a Firebase project owned by the group/organization rather than one individual.
2. Create a Firebase Web App and enable **Google**, **Facebook**, and **Email/Password** under **Authentication -> Sign-in method**. Facebook also requires a Meta app whose valid OAuth redirect URI is `https://<firebase-project-id>.firebaseapp.com/__/auth/handler`.
   In Meta App Settings, use the deployed `/privacy` page as the Privacy Policy URL and `/data-deletion` as the User Data Deletion Instructions URL.
3. Add `localhost` and the eventual Vercel domain to Firebase Authentication’s authorized domains.
4. Create a Firebase service account for server-side Vercel use. Copy its project ID, client email, and private key to the server-only environment values in `.env.local`.
5. Copy `.env.example` to `.env.local` and fill in the Firebase web app, Firebase Admin, Google Docs OAuth, and encryption-key values.
6. Deploy `firestore.rules` and `firestore.indexes.json` with the Firebase CLI. The app uses Firebase Admin only from trusted Vercel server routes; the rules deny direct client writes to sensitive data.
7. Create a Google OAuth client for Google Docs publication. Add `http://localhost:3000/api/google-docs/callback` and its Vercel equivalent as authorized redirect URIs. Enable the Google Docs API and Google Drive API.
8. Sign in once with the Google account, Facebook account, or verified email account that should become the first administrator.
9. Run the Firebase bootstrap script, using that first administrator account's email. It creates Actualize and AVBC and prints their distinct submission tokens:

   ```powershell
   $env:INITIAL_ADMIN_EMAIL = "leader@example.com"
   npm run bootstrap:firebase
   ```

10. Install dependencies and run the application:

   ```powershell
   npm install
   npm run dev
   ```

## Checks

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

## Important privacy boundary

Firestore is the source of truth. Each group’s Google Doc is a generated, view-only publication. Do not use the Google Doc as an editable intake or moderation system. Archived, rejected, and removed requests are not published to the Google Doc.

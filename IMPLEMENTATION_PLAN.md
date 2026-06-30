# Prayer Board — Implementation Plan

## 1. Delivery approach

Prayer Board is a Vercel-hosted Next.js application. Firebase Authentication provides Google sign-in and verified email/password accounts, and Cloud Firestore stores group-scoped data. Vercel server routes perform all sensitive operations—including anonymous request intake, moderation, Firebase Admin access, and Google Docs publication.

- **Application:** Next.js and TypeScript on Vercel.
- **Authentication:** Firebase Authentication with Google and verified email/password accounts at launch; Microsoft and Apple may follow.
- **Database:** Cloud Firestore in an organization-owned Firebase project.
- **Authorization:** Firebase session cookies in Vercel; Firestore rules and server-side role checks enforce group isolation.
- **Publication:** Google Drive/Docs API, authorized by a group administrator, creates one view-only Google Doc per group.
- **Initial groups:** Actualize and AVBC. Each has its own opaque submission token, membership, administration space, and Google Doc.

The app never stores passwords in Firestore or custom application storage. Firebase Authentication owns password handling for email accounts; the Firestore `users` profile is only application metadata.

## 2. Phase sequencing

Detailed execution plans for the six build phases:

- [Phase 1 — Application foundation and access control](IMPLEMENTATION_PHASE_1_FOUNDATION_AND_ACCESS.md)
- [Phase 2 — Google Doc connection and publication](IMPLEMENTATION_PHASE_2_GOOGLE_DOC_PUBLICATION.md)
- [Phase 3 — Request submission and moderation queue](IMPLEMENTATION_PHASE_3_SUBMISSION_AND_MODERATION.md)
- [Phase 4 — Optional member prayer board](IMPLEMENTATION_PHASE_4_MEMBER_PRAYER_BOARD.md)
- [Phase 5 — Lifecycle, settings, and administration](IMPLEMENTATION_PHASE_5_LIFECYCLE_AND_ADMINISTRATION.md)
- [Phase 6 — Launch readiness](IMPLEMENTATION_PHASE_6_LAUNCH_READINESS.md)

### Phase 0 — Product and platform foundations

1. Confirm guest-submission, anonymity, retention, notification, and Google Doc sharing decisions in the PRD.
2. Create a Firebase project owned by the group/organization, with at least two trusted project administrators.
3. Configure Firebase Google sign-in, Email/Password sign-in, Firestore, development/production environments, and Vercel secrets.
4. Create a separate Google OAuth client for Docs/Drive publishing, enable the required APIs, and register local/Vercel callback URLs.
5. Write the privacy notice and administrator moderation guidance.
6. Create Actualize and AVBC using distinct opaque submission tokens, memberships, and Google Docs.

Exit criteria:

- Firebase Authentication and Firestore are available in the correct organization-owned project.
- The Google Doc is explicitly a generated publication, never a second editable source of truth.
- Actualize and AVBC are confirmed to be isolated: no request, member, submission token, or document crosses the group boundary.
- Development, preview, and production credentials are not mixed.

## 3. Firestore data model

Every prayer request is stored beneath exactly one group document. There is no cross-group collection for private request content.

| Path | Data |
| --- | --- |
| `users/{userId}` | Firebase-authenticated user’s display name, email when available, timestamps |
| `groups/{groupId}` | Name, app slug, opaque submission token, timezone, archival settings |
| `groups/{groupId}/members/{userId}` | `member` or `admin` role and display metadata |
| `groups/{groupId}/requests/{requestId}` | Prayer content, anonymity, status, lifecycle, and moderation metadata |
| `groups/{groupId}/requestChanges/{requestId}` | Current submitter-requested update, answered status, or removal awaiting administrator review |
| `groups/{groupId}/prayerMarks/{userId_requestId}` | One private prayer mark per member/request |
| `groups/{groupId}/auditEvents/{eventId}` | Minimal moderation/lifecycle audit event |
| `groups/{groupId}/private/googleDoc` | Google Doc metadata, status, and encrypted refresh token; server-only |

## 4. Security and privacy requirements

- Firebase Authentication identity is required for named submission, private board access, and administration; anonymous intake stays account-free. Email/password accounts must verify their email before receiving an app session.
- The submission route uses a group-specific opaque token such as `/submit/[submission-token]`. It resolves server-side to exactly one group and never shows a group picker.
- Firestore rules protect direct client access. Vercel server routes use Firebase Admin only after verifying a Firebase session and the user’s group role.
- The `private/googleDoc` document is unreadable and unwritable to Firebase clients. It contains the encrypted Google refresh token used only by server publication jobs.
- Request text renders as plain text; do not place names, emails, request bodies, tokens, or secrets into logs, analytics, error reports, or URLs.
- Rate-limit and bot-protect anonymous submissions.
- Use organization-owned Firebase, Vercel, Google Cloud, Google Docs, domain, and billing accounts with at least two administrators.
- Document Firestore export/backup and restore procedures before launch.

## 5. Testing strategy

### Automated

- Unit tests: lifecycle transitions, publication triggers, submitter-change eligibility, validation, anonymity display, archival eligibility, and document rendering. The lifecycle suite runs with Nodeâ€™s built-in test runner.
- Integration tests: Firebase session verification, group-role checks, Firestore rules, Google Doc publication state, and private-token access.
- Browser tests: anonymous submission, Google sign-in, verified email sign-in, named submission, submitter change requests, moderation, publication status, and mobile flows.

### Manual acceptance checks

- Confirm an Actualize request cannot be read, moderated, published, or discovered from AVBC, and vice versa.
- Confirm a guest can submit anonymously without sign-in, while named submission requires Google sign-in or a verified email account.
- Confirm the Google Doc receives active approved requests only and is viewer-only for general readers.
- Confirm anonymous-to-group display does not leak identity in the app or Google Doc.
- Confirm user removal revokes private app access promptly.

## 6. Suggested delivery milestones

| Milestone | Demonstrable outcome |
| --- | --- |
| Foundation | An invited user signs in through Firebase and reaches only their own group routes. |
| Google publication | Each group can create and maintain its own view-only Google Doc. |
| Safe intake | A request reaches only the group determined by its link and only after approval. |
| Prayer experience | Members can optionally use the private board and prayer markers. |
| Ongoing care | Administrators manage lifecycle, access, and publication health. |
| Pilot launch | One real group uses the system without developer help. |

## 7. Decisions required before production

1. Choose the group/organization accounts that will own Firebase, Vercel, Google Cloud, Google Docs, and the domain.
2. Confirm Google as the launch SSO provider, keep Email/Password enabled, and decide whether Microsoft/Apple will follow.
3. Decide each Google Doc’s audience and link-sharing setting.
4. Decide retention period, whether ongoing requests are exempt, and whether answered prayers publish to the Doc.
5. Approve the privacy notice, moderation guidance, and backup/restore ownership.

## 8. Deferred enhancements

- Additional SSO providers.
- Email verification email copy and deliverability.
- Weekly opt-in prayer digest.
- Administrator-approved encouragement messages.
- Aggregate prayer counts, with group controls.
- Multiple groups under an organization.
- Admin export and retention tools.
- Stronger anti-spam protection if public links attract abuse.

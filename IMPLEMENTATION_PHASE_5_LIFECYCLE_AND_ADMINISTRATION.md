# Prayer Board — Phase 5: Lifecycle, Settings, and Administration

## Purpose

Give administrators the practical controls needed to keep requests current, manage access, and operate the Google Doc publication safely over time.

## Depends on

- Phase 1 group roles and protected administrator routes.
- Phase 2 Google Doc connection and publication status.
- Phase 3 request moderation workflow.
- Phase 4 optional member board, if it is included in the release.

## In scope

- Answered, archived, restored, and permanently removed request states.
- Configurable automatic archival.
- Administrator dashboard and audit history.
- Member invitations and role management.
- Group and Google Doc publication settings.

## Out of scope

- Complex organization-wide roles across multiple groups.
- Bulk exports and advanced retention tooling.
- Email notification campaigns.

## Implementation steps

1. Add Firestore lifecycle actions and transitions: approved to answered, approved to archived, answered to archived, archived to restored, and eligible state to removed.
2. Define server-side transition rules so invalid combinations cannot be reached from UI or direct requests.
3. Build administrator controls for marking answered, archiving, restoring, and permanently deleting requests, including confirmation for deletion.
4. Build answered and archive views in the app. Ensure Google Doc content follows the group setting: active only by default, optional answered section, never archived content.
5. Add group settings for default archival period and whether ongoing requests are exempt.
6. Implement a scheduled archival job that selects only eligible requests, records audit events, and triggers document publication.
7. Build member management: invite or add a member, remove access, promote to admin, and demote an admin with safeguards against removing the final administrator.
8. Build an administrator dashboard showing pending, active, answered, archived, and publication-health counts.
9. Build an audit view limited to authorized administrators. Keep entries concise and avoid duplicating prayer-request text unnecessarily.
10. Add Google Doc settings: connected document, sharing mode, include answered section, last publication state, retry, and disconnect.

## Operational rules

- Approval remains required before any request reaches readers.
- Archived, rejected, and removed content is not present in the active Google Doc; each group’s Doc contains only content from its own group.
- The final active administrator cannot demote or remove themselves without first appointing another administrator.
- Disconnecting the Doc stops synchronization; it does not revoke document sharing automatically or erase existing content. The administrator must receive this warning.
- Automatic archival should be reversible by an administrator before permanent deletion.

## Tests and acceptance criteria

- Every allowed lifecycle transition succeeds and creates an audit event; every invalid transition is rejected.
- Archive eligibility correctly honors group settings and ongoing status.
- Scheduled archival runs once per eligible request and republishes the Google Doc.
- An archived request disappears from active Google Doc content and remains available only in the private archive view.
- Administrator actions are unavailable to members.
- Member removal immediately blocks group access.
- Final-admin safeguards prevent a group from losing all administrators.
- A failed document publication remains visible in the dashboard and supports safe retry.

## Deliverables

- Full request lifecycle controls and archive automation.
- Administrator dashboard and audit history.
- Group membership and role management.
- Group retention and Google publication settings.

## Current implementation progress

Completed in the initial Phase 5 implementation pass:

- Administrator dashboard with pending, active, answered, and archived counts.
- Admin request lifecycle pages for active, answered, and archived requests.
- Server-enforced lifecycle transitions for mark answered, archive, restore, and remove.
- Google Doc republication after visible request state changes.
- Optional answered-prayers section in the Google Doc, controlled from settings.
- Google Doc retry and disconnect controls.
- Private member board pages for answered requests and archive.
- Member management for adding existing Firebase Auth users by email, promoting, demoting, removing access, and protecting the final administrator.

Still deferred:

- Automatic archival job and per-group archival-period settings.
- Detailed audit-history page.
- Editing request content after submission or approval.

## Completion checkpoint

An administrator can confidently manage a group over time: requests stay current, access remains controlled, and the published Google Doc reflects the group’s approved active content.

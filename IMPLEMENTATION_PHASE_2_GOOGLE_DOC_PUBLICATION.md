# Prayer Board — Phase 2: Google Doc Connection and Publication

## Purpose

Enable an administrator to create a dedicated group-owned, view-only Google Doc. Actualize and AVBC always use separate Docs. Firestore remains the source of truth; the Google Doc is generated publication only.

## Depends on

- Phase 1 Firebase Authentication, Firestore groups, verified administrator role checks, and server-side Firebase Admin credentials.
- Google Cloud OAuth configuration with Google Docs and Drive APIs enabled.

## In scope

- Administrator Google authorization and callback flow.
- Creation of a new group prayer Doc.
- Viewer-only link-sharing acknowledgement and configuration.
- Deterministic request renderer and server publication service.
- Encrypted refresh-token storage in `groups/{groupId}/private/googleDoc`.
- Publication status recording in Firestore.

## Implementation steps

1. Add a server-only Google Doc connection document under each group; Firestore rules must deny all client access to it.
2. Build the admin settings page and require an acknowledgement before selecting “anyone with the link can view.”
3. Start a separate Google OAuth flow for Docs/Drive with only the scopes needed to create and update the group Doc.
4. On callback, re-verify the Firebase session and group admin role before creating the Doc.
5. Encrypt the Google refresh token before saving it in Firestore; never expose it to browser code.
6. Create and render the Doc with its group name, privacy reminder, last-updated time, active requests, and optional answered section.
7. Implement publication status, safe failure state, and later retry controls.
8. Verify Actualize publication never uses AVBC’s connection or document, and vice versa.

## Security requirements

- Google refresh tokens are encrypted at rest and readable only through Firebase Admin inside Vercel routes.
- General readers receive Google viewer access only—never editor/commenter access.
- No request text or tokens appear in Google API error logs.
- Disconnecting stops future synchronization but does not erase already-published Google Doc content; administrators are warned.

## Acceptance criteria

- A group admin can create a separate viewer-only Google Doc for their group.
- The connection metadata and token are inaccessible through Firebase client SDKs.
- A connected Doc initially renders the group’s privacy reminder and no request data from any other group.
- A simulated publication failure is reflected in safe Firestore status without leaking private content.

## Deliverables

- Google connection and callback routes.
- Encrypted Firestore connection document.
- Document renderer and group-scoped publisher.
- Admin Google Doc settings page.
- Group-scoped audit events for connection success, connection failure, settings changes, retries, and publication outcome.

## Completion checkpoint

Actualize and AVBC can each maintain their own independently authorized, view-only Google Doc without sharing credentials or content.

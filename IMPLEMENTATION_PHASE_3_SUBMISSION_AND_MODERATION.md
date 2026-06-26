# Prayer Board — Phase 3: Request Submission and Moderation Queue

## Purpose

Create the complete, moderated intake workflow. Actualize and AVBC have separate opaque submission links; the link alone determines the target group, and the form never asks a person to choose a group. Anonymous guests can submit with no account; named submissions require SSO. Nothing is published to that group’s Google Doc until an administrator approves it.

## Depends on

- Phase 1 identity, session, group, and administrator authorization.
- Phase 2 Google Doc publication service, tested with fixtures.

## In scope

- Unlisted submission route and thank-you page.
- Anonymous guest and authenticated named-submission paths.
- Writing templates, validation, consent, rate limiting, and spam protection.
- Pending queue and approve/edit/reject/remove actions.
- Request audit events and publication trigger after approved changes.

## Out of scope

- Submitter receipts, email notifications, or follow-up conversations.
- Member comments or encouragement messages.
- The optional member prayer board and private prayer markers.

## Implementation steps

1. Add group-scoped Firestore `requests` and `auditEvents` documents, including statuses, display preference, category, duration, submission timestamps, and group relationship.
2. Build the unlisted `/submit/[submission-token]` route. Resolve the opaque token server-side to exactly one group; it must permit submission but never show published board content, present a group picker, or reveal other group metadata.
3. Present the first clear choice:
   - **Submit anonymously** — no account required
   - **Sign in to submit with my name** — starts SSO when required
4. Build the shared form fields: optional title, required request text, category, duration, consent checkbox, and optional templates.
5. For named requests, populate the display name from the authenticated profile. Do not offer an unauthenticated arbitrary name field.
6. For signed-in anonymous-to-group requests, store account linkage for administrators while rendering “Anonymous” to readers.
7. Add server-side validation, plain-text sanitization, character limits, accessible field errors, and a gentle privacy reminder.
8. Add rate limits and basic bot controls suitable for the public anonymous route.
9. Save new requests as `pending`, create an audit event, and show the confirmation page.
10. Build the admin pending queue with readable request context and clear actions: approve, edit then approve, reject, or remove.
11. Require confirmation before permanent removal. Keep moderation notes administrator-only.
12. Trigger Google Doc publication after any approved request is created, edited, or removed from publication.
13. Test the end-to-end anonymous, named, and signed-in-anonymous workflows.

## Form and moderation experience requirements

- The anonymous path must not show a sign-in wall, email field, or password field.
- The named path must never claim an identity until SSO returns successfully.
- Templates assist but never replace free-form writing.
- The submission confirmation says the request is awaiting review; it does not promise a publication time.
- The moderation queue gives administrators sufficient context to protect privacy without exposing data to members.
- A privacy edit must be distinguishable in the audit history without retaining unnecessary duplicate text.

## Tests and acceptance criteria

- A guest can submit a valid anonymous request through either group’s own link, which starts as `pending` and does not appear in any Google Doc.
- A guest cannot send a named request without completing SSO.
- A signed-in user can submit named and anonymous-to-group requests.
- The member-facing name of an anonymous-to-group request is never exposed to Google Doc readers.
- Invalid, blank, too-long, or consent-free submissions receive accessible errors.
- An administrator can approve an Actualize or AVBC request and see it appear once in that group’s connected Google Doc, never the other group’s Doc.
- An administrator can edit a request before approval, reject it, or permanently remove it.
- Ordinary members and unauthenticated users cannot open the moderation queue.
- Rate-limit tests prevent abusive repeat submissions while allowing normal use.

## Deliverables

- Public unlisted submission experience.
- Authenticated named-submission flow.
- Request schema, validation, and audit events.
- Administrator pending queue and moderation actions.
- End-to-end publication trigger from approval.

## Completion checkpoint

A real person can submit a request safely, and an administrator can review it before it becomes visible in the group’s Google Doc.

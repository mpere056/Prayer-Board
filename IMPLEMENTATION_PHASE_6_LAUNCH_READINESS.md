# Prayer Board — Phase 6: Launch Readiness

## Purpose

Prepare the product for a real first group. Validate privacy, security, reliability, usability, and operating guidance before sharing the submission and Google Doc links.

## Depends on

- Completion of Phases 1–5 for the selected first-release scope.
- A test group, test Google account/document, and production Vercel environment.

## In scope

- Security, privacy, and authorization review.
- End-to-end test pass and pilot group feedback.
- Monitoring, backups, and recovery procedures.
- Administrator and reader guidance.
- Production deployment and smoke testing.

## Out of scope

- Broad multi-group public launch.
- New core features discovered during launch testing, unless they fix a safety or usability blocker.

## Implementation steps

1. Re-run Firestore-rule and server-authorization tests against the production Firebase project. Attempt cross-group access, direct route access, and moderator-action bypasses.
2. Review every page for privacy disclosures: anonymous meaning, named SSO meaning, Google Doc sharing risk, consent, retention, and document disconnect behavior.
3. Test realistic request samples: short, long, sensitive, anonymous, named, signed-in anonymous-to-group, template-based, malformed, and spam-like submissions.
4. Exercise the complete path: submit, approve, publish, edit, archive, restore, remove, and retry after a simulated publication failure.
5. Verify Actualize and AVBC each have the intended distinct viewer-only Google Doc, with no pending, removed, or cross-group content.
6. Set up application error monitoring, scheduled-job monitoring, and Google publication-failure alerts. Exclude request bodies, emails, access tokens, and secrets from telemetry.
7. Verify Firestore export/backup schedules and perform a documented restoration rehearsal in a non-production environment.
8. Write short administrator guides for moderation, named/anonymous handling, Google Doc sharing, publication retry, member management, and emergency removal.
9. Write a short group-reader note for the Google Doc: why requests are private, do not forward without permission, and how to submit a request.
10. Run a small pilot with trusted users, observe where they hesitate, and fix high-impact clarity or safety issues.
11. Configure the production domain, Firebase environment values, deployed Firestore rules, OAuth redirect URLs, and Vercel deployment settings.
12. Conduct production smoke tests using non-sensitive test requests, then remove those tests before inviting the real group.
13. Keep automated lifecycle regression tests in the normal verification suite so invalid transitions and publication omissions fail before deployment.

## Launch checklist

- [ ] Google SSO works in production.
- [ ] Facebook sign-in works in production for an app-role tester.
- [ ] Anonymous submission requires no account.
- [ ] Named submission cannot be impersonated without SSO.
- [ ] Board and admin routes reject non-members and non-admins.
- [ ] A newly approved request appears in the correct Google Doc.
- [ ] Actualize and AVBC submission links resolve only to their own group and never show a group picker.
- [ ] An Actualize request cannot be viewed or published through AVBC, and vice versa.
- [ ] Archived and removed requests disappear from the active Google Doc.
- [ ] Due active requests can be archived manually without a scheduled paid job.
- [ ] Google Doc readers have viewer-only access.
- [ ] The document-sharing acknowledgement is shown to administrators.
- [ ] Publication failures are visible and retryable.
- [ ] Firestore exports/backups and restoration instructions are verified.
- [x] Privacy notice and moderation guide are published.
- [x] Public user-data deletion instructions are published for Meta/Facebook configuration.
- [x] Public Terms of Service are published for authentication-provider configuration.
- [ ] Production alerts do not expose prayer-request content.

## Pilot success criteria

- A guest can submit an anonymous request without assistance.
- An administrator can approve a request and verify it in the Google Doc without assistance.
- A reader can open the Doc link and understand what it is immediately.
- Pilot users understand that the Doc link should not be forwarded casually.
- No pilot finding reveals unauthorized access, identity leakage, or dangerous publication behavior.

## Deliverables

- Production deployment and documented environment configuration.
- Automated lifecycle and submitter-change regression tests.
- Security and privacy review results.
- Monitoring and backup/recovery runbook.
- Administrator quick-start and group-reader guidance.
- Pilot findings and resolved launch blockers.

## Completion checkpoint

The first group can safely receive the anonymous submission link and the view-only Google Doc link, with administrators able to operate the system without developer assistance.

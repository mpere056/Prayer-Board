# Prayer Board — Phase 1: Firebase Foundation and Access Control

## Purpose

Create the secure foundation: Firebase Google sign-in, verified session cookies, groups, memberships, roles, protected routes, and Firestore-enforced group isolation. No prayer request can be viewed or administered until this phase is complete.

## Depends on

- Phase 0 decisions in [the master implementation plan](IMPLEMENTATION_PLAN.md), including the organization-owned Firebase project, privacy notice, and initial groups.
- Firebase Google sign-in configuration, Firestore, and Firebase Admin service-account credentials for Vercel.

## In scope

- Next.js/TypeScript setup and Vercel-ready environment configuration.
- Firebase Authentication Google provider, session creation, and sign-out.
- Firestore `users`, `groups`, and `groups/{groupId}/members` documents.
- `member` and `admin` authorization roles.
- Firestore security rules and Vercel server-side authorization.
- Protected board and administration route shells.
- Bootstrap script for Actualize and AVBC.

## Implementation steps

1. Configure Firebase Authentication Google sign-in and Firebase authorized domains for localhost and Vercel.
2. Create the browser Firebase client and server-only Firebase Admin helpers.
3. Exchange a verified Firebase ID token for an HTTP-only session cookie in a Vercel route handler.
4. Create Firestore rules that deny client writes to sensitive application data and prevent cross-group reads.
5. Build server helpers that verify the session, resolve a group slug, and check membership/administrator role before any protected action.
6. Build the Google-only sign-in page, sign-out endpoint, access-denied page, and protected board/admin route shells.
7. Create the bootstrap script that makes Actualize and AVBC, generates one opaque submission token per group, and assigns the initial administrator.
8. Test signed-out, non-member, member, administrator, and cross-group access paths.

## Security requirements

- Firebase user ID—not email—is the durable account key.
- Session cookies are HTTP-only, same-site, and secure in production.
- Firebase Admin credentials are Vercel server secrets and never reach browser code.
- Firestore rules and server checks both enforce every group/role boundary.
- No password creation, storage, reset, or password-related UI exists.

## Acceptance criteria

- A user can sign in with Google and sign out.
- An Actualize member cannot access AVBC data or routes, and vice versa.
- An administrator can enter only their own group’s admin area.
- A non-member who guesses a board/admin URL sees no group data.
- Firestore rules deny client writes to groups, memberships, and private configuration.
- The bootstrap script creates distinct Actualize and AVBC submission tokens.

## Deliverables

- Firebase Auth + Firestore configuration instructions.
- Firebase session and protected-route implementation.
- Firestore rules and indexes.
- Actualize/AVBC bootstrap script.

## Completion checkpoint

An invited Actualize or AVBC user signs in through Firebase and can reach only the routes and data their group role permits.

# Prayer Board — Phase 4: Optional Member Prayer Board

## Purpose

Offer an optional private app board for invited members who want filtering, search, and private `I prayed` markers. The shareable Google Doc remains the default reading surface and does not require Prayer Board sign-in.

## Depends on

- Phase 1 protected member routes and group authorization.
- Phase 3 approved-request data and moderation workflow.

## In scope

- Active, answered, and archived private request views.
- Card-based request display, search, filtering, and sorting.
- Private prayer marks.
- Responsive, accessible mobile-first interaction.

## Out of scope

- Public access to the board.
- Comments, direct messages, reactions, or aggregate prayer counts.
- Publishing content from the board that bypasses moderation.

## Implementation steps

1. Add the group-scoped `prayerMarks` Firestore collection, using a composite member/request document ID and group-safe Firestore rules.
2. Build the active board route to return only approved active requests from the current member’s group.
3. Create a quiet request-card component with title, request text, category, display name or anonymous marker, posting date, and duration.
4. Add text search, category filter, active/answered/archive navigation, and newest/oldest sort.
5. Add the `I prayed` control. It must be a private toggle and clearly explain that other group members cannot see it.
6. Build purposeful empty, loading, signed-out, and access-denied states.
7. Implement responsive layouts, touch targets, visible focus states, semantic form controls, and contrast checks.
8. Confirm the board always renders the same approved request content as the Google Doc, except for private app-only capabilities such as prayer markers and filters.
9. Add component, integration, and browser-level accessibility tests.

## User experience requirements

- The primary screen should be readable without tutorials: request cards, simple filters, and one `I prayed` action.
- No request card shows email addresses, account identifiers, moderator notes, or private audit activity.
- The board should remain useful with no requests, one request, and many requests.
- Filtering should be optional; the default list must be immediately readable.
- The Google Doc link may be shown as a convenience to members, but members must not need it to use the board.

## Tests and acceptance criteria

- An Actualize or AVBC member sees only approved requests in their own group and never pending, rejected, removed, or other-group requests.
- Search and filters produce correct, permission-safe results.
- A prayer mark is created once per member/request and toggles correctly.
- A member cannot see or mutate another member’s prayer mark.
- Anonymous request display is identical in its privacy guarantees on the board and Google Doc.
- Keyboard-only navigation reaches filters, request cards, and prayer controls in a sensible order.
- The core board and prayer-mark flow works on common phone widths.

## Deliverables

- Private member board with active, answered, and archive views.
- Private prayer-mark feature and schema.
- Search, category filters, and sorting.
- Accessibility and responsive-layout test coverage.

## Completion checkpoint

An invited member can privately pray through a clean filtered list while people who only have the Google Doc link can still read the approved requests without the app.

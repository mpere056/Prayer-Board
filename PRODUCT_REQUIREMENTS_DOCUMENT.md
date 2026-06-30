# Prayer Board — Product Requirements Document

## 1. Product summary

Prayer Board is a simple multi-group space for a faith community to collect, review, and pray through prayer requests. The first two isolated groups are **Actualize** and **AVBC**. Each group has its own submission link, Google Doc, private app route, members, and administrators. People submit an anonymous request through the link they were given, without an account, or sign in with a trusted identity provider to submit a request in their name. Every request is reviewed before it is shown. Approved requests are published into that group’s shareable, view-only Google Doc so its readers can use one familiar link without needing an app account. The app remains the place for submission, moderation, and administration.

The product should feel calm, dignified, and easy to use. It is not a social network, public forum, or general-purpose chat tool.

## 2. Problem and opportunity

Prayer requests are often collected through messages, paper notes, email, or word of mouth. These approaches are hard to organize, can expose private details, and make it difficult for a group to remember what to pray for over time.

Prayer Board provides one respectful workflow:

1. A person shares a request.
2. An administrator reviews it.
3. The group sees approved requests in one private place.
4. Members pray and can privately mark that they have done so.
5. Requests are updated, answered, or archived instead of becoming stale.

## 3. Product goals

- Make anonymous submission take less than two minutes, without requiring sign-in or asking the submitter to choose a group.
- Make member and administrator sign-in feel familiar, offering Google, Facebook, and verified email accounts.
- Protect privacy through group access, clear sharing choices, and administrator review.
- Publish an uncluttered, prayer-focused Google Doc that groups can open without app sign-in.
- Make moderation straightforward for a small group of trusted administrators.
- Keep the first release small enough to operate confidently.

## 4. Non-goals for the first release

- Public discovery of prayer requests or groups.
- A submission-time group picker, cross-posting a request, or sharing data between groups.
- Public comments, discussion threads, or direct messaging.
- Social feeds, reactions, rankings, or engagement-oriented features.
- Payments, donations, or church-management features.
- A native mobile application (the submission and administration web app must work well on phones).
- Fully anonymous unmoderated posting.

## 5. Users and roles

### Anonymous submitter

Anyone who has the group’s request-submission link. They can submit anonymously without an account, but cannot view the private prayer board.

### Authenticated submitter

Anyone who signs in through Google, Facebook, or a verified email account. They can submit a request under their authenticated account identity, but do not gain board access unless they are also an invited group member. They can privately see requests linked to their account and ask an administrator to update, mark answered, or remove them.

### Google Doc reader

Anyone who receives the group’s Google Doc link and has the sharing permission selected by the group owner. A reader needs no Prayer Board account. They have view-only access to the current published requests.

### Member

An invited, signed-in person who can use the optional private app board and privately record that they prayed. The Google Doc does not require them to sign in to Prayer Board.

### Administrator

A trusted group member who can approve, edit for privacy, reject, archive, restore, and delete requests. Administrators can also invite members and manage basic group settings.

## 6. Core user journeys

### Submit a request

1. The submitter opens an unlisted group-specific link.
2. They choose **Submit anonymously** or **Sign in to submit with my name**.
3. An anonymous submitter writes a request without creating an account. A named submitter signs in with Google, Facebook, or a verified email account, then writes their request.
4. They choose an optional template and category, and confirm that they have permission to share the information.
5. They submit the request and see a kind confirmation that it will be reviewed.

### Read and pray through the Google Doc

1. A group leader sends the group’s Google Doc link.
2. A reader opens the view-only document without needing a Prayer Board account.
3. The document shows approved active requests, grouped in a consistent, easy-to-scan format.
4. A reader prays through the requests. They do not need to log an action or comment in the document.

### Optional app prayer board

1. A member signs in with Google, Facebook, or a verified email account and opens their group’s board.
2. They see approved, active requests in a clear card-based list.
3. They filter or search if useful.
4. They open or read a request and select **I prayed**.
5. The action is private by default; it helps the member remember their own prayer practice.

### Moderate requests

1. An administrator opens the pending queue.
2. They approve the request as submitted, make a privacy edit, reject it, or remove it.
3. Approved requests appear on the group board immediately.
4. Administrators can later mark requests answered, archive them, or remove them permanently.

## 7. Functional requirements

### 7.1 Groups and access

- The first groups are Actualize and AVBC. The data model supports adding more isolated groups later.
- Each group has a name, description, timezone, a private app slug, and a unique opaque submission token.
- A request belongs to exactly one group. It cannot be submitted to, published to, or viewed in more than one group.
- Prayer-board access requires Firebase Authentication sign-in and an active membership in that group.
- Administrators can invite, remove, and promote group members.
- Every group has a distinct unlisted submission URL, such as `/submit/[submission-token]`. The URL resolves the target group privately; the form never asks the submitter to choose a group or shows other group names.
- The submission link may be shared publicly, but it grants submission to that single group only—not app-board access or visibility into any other group.
- The app must prevent users from accessing another group’s requests, membership, or administration areas.
- The application never stores passwords in Firestore or custom application storage. Firebase Authentication owns email-password creation, verification, and reset.

### 7.2 Authentication and identity

- The application supports Google, Facebook, and verified email/password accounts through Firebase Authentication.
- Google and Facebook are available alongside email/password for people who prefer different sign-in methods. Microsoft and Apple may be enabled when provider setup and support needs are ready.
- Firebase Authentication is required to view a prayer board, use administrator functions, or submit a request that displays a name.
- An authenticated account may submit to the group behind its unlisted link without becoming a board member; membership is a separate authorization decision.
- For named submissions, the displayed name is the authenticated account’s profile name or a name previously set by that signed-in user. It is never an arbitrary unauthenticated text field.
- The system stores only the minimum identity data required to associate an account and authorize access, such as provider, stable provider subject identifier, email when supplied, and profile display name.

### 7.3 Request submission

- The initial choice is **Submit anonymously** or **Sign in to submit with my name**.
- Anonymous submission requires no account, password, or email address.
- Named submission redirects to sign-in when the person is not already authenticated. If they typed a draft first, the app should preserve it locally while they sign in.
- A submitter can enter a title and main prayer-request text.
- A request must have a non-empty main text. The title may be optional in the first release, with a generated fallback such as “Prayer request.”
- A submitter can choose a category: health, family and relationships, work or school, grief, guidance, praise, or other.
- A submitter can choose a duration: this week, this month, ongoing, or unspecified.
- An anonymous submission always displays as **Anonymous** to members and has no associated account identity.
- A signed-in submitter can submit a **Named** request that displays their authenticated profile name to the group.
- A signed-in submitter can instead submit **Anonymous to the group**; members see “Anonymous,” while administrators can see the linked account identity for moderation.
- Signed-in submitters can see only their own linked requests across groups. Anonymous guest submissions cannot be claimed or connected to an account later.
- A submitter-requested edit, answered status, or removal enters the group’s review queue and never changes published content until an administrator approves it.
- Submission includes a required consent checkbox: “I have permission to share the information in this request.”
- The request enters **Pending** status by default.
- The confirmation page explains that an administrator will review the request before it is visible to the group.
- The form displays a short reminder not to share another person’s private details without their permission.

### 7.4 Optional writing templates

Templates are optional prompts that fill or guide the main text area; they never restrict free-form writing.

- General: “Please pray for ___ as I face ___. I am asking for ___.”
- Peace and guidance: “I am feeling ___ about ___. Please pray for wisdom, peace, and a clear next step.”
- Care for another person: “Please pray for someone close to me who is experiencing ___. They need ___.”
- Health: “Please pray for strength, care, and healing as I/we navigate ___.”
- Praise: “I am grateful for ___. Please join me in giving thanks for ___.”

### 7.5 Published Google Doc

- Each group has one administrator-connected Google Doc used as its published prayer-request view. Actualize and AVBC always use distinct documents.
- The app is the authoritative source of request data. The Google Doc is a generated, read-only publication of approved requests; edits made directly in the Doc are not treated as updates to the app.
- Administrators choose the Google Doc’s Google Drive sharing setting. The recommended first-release setting is **Anyone with the link — Viewer** when the intent is broad link-based access.
- The app must clearly warn administrators that anyone with the link can read every approved request in that document. The group should use named requests only with that audience in mind.
- The app must never grant Google Doc edit or comment access to general readers. Document editing stays with the connected administrator or designated document owners.
- The Doc is updated after an administrator approves, edits, answers, archives, restores, or removes a request. The app should display the last successful publication time and any sync failure to administrators.
- Google Doc connection, disconnection, settings changes, retry attempts, and retry outcomes are recorded in the group audit log without request text or OAuth credentials.
- The published document contains only active approved requests by default. It may include a separate **Answered prayers and praise** section if the group enables it. Pending, rejected, removed, and archived requests are never published.
- A group’s Google Doc must contain only requests from that group. It must never combine Actualize and AVBC requests or expose links/content from another group.
- If a group disconnects its Google Doc, publication stops and the app alerts administrators that they must revoke sharing or manually remove existing document content if required.

#### Google Doc format

The first page begins with the group name, a short invitation to pray, the last-updated time, and a brief privacy reminder: “Please do not forward or copy requests outside this group without permission.”

Each active request is rendered consistently:

> **[Category] Title or “Prayer request”**
>
> Request text
> *Name or Anonymous · Posted month/day · Ongoing when applicable*

The document groups requests by category when there are enough requests to make grouping useful; otherwise it uses one newest-first list. Answered prayers appear in a clearly separate section rather than among active requests.

### 7.6 Optional app prayer board

- Members see only approved, active requests from their group.
- A request card shows title, request text, display name or “Anonymous,” category, and posting date.
- Cards may show duration when present.
- Members can search request text and filter by category, status, and recency.
- A member can select **I prayed** on a request. This creates one private prayer record per member per request and can be toggled off.
- The default board is ordered newest first; members may also view oldest first.
- Members can view answered and archived requests in separate, clearly labeled views.
- No public comments or member-to-member messages are included in the first release.

### 7.7 Request lifecycle

| Status | Meaning | Visible to members |
| --- | --- | --- |
| Pending | Awaiting administrator review | No |
| Approved | Current request for prayer | Yes |
| Answered | Prayer has an answer or praise update | Yes, in answered view |
| Archived | No longer current, retained for history | Yes, in archive view |
| Rejected | Not approved for posting | No |
| Removed | Deleted for spam, safety, or privacy | No |

- Administrators can approve, reject, mark answered, archive, restore, or remove a request.
- Groups configure a default archival period (recommended default: 30 days) and whether requests marked “ongoing” are exempt.
- The system should preserve an administrative audit trail of lifecycle actions and privacy edits.

### 7.8 Administration

- Administrators have a pending-request queue, including submission date, request text, display preference, category, and any provided submitter name.
- Administrators can edit a request before approval, particularly to remove unnecessary identifying details.
- Rejection may include an optional, courteous reason for internal records; no outbound notification is required in the first release.
- Administrators can delete a request permanently after confirmation.
- The dashboard displays counts for pending, active, answered, and archived requests.

## 8. Privacy, safety, and trust

- Use clear language: an anonymous guest submission has no associated account identity; “Anonymous to the group” from a signed-in user is still linked to that user for administrators.
- Before enabling “anyone with the link” access to the Google Doc, require an administrator acknowledgement that the content can be forwarded and that link sharing is not the same as member authentication.
- Do not display email addresses or internal identifiers on the board.
- Store only information needed to operate the group and Firebase authorization; avoid collecting sensitive information beyond the request itself.
- Do not collect or store application passwords, password-reset tokens, or password hints in Firestore or app-owned storage.
- Use Firebase Authentication and Firestore security rules, reinforced by server-side group-role checks, to restrict data access by group membership and administrator role.
- Provide rate limiting and basic spam protection on public submission links.
- Make deletion deliberate and auditable. Deleted request content should be removed according to the data-retention policy.
- Present a short privacy notice on submission and a longer policy page before launch.
- Use respectful, non-clinical moderation language; administrators should be able to remove harmful or personally identifying content quickly.

## 9. Information architecture

| Route | Purpose | Access |
| --- | --- | --- |
| `/submit/[submission-token]` | Submit a request to the link’s single group | Anyone with unlisted link |
| `/submit/[submission-token]/thanks` | Submission confirmation | Submitter |
| `/sign-in` | Google and Facebook sign-in, email account creation, email sign-in, and password reset | Anyone |
| `/privacy` | Privacy notice for request handling, identity, and Google Doc sharing | Anyone |
| `/my-requests` | View linked submissions and request updates, answered status, or removal | Signed-in submitter |
| `/board/[group-slug]` | Optional private prayer board | Member or administrator |
| `/board/[group-slug]/answered` | Optional private answered-request view | Member or administrator |
| `/board/[group-slug]/archive` | Optional private archive view | Member or administrator |
| `/admin/[group-slug]` | Pending queue and overview | Administrator |
| `/admin/[group-slug]/members` | Membership management | Administrator |
| `/admin/[group-slug]/settings` | Group, Google Doc, and publication settings | Administrator |
| `/admin/[group-slug]/readiness` | Launch-readiness checks for setup, publishing, members, and maintenance | Administrator |
| `/admin/[group-slug]/guide` | Administrator quick-start, sharing guidance, and suggested messages | Administrator |
| `/admin/[group-slug]/audit` | Recent submissions, moderation, member, and Google Doc activity | Administrator |

## 10. Success measures

- Median time to submit a request is under two minutes.
- At least 90% of submissions can be approved without administrator edits after the group has learned the form.
- Administrators can moderate a pending request in under one minute.
- Members can find an active request and record “I prayed” in under 30 seconds on a phone.
- No unauthorized cross-group data access occurs.

## 11. Open decisions before implementation

1. Which additional providers beyond Google and Facebook should follow: Microsoft, Apple, or both?
2. Should administrators see the identity behind an anonymous-to-group request when a signed-in person submits it?
3. Are prayer counts strictly private to each member, or should an aggregate count be visible on a card?
4. Should the Google Doc include an “Answered prayers and praise” section, or only active requests?
5. How long should approved and archived requests be retained by default?

## 12. Recommended first-release decisions

- Anonymous guest submission is allowed through an unlisted link and does not require sign-in.
- A named request requires Google, Facebook, or a verified email account and displays the authenticated account profile name; this reduces impersonation.
- Signed-in people can also submit anonymously to the group; administrators retain that account linkage for moderation.
- Google and Facebook sign-in plus verified email/password accounts are available; add Microsoft and Apple after their setup is complete.
- Create Actualize and AVBC as the two initial groups. Generate a separate opaque submission token and separate private app link for each.
- Never present a group-selection control to a submitter. The link determines the group, and a request belongs to that group only.
- Every group’s approved requests are automatically published to a connected view-only Google Doc.
- The Google Doc is the group’s default reading surface; the authenticated app board and private prayer markers remain optional.
- The Google Doc includes active approved requests only and is shared by the group administrator as “anyone with the link can view” when broad link access is desired.
- “I prayed” is private to the member; show no aggregate count initially.
- No email or push notifications in the first release.
- Approved requests archive automatically after 30 days, except ongoing requests.
- Administrators approve every new request.

import { FieldValue } from "firebase-admin/firestore";
import { firebaseAdminDb } from "@/lib/firebase/admin";
import type { PrayerRequestForPublication } from "@/lib/google-docs";
import {
  DEFAULT_ARCHIVE_POLICY,
  isRequestDueForArchive,
  type ArchivePolicy,
} from "@/lib/archive-policy";

export type GroupRole = "member" | "admin";

export type PrayerGroup = {
  id: string;
  name: string;
  slug: string;
  submissionToken: string;
  defaultArchiveAfterDays: number;
  exemptOngoingFromArchive: boolean;
};

export type GroupMembership = {
  userId?: string;
  role: GroupRole;
  email?: string | null;
  displayName?: string | null;
  createdAt?: { toMillis(): number; toDate(): Date };
};

export type GoogleDocConnection = {
  documentId: string;
  documentUrl: string;
  connectedByUserId: string;
  sharingMode: "restricted" | "anyone_with_link_viewer";
  includeAnsweredSection: boolean;
  encryptedRefreshToken: string;
  lastPublishedAt?: string;
  lastPublicationStatus: "ready" | "failed";
  lastPublicationError?: string | null;
  createdAt?: { toMillis(): number; toDate(): Date };
  updatedAt?: { toMillis(): number; toDate(): Date };
};

export type PrayerRequestStatus = "pending" | "approved" | "answered" | "archived" | "rejected" | "removed";

export type StoredPrayerRequest = {
  id: string;
  title: string | null;
  body: string;
  category: string | null;
  duration: string | null;
  anonymity: "named" | "anonymous_to_group";
  submitterName: string | null;
  submitterUserId: string | null;
  status: PrayerRequestStatus;
  submittedAt?: { toMillis(): number; toDate(): Date };
  approvedAt?: { toMillis(): number; toDate(): Date };
  answeredAt?: { toMillis(): number; toDate(): Date };
  archivedAt?: { toMillis(): number; toDate(): Date };
  statusBeforeArchive?: "approved" | "answered" | null;
};

export type BoardPrayerRequest = {
  id: string;
  title: string | null;
  body: string;
  category: string | null;
  duration: string | null;
  displayName: string | null;
  submittedAt: string;
  status: PrayerRequestStatus;
};

export type PrayerRequestStatusCounts = Record<PrayerRequestStatus, number>;

export type RequestChangeAction = "update" | "mark_answered" | "remove";
export type RequestChangeStatus = "pending" | "approved" | "declined";

export type RequestChange = {
  id: string;
  requestId: string;
  submitterUserId: string;
  action: RequestChangeAction;
  status: RequestChangeStatus;
  note?: string | null;
  proposedTitle?: string | null;
  proposedBody?: string | null;
  proposedCategory?: string | null;
  proposedDuration?: string | null;
  requestedAt?: { toMillis(): number; toDate(): Date };
  reviewedAt?: { toMillis(): number; toDate(): Date };
};

export type UserPrayerRequest = StoredPrayerRequest & {
  groupId: string;
  groupName: string;
  groupSlug: string;
  pendingChange: RequestChange | null;
  latestChange: RequestChange | null;
};

export type PendingRequestChange = RequestChange & {
  request: StoredPrayerRequest;
};

export type GroupAuditEvent = {
  id: string;
  eventType: string;
  actorUserId?: string | null;
  requestId?: string | null;
  targetUserId?: string | null;
  role?: GroupRole | null;
  archivedCount?: number | null;
  publicationSucceeded?: boolean | null;
  sharingMode?: "restricted" | "anyone_with_link_viewer" | null;
  requestedAction?: RequestChangeAction | null;
  createdAt?: { toMillis(): number; toDate(): Date };
};

function prayerGroupFromDocument(document: { id: string; data(): FirebaseFirestore.DocumentData }): PrayerGroup {
  const data = document.data();
  return {
    id: document.id,
    name: data.name,
    slug: data.slug,
    submissionToken: data.submissionToken,
    defaultArchiveAfterDays: data.defaultArchiveAfterDays ?? DEFAULT_ARCHIVE_POLICY.defaultArchiveAfterDays,
    exemptOngoingFromArchive: data.exemptOngoingFromArchive ?? DEFAULT_ARCHIVE_POLICY.exemptOngoingFromArchive,
  };
}

export async function findGroupBySlug(slug: string): Promise<PrayerGroup | null> {
  const snapshot = await firebaseAdminDb().collection("groups").where("slug", "==", slug).limit(1).get();
  const document = snapshot.docs[0];
  if (!document) return null;
  return prayerGroupFromDocument(document);
}

export async function findGroupBySubmissionToken(submissionToken: string): Promise<PrayerGroup | null> {
  const snapshot = await firebaseAdminDb()
    .collection("groups")
    .where("submissionToken", "==", submissionToken)
    .limit(1)
    .get();
  const document = snapshot.docs[0];
  if (!document) return null;
  return prayerGroupFromDocument(document);
}

export async function listGroupsForUser(userId: string): Promise<Array<PrayerGroup & { role: GroupRole }>> {
  const snapshot = await firebaseAdminDb().collection("groups").get();
  const groups = await Promise.all(snapshot.docs.map(async (document) => {
    const membership = await document.ref.collection("members").doc(userId).get();
    const role = membership.data()?.role;
    if (role !== "member" && role !== "admin") return null;

    return { ...prayerGroupFromDocument(document), role };
  }));

  return groups
    .filter((group): group is PrayerGroup & { role: GroupRole } => Boolean(group))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function groupMemberReference(groupId: string, userId: string) {
  return firebaseAdminDb().doc(`groups/${groupId}/members/${userId}`);
}

export function groupGoogleDocReference(groupId: string) {
  return firebaseAdminDb().doc(`groups/${groupId}/private/googleDoc`);
}

export function groupRequestReference(groupId: string, requestId: string) {
  return firebaseAdminDb().doc(`groups/${groupId}/requests/${requestId}`);
}

export function groupAuditEvents(groupId: string) {
  return firebaseAdminDb().collection(`groups/${groupId}/auditEvents`);
}

export function groupRequestChanges(groupId: string) {
  return firebaseAdminDb().collection(`groups/${groupId}/requestChanges`);
}

export async function listPendingPrayerRequests(groupId: string): Promise<StoredPrayerRequest[]> {
  const snapshot = await firebaseAdminDb()
    .collection(`groups/${groupId}/requests`)
    .where("status", "==", "pending")
    .get();

  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }) as StoredPrayerRequest)
    .sort((a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0));
}

export async function listPrayerRequestsForUser(userId: string): Promise<UserPrayerRequest[]> {
  const groups = await firebaseAdminDb().collection("groups").get();
  const results = await Promise.all(groups.docs.map(async (groupDocument) => {
    const requestSnapshot = await groupDocument.ref.collection("requests")
      .where("submitterUserId", "==", userId)
      .get();
    const groupData = groupDocument.data();

    return Promise.all(requestSnapshot.docs.map(async (requestDocument) => {
      const changeDocument = await groupRequestChanges(groupDocument.id).doc(requestDocument.id).get();
      const change = changeDocument.exists
        ? ({ id: changeDocument.id, ...changeDocument.data() } as RequestChange)
        : null;

      return {
        id: requestDocument.id,
        ...requestDocument.data(),
        groupId: groupDocument.id,
        groupName: groupData.name,
        groupSlug: groupData.slug,
        pendingChange: change?.status === "pending" ? change : null,
        latestChange: change,
      } as UserPrayerRequest;
    }));
  }));

  return results.flat().sort((a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0));
}

export async function listPendingRequestChanges(groupId: string): Promise<PendingRequestChange[]> {
  const snapshot = await groupRequestChanges(groupId).where("status", "==", "pending").get();
  const changes = await Promise.all(snapshot.docs.map(async (document) => {
    const change = { id: document.id, ...document.data() } as RequestChange;
    const request = await groupRequestReference(groupId, change.requestId).get();
    if (!request.exists) return null;
    return {
      ...change,
      request: { id: request.id, ...request.data() } as StoredPrayerRequest,
    } as PendingRequestChange;
  }));

  return changes
    .filter((change): change is PendingRequestChange => Boolean(change))
    .sort((a, b) => (a.requestedAt?.toMillis() ?? 0) - (b.requestedAt?.toMillis() ?? 0));
}

export async function listApprovedRequestsForPublication(groupId: string): Promise<PrayerRequestForPublication[]> {
  return listRequestsForPublication(groupId, false);
}

export async function listRequestsForPublication(groupId: string, includeAnswered: boolean): Promise<PrayerRequestForPublication[]> {
  const statuses: PrayerRequestStatus[] = includeAnswered ? ["approved", "answered"] : ["approved"];
  const snapshot = await firebaseAdminDb()
    .collection(`groups/${groupId}/requests`)
    .where("status", "in", statuses)
    .get();

  return snapshot.docs
    .map((document) => document.data() as StoredPrayerRequest)
    .sort((a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0))
    .map((request) => ({
      title: request.title,
      body: request.body,
      category: request.category,
      displayName: request.anonymity === "named" ? request.submitterName : null,
      submittedAt: request.submittedAt?.toDate().toISOString() ?? new Date().toISOString(),
      duration: request.duration,
      status: request.status === "answered" ? "answered" : "approved",
    }));
}

export async function listApprovedPrayerRequestsForBoard(groupId: string): Promise<BoardPrayerRequest[]> {
  return listPrayerRequestsForBoard(groupId, ["approved"]);
}

export async function listPrayerRequestsForBoard(
  groupId: string,
  statuses: PrayerRequestStatus[],
): Promise<BoardPrayerRequest[]> {
  const snapshot = await firebaseAdminDb()
    .collection(`groups/${groupId}/requests`)
    .where("status", "in", statuses)
    .get();

  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }) as StoredPrayerRequest)
    .sort((a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0))
    .map((request) => ({
      id: request.id,
      title: request.title,
      body: request.body,
      category: request.category,
      duration: request.duration,
      displayName: request.anonymity === "named" ? request.submitterName : null,
      submittedAt: request.submittedAt?.toDate().toISOString() ?? new Date().toISOString(),
      status: request.status,
    }));
}

export async function listPrayerRequestsByStatus(
  groupId: string,
  status: PrayerRequestStatus,
): Promise<StoredPrayerRequest[]> {
  const snapshot = await firebaseAdminDb()
    .collection(`groups/${groupId}/requests`)
    .where("status", "==", status)
    .get();

  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }) as StoredPrayerRequest)
    .sort((a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0));
}

export function archivePolicyForGroup(group: PrayerGroup): ArchivePolicy {
  return {
    defaultArchiveAfterDays: group.defaultArchiveAfterDays,
    exemptOngoingFromArchive: group.exemptOngoingFromArchive,
  };
}

export function isApprovedRequestDueForArchive(
  request: StoredPrayerRequest,
  policy: ArchivePolicy = DEFAULT_ARCHIVE_POLICY,
  now = Date.now(),
) {
  return isRequestDueForArchive(request, policy, now);
}

export async function listApprovedRequestsDueForArchive(group: PrayerGroup): Promise<StoredPrayerRequest[]> {
  const requests = await listPrayerRequestsByStatus(group.id, "approved");
  const now = Date.now();
  const policy = archivePolicyForGroup(group);

  return requests.filter((request) => isApprovedRequestDueForArchive(request, policy, now));
}

export async function getPrayerRequestStatusCounts(groupId: string): Promise<PrayerRequestStatusCounts> {
  const counts: PrayerRequestStatusCounts = {
    pending: 0,
    approved: 0,
    answered: 0,
    archived: 0,
    rejected: 0,
    removed: 0,
  };
  const snapshot = await firebaseAdminDb().collection(`groups/${groupId}/requests`).get();
  snapshot.docs.forEach((document) => {
    const status = document.data().status as PrayerRequestStatus;
    if (status in counts) counts[status] += 1;
  });
  return counts;
}

export async function listRecentGroupAuditEvents(groupId: string, limit = 50): Promise<GroupAuditEvent[]> {
  const snapshot = await groupAuditEvents(groupId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as GroupAuditEvent);
}

export async function listGroupMembers(groupId: string): Promise<GroupMembership[]> {
  const snapshot = await firebaseAdminDb().collection(`groups/${groupId}/members`).get();
  return snapshot.docs
    .map((document) => ({ userId: document.id, ...document.data() }) as GroupMembership)
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
      return (a.email ?? a.displayName ?? "").localeCompare(b.email ?? b.displayName ?? "");
    });
}

export async function countGroupAdmins(groupId: string): Promise<number> {
  const snapshot = await firebaseAdminDb()
    .collection(`groups/${groupId}/members`)
    .where("role", "==", "admin")
    .get();
  return snapshot.size;
}

export async function listPrayerMarkRequestIds(groupId: string, userId: string) {
  const snapshot = await firebaseAdminDb()
    .collection(`groups/${groupId}/prayerMarks`)
    .where("userId", "==", userId)
    .get();
  return snapshot.docs.map((document) => document.data().requestId as string);
}

export function prayerMarkReference(groupId: string, userId: string, requestId: string) {
  return firebaseAdminDb().doc(`groups/${groupId}/prayerMarks/${userId}_${requestId}`);
}

export async function getGoogleDocConnection(groupId: string): Promise<GoogleDocConnection | null> {
  const snapshot = await groupGoogleDocReference(groupId).get();
  return snapshot.exists ? (snapshot.data() as GoogleDocConnection) : null;
}

export async function saveGoogleDocConnection(groupId: string, connection: GoogleDocConnection) {
  const existingConnection = await groupGoogleDocReference(groupId).get();
  await groupGoogleDocReference(groupId).set({
    ...connection,
    ...(existingConnection.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

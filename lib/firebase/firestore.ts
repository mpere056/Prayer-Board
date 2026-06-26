import { FieldValue } from "firebase-admin/firestore";
import { firebaseAdminDb } from "@/lib/firebase/admin";
import type { PrayerRequestForPublication } from "@/lib/google-docs";

export type GroupRole = "member" | "admin";

export type PrayerGroup = {
  id: string;
  name: string;
  slug: string;
  submissionToken: string;
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

export type GroupAuditEvent = {
  id: string;
  eventType: string;
  actorUserId?: string | null;
  requestId?: string | null;
  targetUserId?: string | null;
  role?: GroupRole | null;
  archivedCount?: number | null;
  createdAt?: { toMillis(): number; toDate(): Date };
};

export async function findGroupBySlug(slug: string): Promise<PrayerGroup | null> {
  const snapshot = await firebaseAdminDb().collection("groups").where("slug", "==", slug).limit(1).get();
  const document = snapshot.docs[0];
  if (!document) return null;
  const data = document.data();
  return {
    id: document.id,
    name: data.name,
    slug: data.slug,
    submissionToken: data.submissionToken,
  };
}

export async function findGroupBySubmissionToken(submissionToken: string): Promise<PrayerGroup | null> {
  const snapshot = await firebaseAdminDb()
    .collection("groups")
    .where("submissionToken", "==", submissionToken)
    .limit(1)
    .get();
  const document = snapshot.docs[0];
  if (!document) return null;
  const data = document.data();
  return {
    id: document.id,
    name: data.name,
    slug: data.slug,
    submissionToken: data.submissionToken,
  };
}

export async function listGroupsForUser(userId: string): Promise<Array<PrayerGroup & { role: GroupRole }>> {
  const snapshot = await firebaseAdminDb().collection("groups").get();
  const groups = await Promise.all(snapshot.docs.map(async (document) => {
    const membership = await document.ref.collection("members").doc(userId).get();
    const role = membership.data()?.role;
    if (role !== "member" && role !== "admin") return null;

    const data = document.data();
    return {
      id: document.id,
      name: data.name,
      slug: data.slug,
      submissionToken: data.submissionToken,
      role,
    };
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

export async function listPendingPrayerRequests(groupId: string): Promise<StoredPrayerRequest[]> {
  const snapshot = await firebaseAdminDb()
    .collection(`groups/${groupId}/requests`)
    .where("status", "==", "pending")
    .get();

  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }) as StoredPrayerRequest)
    .sort((a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0));
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

function archiveDueAt(request: StoredPrayerRequest) {
  if (request.status !== "approved" || request.duration === "ongoing") return null;

  const baseTime = request.approvedAt?.toMillis() ?? request.submittedAt?.toMillis();
  if (!baseTime) return null;

  const days =
    request.duration === "this_week"
      ? 7
      : 30;

  return baseTime + days * 24 * 60 * 60 * 1000;
}

export function isApprovedRequestDueForArchive(request: StoredPrayerRequest, now = Date.now()) {
  const dueAt = archiveDueAt(request);
  return typeof dueAt === "number" && dueAt <= now;
}

export async function listApprovedRequestsDueForArchive(groupId: string): Promise<StoredPrayerRequest[]> {
  const requests = await listPrayerRequestsByStatus(groupId, "approved");
  const now = Date.now();

  return requests.filter((request) => isApprovedRequestDueForArchive(request, now));
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

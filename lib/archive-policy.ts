export type ArchivePolicy = {
  defaultArchiveAfterDays: number;
  exemptOngoingFromArchive: boolean;
};

type ArchivableRequest = {
  status: string;
  duration: string | null;
  approvedAt?: { toMillis(): number };
  submittedAt?: { toMillis(): number };
};

export const DEFAULT_ARCHIVE_POLICY: ArchivePolicy = {
  defaultArchiveAfterDays: 30,
  exemptOngoingFromArchive: true,
};

export function archiveDueAt(request: ArchivableRequest, policy: ArchivePolicy) {
  if (request.status !== "approved") return null;
  if (request.duration === "ongoing" && policy.exemptOngoingFromArchive) return null;

  const baseTime = request.approvedAt?.toMillis() ?? request.submittedAt?.toMillis();
  if (!baseTime) return null;

  const days = request.duration === "this_week" ? 7 : policy.defaultArchiveAfterDays;
  return baseTime + days * 24 * 60 * 60 * 1000;
}

export function isRequestDueForArchive(
  request: ArchivableRequest,
  policy: ArchivePolicy,
  now = Date.now(),
) {
  const dueAt = archiveDueAt(request, policy);
  return typeof dueAt === "number" && dueAt <= now;
}

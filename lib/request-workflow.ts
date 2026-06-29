export type PrayerRequestStatus = "pending" | "approved" | "answered" | "archived" | "rejected" | "removed";
export type RequestLifecycleAction = "approve" | "reject" | "remove" | "mark_answered" | "archive" | "restore";
export type SubmitterChangeAction = "update" | "mark_answered" | "remove";

export function transitionFor(
  action: RequestLifecycleAction,
  currentStatus: PrayerRequestStatus,
  statusBeforeArchive?: PrayerRequestStatus | null,
) {
  if (action === "approve" && currentStatus === "pending") return { nextStatus: "approved" as const };
  if (action === "reject" && currentStatus === "pending") return { nextStatus: "rejected" as const };
  if (action === "mark_answered" && currentStatus === "approved") return { nextStatus: "answered" as const };
  if (action === "archive" && (currentStatus === "approved" || currentStatus === "answered")) {
    return { nextStatus: "archived" as const, statusBeforeArchive: currentStatus };
  }
  if (action === "restore" && currentStatus === "archived") {
    return {
      nextStatus: statusBeforeArchive === "answered" ? "answered" as const : "approved" as const,
      statusBeforeArchive: null,
    };
  }
  if (action === "remove" && currentStatus !== "removed") return { nextStatus: "removed" as const };
  return null;
}

export function shouldRepublish(currentStatus: PrayerRequestStatus, nextStatus: PrayerRequestStatus) {
  return ["approved", "answered"].includes(currentStatus) || ["approved", "answered"].includes(nextStatus);
}

export function canSubmitChange(action: SubmitterChangeAction, currentStatus: PrayerRequestStatus) {
  if (currentStatus === "removed" || currentStatus === "rejected") return false;
  if (action === "mark_answered") return currentStatus === "approved";
  return true;
}

export function canApproveChange(action: SubmitterChangeAction, currentStatus: PrayerRequestStatus) {
  if (action === "mark_answered") return currentStatus === "approved";
  if (action === "remove") return currentStatus !== "removed";
  return currentStatus !== "removed" && currentStatus !== "rejected";
}

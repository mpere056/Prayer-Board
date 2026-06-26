import { createHash } from "node:crypto";
import { firebaseAdminDb } from "@/lib/firebase/admin";

const windowMs = 10 * 60 * 1000;
const maximumSubmissionsPerWindow = 8;

function rateLimitKey(groupId: string, ipAddress: string) {
  const salt = process.env.SUBMISSION_RATE_LIMIT_SALT?.trim();
  if (!salt) {
    throw new Error("SUBMISSION_RATE_LIMIT_SALT is not configured.");
  }

  return createHash("sha256").update(`${salt}:${groupId}:${ipAddress}`).digest("hex");
}

export async function allowSubmission(groupId: string, ipAddress: string) {
  const reference = firebaseAdminDb().doc(`groups/${groupId}/private/rateLimits/${rateLimitKey(groupId, ipAddress)}`);
  const now = Date.now();

  return firebaseAdminDb().runTransaction(async (transaction) => {
    const previous = await transaction.get(reference);
    const data = previous.data();
    const windowStartedAt = typeof data?.windowStartedAt === "number" ? data.windowStartedAt : 0;
    const currentCount = typeof data?.count === "number" ? data.count : 0;
    const isCurrentWindow = now - windowStartedAt < windowMs;
    const nextCount = isCurrentWindow ? currentCount + 1 : 1;

    transaction.set(reference, {
      windowStartedAt: isCurrentWindow ? windowStartedAt : now,
      count: nextCount,
      expiresAt: now + windowMs,
    });

    return nextCount <= maximumSubmissionsPerWindow;
  });
}

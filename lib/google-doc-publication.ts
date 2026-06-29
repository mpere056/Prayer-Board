import { publishPrayerDocument, type PrayerRequestForPublication } from "@/lib/google-docs";
import {
  getGoogleDocConnection,
  groupGoogleDocReference,
  listRequestsForPublication,
} from "@/lib/firebase/firestore";
import { buildAbsoluteAppUrl } from "@/lib/site-url";

type PublicationResult =
  | { published: true }
  | { published: false; reason: "no_connection" | "failed" };

/**
 * Publishes a group-scoped request list into its connected Doc. Callers supply
 * only requests already authorized for publication; this function never reads
 * across group boundaries and intentionally records no request content in logs.
 */
export async function publishGroupPrayerRequests({
  groupId,
  groupName,
  requests,
  submissionToken,
}: {
  groupId: string;
  groupName: string;
  requests: PrayerRequestForPublication[];
  submissionToken?: string | null;
}): Promise<PublicationResult> {
  const connection = await getGoogleDocConnection(groupId);
  if (!connection) return { published: false, reason: "no_connection" };

  try {
    await publishPrayerDocument({
      groupName,
      documentId: connection.documentId,
      encryptedRefreshToken: connection.encryptedRefreshToken,
      requests,
      submissionUrl: submissionToken ? buildAbsoluteAppUrl(`/submit/${submissionToken}`) : null,
    });
    await groupGoogleDocReference(groupId).update({
      lastPublishedAt: new Date().toISOString(),
      lastPublicationStatus: "ready",
      lastPublicationError: null,
    });
    return { published: true };
  } catch {
    await groupGoogleDocReference(groupId).update({
      lastPublicationStatus: "failed",
      lastPublicationError: "The document could not be updated. Please retry from the group settings.",
    });
    return { published: false, reason: "failed" };
  }
}

export async function publishCurrentGroupPrayerRequests({
  groupId,
  groupName,
  submissionToken,
}: {
  groupId: string;
  groupName: string;
  submissionToken?: string | null;
}): Promise<PublicationResult> {
  const connection = await getGoogleDocConnection(groupId);
  if (!connection) return { published: false, reason: "no_connection" };

  const requests = await listRequestsForPublication(groupId, connection.includeAnsweredSection);
  return publishGroupPrayerRequests({ groupId, groupName, requests, submissionToken });
}

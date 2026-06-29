import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { encryptSecret } from "@/lib/crypto";
import { findGroupAccess, getCurrentUser } from "@/lib/auth";
import { createGoogleDocsOAuthClient, createPrayerDocument, type GoogleDocSharingMode } from "@/lib/google-docs";
import { groupAuditEvents, saveGoogleDocConnection } from "@/lib/firebase/firestore";
import { buildAbsoluteAppUrl } from "@/lib/site-url";

type ConnectionState = {
  state: string;
  groupSlug: string;
  sharingMode: GoogleDocSharingMode;
  includeAnswered: boolean;
};

function settingsUrl(origin: string, groupSlug: string, status: string) {
  return new URL(`/admin/${encodeURIComponent(groupSlug)}/settings?google-doc=${status}`, origin);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const expectedStateCookie = request.headers
    .get("cookie")
    ?.split("; ")
    .find((value) => value.startsWith("prayer-board-google-doc-state="))
    ?.split("=")
    .slice(1)
    .join("=");

  let connectionState: ConnectionState | null = null;
  try {
    connectionState = expectedStateCookie ? JSON.parse(decodeURIComponent(expectedStateCookie)) : null;
  } catch {
    connectionState = null;
  }

  const receivedState = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  if (!connectionState || !code || connectionState.state !== receivedState) {
    return NextResponse.redirect(new URL("/access-denied?google-doc=invalid-state", requestUrl.origin));
  }

  const clearStateAndRedirect = (status: string) => {
    const response = NextResponse.redirect(settingsUrl(requestUrl.origin, connectionState!.groupSlug, status));
    response.cookies.set("prayer-board-google-doc-state", "", { httpOnly: true, maxAge: 0, path: "/" });
    return response;
  };

  const user = await getCurrentUser();
  if (!user) return clearStateAndRedirect("connection-failed");
  const access = await findGroupAccess(user.id, connectionState.groupSlug);
  if (!access || access.role !== "admin") return clearStateAndRedirect("connection-failed");

  try {
    const oauth = createGoogleDocsOAuthClient();
    const { tokens } = await oauth.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) return clearStateAndRedirect("missing-refresh-token");

    const document = await createPrayerDocument({
      groupName: access.group.name,
      accessToken: tokens.access_token,
      sharingMode: connectionState.sharingMode,
      submissionUrl: buildAbsoluteAppUrl(`/submit/${access.group.submissionToken}`),
    });
    await saveGoogleDocConnection(access.group.id, {
      documentId: document.documentId,
      documentUrl: document.documentUrl,
      connectedByUserId: user.id,
      sharingMode: connectionState.sharingMode,
      includeAnsweredSection: connectionState.includeAnswered,
      encryptedRefreshToken: encryptSecret(tokens.refresh_token),
      lastPublicationStatus: "ready",
      lastPublishedAt: new Date().toISOString(),
      lastPublicationError: null,
    });
    await groupAuditEvents(access.group.id).add({
      eventType: "google_doc_connected",
      actorUserId: user.id,
      sharingMode: connectionState.sharingMode,
      publicationSucceeded: true,
      createdAt: FieldValue.serverTimestamp(),
    }).catch((auditError) => {
      console.error("Google Doc connection audit write failed.", {
        groupId: access.group.id,
        errorName: auditError instanceof Error ? auditError.name : "UnknownError",
      });
    });
  } catch (error) {
    console.error("Google Doc connection failed.", {
      groupId: access.group.id,
      actorUserId: user.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    await groupAuditEvents(access.group.id).add({
      eventType: "google_doc_connection_failed",
      actorUserId: user.id,
      createdAt: FieldValue.serverTimestamp(),
    }).catch(() => undefined);
    return clearStateAndRedirect("connection-failed");
  }

  return clearStateAndRedirect("connected");
}

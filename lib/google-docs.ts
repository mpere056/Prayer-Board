import { google } from "googleapis";
import { decryptSecret } from "@/lib/crypto";
import { renderPrayerDocument, type PrayerRequestForPublication } from "@/lib/google-doc-render";

export { renderPrayerDocument, type PrayerRequestForPublication } from "@/lib/google-doc-render";

export const GOOGLE_DOCS_SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive.file",
];

export type GoogleDocSharingMode = "restricted" | "anyone_with_link_viewer";

function requiredEnvironmentValue(name: "GOOGLE_DOCS_CLIENT_ID" | "GOOGLE_DOCS_CLIENT_SECRET") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function googleDocsCallbackUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  }

  return new URL("/api/google-docs/callback", siteUrl).toString();
}

export function createGoogleDocsOAuthClient() {
  return new google.auth.OAuth2(
    requiredEnvironmentValue("GOOGLE_DOCS_CLIENT_ID"),
    requiredEnvironmentValue("GOOGLE_DOCS_CLIENT_SECRET"),
    googleDocsCallbackUrl(),
  );
}

export function createGoogleDocsAuthorizationUrl(state: string) {
  return createGoogleDocsOAuthClient().generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: GOOGLE_DOCS_SCOPES,
    state,
  });
}

export async function createPrayerDocument({
  groupName,
  accessToken,
  sharingMode,
  submissionUrl,
}: {
  groupName: string;
  accessToken: string;
  sharingMode: GoogleDocSharingMode;
  submissionUrl?: string | null;
}) {
  const auth = createGoogleDocsOAuthClient();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: "v1", auth });
  const drive = google.drive({ version: "v3", auth });
  const created = await docs.documents.create({
    requestBody: { title: `${groupName} Prayer Requests` },
  });
  const documentId = created.data.documentId;

  if (!documentId) {
    throw new Error("Google did not return a document identifier.");
  }

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            endOfSegmentLocation: {},
            text: renderPrayerDocument(groupName, [], { submissionUrl }),
          },
        },
      ],
    },
  });

  if (sharingMode === "anyone_with_link_viewer") {
    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        type: "anyone",
        role: "reader",
        allowFileDiscovery: false,
      },
    });
  }

  return {
    documentId,
    documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

export async function publishPrayerDocument({
  groupName,
  documentId,
  encryptedRefreshToken,
  requests,
  submissionUrl,
}: {
  groupName: string;
  documentId: string;
  encryptedRefreshToken: string;
  requests: PrayerRequestForPublication[];
  submissionUrl?: string | null;
}) {
  const auth = createGoogleDocsOAuthClient();
  auth.setCredentials({ refresh_token: decryptSecret(encryptedRefreshToken) });
  const docs = google.docs({ version: "v1", auth });
  const document = await docs.documents.get({ documentId });
  const endIndex = document.data.body?.content?.at(-1)?.endIndex;

  if (!endIndex || endIndex < 2) {
    throw new Error("Google returned an unexpected document structure.");
  }

  const text = renderPrayerDocument(groupName, requests, { submissionUrl });
  const updateRequests = [
    ...(endIndex > 2
      ? [
        {
          deleteContentRange: {
            range: { startIndex: 1, endIndex: endIndex - 1 },
          },
        },
      ]
      : []),
    {
      insertText: {
        location: { index: 1 },
        text,
      },
    },
  ];

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: updateRequests,
    },
  });
}

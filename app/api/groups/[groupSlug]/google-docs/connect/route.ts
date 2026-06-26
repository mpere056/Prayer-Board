import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireGroupAdmin } from "@/lib/auth";
import { createGoogleDocsAuthorizationUrl, type GoogleDocSharingMode } from "@/lib/google-docs";

const sharingModes: GoogleDocSharingMode[] = ["restricted", "anyone_with_link_viewer"];

export async function GET(request: Request, { params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  await requireGroupAdmin(groupSlug);
  const requestUrl = new URL(request.url);
  const acknowledgement = requestUrl.searchParams.get("acknowledgement") === "true";
  const includeAnswered = requestUrl.searchParams.get("includeAnswered") === "true";
  const candidateSharing = requestUrl.searchParams.get("sharing") ?? "anyone_with_link_viewer";
  const sharingMode = sharingModes.includes(candidateSharing as GoogleDocSharingMode)
    ? (candidateSharing as GoogleDocSharingMode)
    : "anyone_with_link_viewer";

  if (sharingMode === "anyone_with_link_viewer" && !acknowledgement) {
    return NextResponse.redirect(new URL(`/admin/${encodeURIComponent(groupSlug)}/settings?google-doc=invalid-state`, requestUrl.origin));
  }

  const state = randomUUID();
  const response = NextResponse.redirect(createGoogleDocsAuthorizationUrl(state));
  response.cookies.set("prayer-board-google-doc-state", JSON.stringify({
    state,
    groupSlug,
    sharingMode,
    includeAnswered,
  }), {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
  });

  return response;
}

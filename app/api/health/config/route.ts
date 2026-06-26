import { NextResponse } from "next/server";

const environmentKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "GOOGLE_DOCS_CLIENT_ID",
  "GOOGLE_DOCS_CLIENT_SECRET",
  "GOOGLE_TOKEN_ENCRYPTION_KEY",
  "SUBMISSION_RATE_LIMIT_SALT",
] as const;

export function GET() {
  return NextResponse.json({
    ok: true,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? null,
    firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? null,
    firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? null,
    configured: Object.fromEntries(environmentKeys.map((key) => [key, Boolean(process.env[key])])),
  });
}

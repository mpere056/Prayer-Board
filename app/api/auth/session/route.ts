import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { firebaseAdminAuth, firebaseAdminDb } from "@/lib/firebase/admin";

const sessionDurationMs = 1000 * 60 * 60 * 24 * 5;

function errorInfo(caught: unknown) {
  if (!(caught instanceof Error)) {
    return { name: "UnknownError", message: "Unknown error", code: null };
  }

  return {
    name: caught.name,
    message: caught.message,
    code: typeof (caught as Error & { code?: unknown }).code === "string"
      ? (caught as Error & { code: string }).code
      : null,
  };
}

export async function POST(request: Request) {
  let step = "parse_request";
  try {
    const { idToken } = await request.json();
    if (typeof idToken !== "string") return NextResponse.json({ error: "Invalid sign-in request." }, { status: 400 });

    step = "verify_id_token";
    const auth = firebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const signInProvider = decodedToken.firebase.sign_in_provider;
    if (signInProvider === "password" && decodedToken.email_verified !== true) {
      return NextResponse.json({
        error: "Please verify your email address before signing in.",
        step,
        code: "auth/email-not-verified",
      }, { status: 401 });
    }

    step = "create_session_cookie";
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: sessionDurationMs });
    step = "upsert_user_profile";
    const userReference = firebaseAdminDb().doc(`users/${decodedToken.uid}`);
    const userSnapshot = await userReference.get();
    await userReference.set({
      email: decodedToken.email ?? null,
      displayName: decodedToken.name ?? null,
      emailVerified: decodedToken.email_verified ?? null,
      signInProvider,
      updatedAt: FieldValue.serverTimestamp(),
      ...(userSnapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("prayer-board-session", sessionCookie, {
      httpOnly: true,
      maxAge: sessionDurationMs / 1000,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (caught) {
    const details = errorInfo(caught);
    console.error("auth_session_failed", {
      step,
      code: details.code,
      name: details.name,
      message: details.message,
      firebaseProjectIdConfigured: Boolean(process.env.FIREBASE_PROJECT_ID),
      firebaseClientEmailConfigured: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      firebasePrivateKeyConfigured: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    });
    return NextResponse.json({
      error: "Sign-in could not be verified.",
      step,
      code: details.code,
      message: details.message,
    }, { status: 401 });
  }
}

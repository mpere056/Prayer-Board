"use client";

import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export function authErrorDetail(caught: unknown) {
  if (!(caught instanceof Error)) {
    return {
      code: null,
      name: "UnknownError",
      message: "An unknown error occurred.",
    };
  }

  return {
    code: typeof (caught as Error & { code?: unknown }).code === "string"
      ? (caught as Error & { code: string }).code
      : null,
    name: caught.name,
    message: caught.message,
  };
}

export async function createAppSession(user: User) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: await user.getIdToken(true) }),
  });

  if (!response.ok) {
    const sessionError = await response.json().catch(() => ({}));
    throw new Error(
      [
        "session_failed",
        typeof sessionError.step === "string" ? `step=${sessionError.step}` : null,
        typeof sessionError.code === "string" ? `code=${sessionError.code}` : null,
        typeof sessionError.message === "string" ? `message=${sessionError.message}` : null,
      ].filter(Boolean).join(" "),
    );
  }
}

export async function signInWithGoogleAndCreateSession() {
  const result = await signInWithPopup(firebaseAuth(), new GoogleAuthProvider());
  await createAppSession(result.user);
  return result.user;
}

export async function signInWithFacebookAndCreateSession() {
  const provider = new FacebookAuthProvider();
  const result = await signInWithPopup(firebaseAuth(), provider);
  await createAppSession(result.user);
  return result.user;
}

export async function registerWithEmail({
  displayName,
  email,
  password,
}: {
  displayName: string;
  email: string;
  password: string;
}) {
  const auth = firebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const cleanDisplayName = displayName.trim();

  if (cleanDisplayName) {
    await updateProfile(result.user, { displayName: cleanDisplayName });
  }

  await sendEmailVerification(result.user);
  await signOut(auth);
}

export async function signInWithEmailAndCreateSession(email: string, password: string) {
  const auth = firebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);

  if (!result.user.emailVerified) {
    await sendEmailVerification(result.user).catch(() => undefined);
    await signOut(auth);
    const error = new Error("email_not_verified");
    (error as Error & { code: string }).code = "auth/email-not-verified";
    throw error;
  }

  await createAppSession(result.user);
  return result.user;
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(firebaseAuth(), email);
}

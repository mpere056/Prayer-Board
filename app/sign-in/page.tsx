"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

function errorDetail(caught: unknown) {
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

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInShell />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInShell() {
  return (
    <main className="page-center">
      <section className="card form-card" aria-labelledby="sign-in-heading">
        <p className="eyebrow">Welcome</p>
        <h1 id="sign-in-heading">Sign in simply.</h1>
        <p className="muted">
          Use your Google account to view a private board, administer a group, or submit a request in your name.
        </p>
        <div className="stack">
          <button className="button" type="button" disabled>
            Loading sign-in
          </button>
          <p className="notice">Prayer Board never asks you to create or remember a password.</p>
        </div>
      </section>
    </main>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(firebaseAuth(), new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
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

      const requestedPath = searchParams.get("next");
      window.location.assign(requestedPath?.startsWith("/") ? requestedPath : "/");
    } catch (caught) {
      const details = errorDetail(caught);
      console.error("Google sign-in failed", details);
      void fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: "google_sign_in", ...details }),
      }).catch(() => undefined);
      setError(
        [
          "We could not start Google sign-in.",
          details.code ? `Code: ${details.code}.` : null,
          details.message ? `Details: ${details.message}` : null,
        ].filter(Boolean).join(" "),
      );
      setIsLoading(false);
    }
  }

  return (
    <main className="page-center">
      <section className="card form-card" aria-labelledby="sign-in-heading">
        <p className="eyebrow">Welcome</p>
        <h1 id="sign-in-heading">Sign in simply.</h1>
        <p className="muted">
          Use your Google account to view a private board, administer a group, or submit a request in your name.
        </p>
        <div className="stack">
          <button className="button" type="button" disabled={isLoading} onClick={signInWithGoogle}>
            {isLoading ? "Opening Google..." : "Continue with Google"}
          </button>
          {error ? <p className="error" role="alert">{error}</p> : null}
          <p className="notice">Prayer Board never asks you to create or remember a password.</p>
        </div>
      </section>
    </main>
  );
}

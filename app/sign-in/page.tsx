"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  authErrorDetail,
  registerWithEmail,
  sendPasswordReset,
  signInWithEmailAndCreateSession,
  signInWithGoogleAndCreateSession,
} from "@/lib/firebase/auth-client";

type EmailMode = "sign_in" | "register";

function friendlyAuthMessage(code: string | null, fallback: string) {
  if (code === "auth/email-not-verified") {
    return "Please verify your email address first. We sent another verification email if Firebase allowed it.";
  }
  if (code === "auth/email-already-in-use") return "That email already has an account. Try signing in instead.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "That email and password did not match an account.";
  }
  if (code === "auth/weak-password") return "Please choose a password with at least 6 characters.";
  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/popup-closed-by-user") return "The Google sign-in window was closed before sign-in finished.";
  return fallback;
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
          Use Google or an email account to view a private board, administer a group, or submit a request in your name.
        </p>
        <div className="stack">
          <button className="button" type="button" disabled>
            Loading sign-in
          </button>
        </div>
      </section>
    </main>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const [emailMode, setEmailMode] = useState<EmailMode>("sign_in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function completeSignIn() {
    const requestedPath = searchParams.get("next");
    window.location.assign(requestedPath?.startsWith("/") ? requestedPath : "/");
  }

  async function signInWithGoogle() {
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      await signInWithGoogleAndCreateSession();
      completeSignIn();
    } catch (caught) {
      const details = authErrorDetail(caught);
      console.error("Google sign-in failed", details);
      void fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: "google_sign_in", ...details }),
      }).catch(() => undefined);
      setError(friendlyAuthMessage(details.code, "We could not start Google sign-in. Please try again."));
      setIsLoading(false);
    }
  }

  async function submitEmailForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (emailMode === "register") {
        await registerWithEmail({ displayName, email, password });
        setPassword("");
        setMessage("Check your email to verify your account, then come back and sign in.");
      } else {
        await signInWithEmailAndCreateSession(email, password);
        completeSignIn();
        return;
      }
    } catch (caught) {
      const details = authErrorDetail(caught);
      console.error("Email sign-in failed", details);
      void fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: emailMode === "register" ? "email_registration" : "email_sign_in", ...details }),
      }).catch(() => undefined);
      setError(friendlyAuthMessage(details.code, "We could not complete email sign-in. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword() {
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError("Enter your email address first, then request a password reset.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setMessage("If that email has an account, Firebase will send password reset instructions.");
    } catch (caught) {
      const details = authErrorDetail(caught);
      console.error("Password reset failed", details);
      setError(friendlyAuthMessage(details.code, "We could not send a password reset email. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-center">
      <section className="card form-card" aria-labelledby="sign-in-heading">
        <p className="eyebrow">Welcome</p>
        <h1 id="sign-in-heading">Sign in simply.</h1>
        <p className="muted">
          Use Google, or create an email account. Prayer Board uses Firebase Auth, so passwords are not stored in the app database.
        </p>

        <div className="stack">
          <button className="button" type="button" disabled={isLoading} onClick={signInWithGoogle}>
            {isLoading ? "Working..." : "Continue with Google"}
          </button>

          <div className="auth-divider" role="presentation">
            <span>or</span>
          </div>

          <div className="auth-mode-tabs" aria-label="Email account options">
            <button
              className={emailMode === "sign_in" ? "active" : ""}
              disabled={isLoading}
              onClick={() => {
                setEmailMode("sign_in");
                setError(null);
                setMessage(null);
              }}
              type="button"
            >
              Sign in
            </button>
            <button
              className={emailMode === "register" ? "active" : ""}
              disabled={isLoading}
              onClick={() => {
                setEmailMode("register");
                setError(null);
                setMessage(null);
              }}
              type="button"
            >
              Create account
            </button>
          </div>

          <form className="email-auth-form" onSubmit={submitEmailForm}>
            {emailMode === "register" ? (
              <label>
                Name
                <input
                  autoComplete="name"
                  maxLength={120}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  value={displayName}
                />
              </label>
            ) : null}
            <label>
              Email
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              Password
              <input
                autoComplete={emailMode === "register" ? "new-password" : "current-password"}
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <button className="button" disabled={isLoading} type="submit">
              {emailMode === "register" ? "Create email account" : "Sign in with email"}
            </button>
          </form>

          {emailMode === "sign_in" ? (
            <button className="text-button" disabled={isLoading} onClick={resetPassword} type="button">
              Reset password
            </button>
          ) : (
            <p className="notice">Email accounts must be verified before they can be used for named requests or group access.</p>
          )}

          {message ? <p className="success" role="status">{message}</p> : null}
          {error ? <p className="error" role="alert">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}

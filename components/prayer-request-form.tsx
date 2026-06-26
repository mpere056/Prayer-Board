"use client";

import { FormEvent, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

type IdentityChoice = "anonymous_guest" | "named" | "anonymous_to_group";

const templates = [
  "Please pray for ___ as I face ___. I am asking for ___.",
  "I am feeling ___ about ___. Please pray for wisdom, peace, and a clear next step.",
  "Please pray for someone close to me who is experiencing ___. They need ___.",
  "I am grateful for ___. Please join me in giving thanks for ___.",
];

export function PrayerRequestForm({ submissionToken }: { submissionToken: string }) {
  const [identity, setIdentity] = useState<IdentityChoice>("anonymous_guest");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("other");
  const [duration, setDuration] = useState("unspecified");
  const [hasConsent, setHasConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function createFirebaseSession() {
    const auth = firebaseAuth();
    const user = auth.currentUser ?? (await signInWithPopup(auth, new GoogleAuthProvider())).user;
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: await user.getIdToken() }),
    });
    if (!response.ok) throw new Error("sign_in_failed");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (identity !== "anonymous_guest") await createFirebaseSession();
      const response = await fetch(`/api/submit/${encodeURIComponent(submissionToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, title, body, category, duration, hasConsent }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "submission_failed");
      setIsComplete(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error && submissionError.message === "sign_in_failed"
          ? "We could not complete Google sign-in. Please try again."
          : "We could not submit your request. Please review the form and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <section className="card form-card" aria-live="polite">
        <p className="eyebrow">Thank you</p>
        <h1>Your request was received.</h1>
        <p className="muted">A group administrator will review it before it is shared.</p>
      </section>
    );
  }

  return (
    <form className="card request-form" onSubmit={submit}>
      <p className="eyebrow">Share a request</p>
      <h1>How can we pray for you?</h1>
      <div className="notice">
        <p>
          A group administrator will review this before it is shared. Please avoid sharing another person’s private information without their permission.
        </p>
        <p>
          Approved requests may appear on this group’s private board and connected Google Doc. Read the <a href="/privacy" target="_blank">privacy notice</a>.
        </p>
      </div>

      <fieldset className="identity-options">
        <legend>How should this be shared?</legend>
        <label className="check-row">
          <input checked={identity === "anonymous_guest"} name="identity" onChange={() => setIdentity("anonymous_guest")} type="radio" />
          <span><strong>Submit anonymously</strong><br />No account is needed.</span>
        </label>
        <label className="check-row">
          <input checked={identity === "named"} name="identity" onChange={() => setIdentity("named")} type="radio" />
          <span><strong>Submit with my name</strong><br />Google sign-in confirms the name shown to the group.</span>
        </label>
        <label className="check-row">
          <input checked={identity === "anonymous_to_group"} name="identity" onChange={() => setIdentity("anonymous_to_group")} type="radio" />
          <span><strong>Sign in, appear anonymous</strong><br />Administrators can identify the submission for moderation; the group sees “Anonymous.”</span>
        </label>
      </fieldset>

      <label>
        Short title <span className="muted">(optional)</span>
        <input maxLength={120} onChange={(event) => setTitle(event.target.value)} value={title} />
      </label>
      <label>
        Prayer request
        <textarea maxLength={4000} onChange={(event) => setBody(event.target.value)} required rows={7} value={body} />
      </label>
      <div className="template-row" aria-label="Writing templates">
        {templates.map((template) => (
          <button className="template-button" key={template} onClick={() => setBody(template)} type="button">
            Use a prompt
          </button>
        ))}
      </div>
      <div className="form-grid">
        <label>
          Category
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="health">Health</option>
            <option value="family_relationships">Family and relationships</option>
            <option value="work_school">Work or school</option>
            <option value="grief">Grief</option>
            <option value="guidance">Guidance</option>
            <option value="praise">Praise</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Duration
          <select onChange={(event) => setDuration(event.target.value)} value={duration}>
            <option value="this_week">This week</option>
            <option value="this_month">This month</option>
            <option value="ongoing">Ongoing</option>
            <option value="unspecified">Unspecified</option>
          </select>
        </label>
      </div>
      <label className="check-row">
        <input checked={hasConsent} onChange={(event) => setHasConsent(event.target.checked)} required type="checkbox" />
        <span>I have permission to share the information in this request.</span>
      </label>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button className="button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sharing…" : identity === "anonymous_guest" ? "Share request" : "Sign in and share request"}
      </button>
    </form>
  );
}

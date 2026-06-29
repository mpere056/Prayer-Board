import assert from "node:assert/strict";
import test from "node:test";
import { renderPrayerDocument, type PrayerRequestForPublication } from "../lib/google-doc-render.ts";

function request(overrides: Partial<PrayerRequestForPublication>): PrayerRequestForPublication {
  return {
    title: "Prayer request",
    body: "Please pray.",
    category: null,
    displayName: null,
    submittedAt: "2026-06-01T12:00:00.000Z",
    duration: null,
    status: "approved",
    ...overrides,
  };
}

test("published doc includes privacy note, submission link, and clean metadata separators", () => {
  const document = renderPrayerDocument(
    "Actualize",
    [
      request({
        title: "Healing",
        body: "Please pray for healing.",
        category: "health",
        displayName: "Mark",
        duration: "ongoing",
      }),
      request({
        title: "Answered",
        body: "Thank you for praying.",
        status: "answered",
      }),
    ],
    { submissionUrl: "https://prayer-board-sable.vercel.app/submit/actualize-token" },
  );

  assert.match(document, /Please do not forward or copy requests outside this group without permission\./);
  assert.match(document, /Share a request with this group: https:\/\/prayer-board-sable\.vercel\.app\/submit\/actualize-token/);
  assert.match(document, /Mark - Jun 1 - ongoing/);
  assert.ok(!document.includes("Â·"));
  assert.match(document, /Answered Requests/);
});

test("published doc groups active requests by category when the list is large enough", () => {
  const document = renderPrayerDocument("AVBC", [
    request({ title: "A1", category: "health", submittedAt: "2026-06-06T12:00:00.000Z" }),
    request({ title: "A2", category: "health", submittedAt: "2026-06-05T12:00:00.000Z" }),
    request({ title: "B1", category: "family", submittedAt: "2026-06-04T12:00:00.000Z" }),
    request({ title: "B2", category: "family", submittedAt: "2026-06-03T12:00:00.000Z" }),
    request({ title: "C1", category: null, submittedAt: "2026-06-02T12:00:00.000Z" }),
    request({ title: "C2", category: null, submittedAt: "2026-06-01T12:00:00.000Z" }),
  ]);

  assert.match(document, /Active Requests/);
  assert.match(document, /\nfamily\n\n1\. \[family\] B1/);
  assert.match(document, /\nhealth\n\n1\. \[health\] A1/);
  assert.match(document, /\nOther requests\n\n1\. C1/);
});

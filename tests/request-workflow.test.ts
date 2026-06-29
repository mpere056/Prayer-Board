import assert from "node:assert/strict";
import test from "node:test";
import {
  canApproveChange,
  canSubmitChange,
  shouldRepublish,
  transitionFor,
  type PrayerRequestStatus,
} from "../lib/request-workflow.ts";

test("only valid lifecycle transitions are accepted", () => {
  assert.deepEqual(transitionFor("approve", "pending"), { nextStatus: "approved" });
  assert.deepEqual(transitionFor("mark_answered", "approved"), { nextStatus: "answered" });
  assert.deepEqual(transitionFor("archive", "answered"), { nextStatus: "archived", statusBeforeArchive: "answered" });
  assert.deepEqual(transitionFor("restore", "archived", "answered"), { nextStatus: "answered", statusBeforeArchive: null });
  assert.equal(transitionFor("approve", "approved"), null);
  assert.equal(transitionFor("mark_answered", "pending"), null);
  assert.equal(transitionFor("restore", "approved"), null);
  assert.equal(transitionFor("remove", "removed"), null);
});

test("publication follows every transition into or out of visible states", () => {
  assert.equal(shouldRepublish("pending", "approved"), true);
  assert.equal(shouldRepublish("approved", "answered"), true);
  assert.equal(shouldRepublish("answered", "archived"), true);
  assert.equal(shouldRepublish("archived", "approved"), true);
  assert.equal(shouldRepublish("pending", "rejected"), false);
});

test("submitters can only request answered status for active requests", () => {
  const statuses: PrayerRequestStatus[] = ["pending", "approved", "answered", "archived", "rejected", "removed"];
  for (const status of statuses) {
    assert.equal(canSubmitChange("mark_answered", status), status === "approved");
  }
});

test("removed and rejected requests cannot receive updates", () => {
  assert.equal(canSubmitChange("update", "removed"), false);
  assert.equal(canSubmitChange("update", "rejected"), false);
  assert.equal(canApproveChange("update", "removed"), false);
  assert.equal(canApproveChange("update", "rejected"), false);
  assert.equal(canSubmitChange("remove", "pending"), true);
  assert.equal(canApproveChange("remove", "approved"), true);
  assert.equal(canApproveChange("remove", "removed"), false);
});

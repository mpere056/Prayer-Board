import { randomUUID } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const email = process.env.INITIAL_ADMIN_EMAIL;
if (!email) throw new Error("Set INITIAL_ADMIN_EMAIL to the first administrator's Google account email.");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase Admin credentials are incomplete.");

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const db = getFirestore(app);
const administrator = await auth.getUserByEmail(email);

for (const group of [
  { name: "Actualize", slug: "actualize" },
  { name: "AVBC", slug: "avbc" },
]) {
  const existing = await db.collection("groups").where("slug", "==", group.slug).limit(1).get();
  const reference = existing.docs[0]?.ref ?? db.collection("groups").doc();
  const data = existing.docs[0]?.data();
  const submissionToken = data?.submissionToken ?? randomUUID();

  await reference.set({
    ...group,
    submissionToken,
    defaultArchiveAfterDays: data?.defaultArchiveAfterDays ?? 30,
    exemptOngoingFromArchive: data?.exemptOngoingFromArchive ?? true,
    createdAt: data?.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  const administratorReference = reference.collection("members").doc(administrator.uid);
  const existingAdministrator = await administratorReference.get();
  await administratorReference.set({
    role: "admin",
    email: administrator.email ?? null,
    displayName: administrator.displayName ?? null,
    ...(existingAdministrator.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`${group.name} submission token: ${submissionToken}`);
}

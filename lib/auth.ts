import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { firebaseAdminAuth } from "@/lib/firebase/admin";
import { findGroupBySlug, groupMemberReference, type GroupRole, type PrayerGroup } from "@/lib/firebase/firestore";

export type GroupAccess = {
  group: PrayerGroup;
  role: GroupRole;
};

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = (await cookies()).get("prayer-board-session")?.value;
  if (!session) return null;

  try {
    const token = await firebaseAdminAuth().verifySessionCookie(session, true);
    return {
      id: token.uid,
      email: token.email ?? null,
      displayName: token.name ?? null,
    };
  } catch {
    return null;
  }
}

export async function findGroupAccess(userId: string, groupSlug: string): Promise<GroupAccess | null> {
  const group = await findGroupBySlug(groupSlug);
  if (!group) return null;
  const membership = await groupMemberReference(group.id, userId).get();
  if (!membership.exists) return null;

  const role = membership.data()?.role;
  if (role !== "member" && role !== "admin") return null;
  return { group, role };
}

export async function getGroupAccess(
  groupSlug: string,
  signInReturnPath = `/board/${encodeURIComponent(groupSlug)}`,
): Promise<GroupAccess> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(signInReturnPath)}`);
  }

  const access = await findGroupAccess(user.id, groupSlug);
  if (!access) {
    redirect("/access-denied");
  }

  return access;
}

export async function requireGroupAdmin(
  groupSlug: string,
  signInReturnPath = `/admin/${encodeURIComponent(groupSlug)}`,
): Promise<GroupAccess> {
  const access = await getGroupAccess(groupSlug, signInReturnPath);

  if (access.role !== "admin") {
    redirect("/access-denied");
  }

  return access;
}

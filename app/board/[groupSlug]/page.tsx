import { PrayerBoard } from "@/components/prayer-board";
import { getCurrentUser, getGroupAccess } from "@/lib/auth";
import { listApprovedPrayerRequestsForBoard, listPrayerMarkRequestIds } from "@/lib/firebase/firestore";

export default async function BoardPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await getGroupAccess(groupSlug);
  const user = await getCurrentUser();
  const [requests, prayedFor] = await Promise.all([
    listApprovedPrayerRequestsForBoard(access.group.id),
    user ? listPrayerMarkRequestIds(access.group.id, user.id) : Promise.resolve([]),
  ]);

  return (
    <main className="board-page">
      <PrayerBoard groupSlug={groupSlug} initialRequests={requests} initiallyPrayedFor={prayedFor} />
    </main>
  );
}

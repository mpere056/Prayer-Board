import { PrayerBoard } from "@/components/prayer-board";
import { getGroupAccess } from "@/lib/auth";
import { listPrayerRequestsForBoard } from "@/lib/firebase/firestore";

export default async function AnsweredBoardPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await getGroupAccess(groupSlug);
  const requests = await listPrayerRequestsForBoard(access.group.id, ["answered"]);

  return (
    <main className="board-page">
      <PrayerBoard
        allowPrayerMarks={false}
        description="These requests have been marked answered by an administrator. They are kept here so the group can give thanks."
        emptyBody="Answered requests will appear here when an administrator marks them answered."
        emptyTitle="No answered requests yet."
        eyebrow="Private group space"
        groupSlug={groupSlug}
        initialRequests={requests}
        initiallyPrayedFor={[]}
        title="Answered prayers"
      />
    </main>
  );
}

import { PrayerBoard } from "@/components/prayer-board";
import { getGroupAccess } from "@/lib/auth";
import { listPrayerRequestsForBoard } from "@/lib/firebase/firestore";

export default async function ArchiveBoardPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await getGroupAccess(groupSlug);
  const requests = await listPrayerRequestsForBoard(access.group.id, ["archived"]);

  return (
    <main className="board-page">
      <PrayerBoard
        allowPrayerMarks={false}
        description="Archived requests are hidden from the active Google Doc, but remain visible here for the group’s private history."
        emptyBody="Archived requests will appear here after administrators move older items out of the active list."
        emptyTitle="The archive is empty."
        eyebrow="Private group archive"
        groupSlug={groupSlug}
        initialRequests={requests}
        initiallyPrayedFor={[]}
        title="Prayer archive"
      />
    </main>
  );
}

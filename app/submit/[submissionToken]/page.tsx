import { notFound } from "next/navigation";
import { PrayerRequestForm } from "@/components/prayer-request-form";
import { findGroupBySubmissionToken } from "@/lib/firebase/firestore";

export default async function SubmitPrayerRequestPage({
  params,
}: {
  params: Promise<{ submissionToken: string }>;
}) {
  const { submissionToken } = await params;
  const group = await findGroupBySubmissionToken(submissionToken);
  if (!group) notFound();

  return (
    <main className="page-center">
      <PrayerRequestForm submissionToken={submissionToken} />
    </main>
  );
}

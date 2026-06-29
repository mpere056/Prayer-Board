export type PrayerRequestForPublication = {
  title: string | null;
  body: string;
  category: string | null;
  displayName: string | null;
  submittedAt: string;
  duration: string | null;
  status: "approved" | "answered";
};

const CATEGORY_GROUPING_MIN_REQUESTS = 6;

function normalizeCategoryLabel(category: string | null) {
  const value = category?.trim();
  return value ? value : "Other requests";
}

function shouldGroupByCategory(requests: PrayerRequestForPublication[]) {
  if (requests.length < CATEGORY_GROUPING_MIN_REQUESTS) return false;

  const categories = new Set(requests.map((request) => normalizeCategoryLabel(request.category)));
  return categories.size >= 2;
}

function renderRequestEntry(request: PrayerRequestForPublication, index: number) {
  const category = request.category ? `[${request.category}] ` : "";
  const title = request.title?.trim() || "Prayer request";
  const submittedAt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(request.submittedAt),
  );
  const details = [request.displayName || "Anonymous", submittedAt, request.duration]
    .filter(Boolean)
    .join(" - ");

  return [
    `${index + 1}. ${category}${title}`,
    request.body,
    details,
    "",
  ];
}

function renderSectionRequests(sectionRequests: PrayerRequestForPublication[]) {
  if (!shouldGroupByCategory(sectionRequests)) {
    return sectionRequests.flatMap((request, index) => renderRequestEntry(request, index));
  }

  const requestsByCategory = new Map<string, PrayerRequestForPublication[]>();
  for (const request of sectionRequests) {
    const category = normalizeCategoryLabel(request.category);
    const categoryRequests = requestsByCategory.get(category) ?? [];
    categoryRequests.push(request);
    requestsByCategory.set(category, categoryRequests);
  }

  return Array.from(requestsByCategory.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([category, categoryRequests]) => ([
      category,
      "",
      ...categoryRequests.flatMap((request, index) => renderRequestEntry(request, index)),
    ]));
}

export function renderPrayerDocument(
  groupName: string,
  requests: PrayerRequestForPublication[],
  options?: { submissionUrl?: string | null },
) {
  const updatedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
  const header = [
    `${groupName} Prayer Requests`,
    "",
    "Please hold these requests in prayer. Please do not forward or copy requests outside this group without permission.",
    ...(options?.submissionUrl ? [`Share a request with this group: ${options.submissionUrl}`] : []),
    `Last updated: ${updatedAt}`,
    "",
  ];

  const activeRequests = requests.filter((request) => request.status === "approved");
  const answeredRequests = requests.filter((request) => request.status === "answered");

  if (activeRequests.length === 0 && answeredRequests.length === 0) {
    return [...header, "There are no active prayer requests at this time."].join("\n");
  }

  const sections = [
    "Active Requests",
    "",
    ...(activeRequests.length === 0 ? ["No active requests right now.", ""] : renderSectionRequests(activeRequests)),
  ];

  if (answeredRequests.length > 0) {
    sections.push("Answered Requests", "", ...renderSectionRequests(answeredRequests));
  }

  return [...header, ...sections].join("\n");
}

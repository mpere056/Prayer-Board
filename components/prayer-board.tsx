"use client";

import { useMemo, useState } from "react";
import type { BoardPrayerRequest } from "@/lib/firebase/firestore";

type SortOrder = "newest" | "oldest";

function readableValue(value: string | null) {
  return value ? value.replaceAll("_", " ") : "Other";
}

export function PrayerBoard({
  groupSlug,
  initialRequests,
  initiallyPrayedFor,
  title = "Prayer board",
  eyebrow = "Private group space",
  description = "Your prayer marks are private. Other members cannot see whether you have marked a request.",
  emptyTitle = "No active requests yet.",
  emptyBody = "Approved requests will appear here when they are ready for the group.",
  allowPrayerMarks = true,
}: {
  groupSlug: string;
  initialRequests: BoardPrayerRequest[];
  initiallyPrayedFor: string[];
  title?: string;
  eyebrow?: string;
  description?: string;
  emptyTitle?: string;
  emptyBody?: string;
  allowPrayerMarks?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [prayedFor, setPrayedFor] = useState(() => new Set(initiallyPrayedFor));
  const [changingRequestId, setChangingRequestId] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(initialRequests.map((request) => request.category).filter(Boolean))).sort() as string[],
    [initialRequests],
  );
  const visibleRequests = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return initialRequests
      .filter((request) => {
        const matchesCategory = category === "all" || request.category === category;
        const haystack = `${request.title ?? ""} ${request.body} ${request.category ?? ""}`.toLowerCase();
        return matchesCategory && (!searchText || haystack.includes(searchText));
      })
      .sort((first, second) => {
        const comparison = new Date(second.submittedAt).getTime() - new Date(first.submittedAt).getTime();
        return sortOrder === "newest" ? comparison : -comparison;
      });
  }, [category, initialRequests, search, sortOrder]);

  async function togglePrayerMark(requestId: string) {
    const previous = prayedFor.has(requestId);
    setChangingRequestId(requestId);
    setPrayedFor((current) => {
      const next = new Set(current);
      if (previous) next.delete(requestId);
      else next.add(requestId);
      return next;
    });

    try {
      const response = await fetch(`/api/groups/${encodeURIComponent(groupSlug)}/prayer-marks/${encodeURIComponent(requestId)}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("mark_failed");
    } catch {
      setPrayedFor((current) => {
        const next = new Set(current);
        if (previous) next.add(requestId);
        else next.delete(requestId);
        return next;
      });
    } finally {
      setChangingRequestId(null);
    }
  }

  return (
    <div className="board-layout">
      <section className="board-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
        <div className="board-tabs" aria-label="Prayer board views">
          <a href={`/board/${encodeURIComponent(groupSlug)}`}>Active</a>
          <a href={`/board/${encodeURIComponent(groupSlug)}/answered`}>Answered</a>
          <a href={`/board/${encodeURIComponent(groupSlug)}/archive`}>Archive</a>
        </div>
      </section>
      <section className="board-filters" aria-label="Filter prayer requests">
        <label>
          Search requests
          <input onChange={(event) => setSearch(event.target.value)} placeholder="Search by word or topic" type="search" value={search} />
        </label>
        <label>
          Category
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{readableValue(item)}</option>)}
          </select>
        </label>
        <label>
          Order
          <select onChange={(event) => setSortOrder(event.target.value as SortOrder)} value={sortOrder}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </section>
      {visibleRequests.length === 0 ? (
        <section className="card empty-card">
          <h2>{initialRequests.length === 0 ? emptyTitle : "No requests match those filters."}</h2>
          <p className="muted">{emptyBody}</p>
        </section>
      ) : (
        <section className="prayer-card-list" aria-live="polite">
          {visibleRequests.map((request) => {
            const hasPrayed = prayedFor.has(request.id);
            return (
              <article className="card prayer-card" key={request.id}>
                <div className="request-meta">
                  <span>{readableValue(request.category)}</span>
                  <span>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(request.submittedAt))}</span>
                  {request.duration && request.duration !== "unspecified" ? <span>{readableValue(request.duration)}</span> : null}
                </div>
                <h2>{request.title || "Prayer request"}</h2>
                <p className="request-body">{request.body}</p>
                <p className="muted">{request.displayName || "Anonymous"}</p>
                {allowPrayerMarks ? (
                  <button
                    aria-pressed={hasPrayed}
                    className={hasPrayed ? "button button-secondary" : "button"}
                    disabled={changingRequestId === request.id}
                    onClick={() => togglePrayerMark(request.id)}
                    type="button"
                  >
                    {hasPrayed ? "Prayer marked" : "I prayed"}
                  </button>
                ) : null}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

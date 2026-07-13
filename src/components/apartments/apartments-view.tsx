"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "./listing-card";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { RefreshButton } from "@/components/ui/refresh-button";
import { cn, formatCurrency } from "@/lib/utils";
import { apartmentOutreach, APARTMENT_SEARCHES, GEO_RULES } from "@/lib/config";
import type { ListingResult } from "@/lib/types";
import { OutreachScript } from "./outreach-script";
import { refreshApartmentsAction } from "@/app/apartments/actions";

export function ApartmentsView({ results }: { results: ListingResult[] }) {
  const [view, setView] = useState<"active" | "passed">("active");
  const [showExcluded, setShowExcluded] = useState(false);
  const [activeSearch, setActiveSearch] = useState<string>(results[0]?.searchId ?? "");

  // Listings for the selected search only, split by pass status.
  const activeResult = useMemo(
    () => results.find((r) => r.searchId === activeSearch) ?? results[0],
    [results, activeSearch]
  );
  const allListings = useMemo(() => activeResult?.listings ?? [], [activeResult]);
  const passed = useMemo(() => allListings.filter((l) => l.status === "dislike"), [allListings]);
  const activePool = useMemo(() => allListings.filter((l) => l.status !== "dislike"), [allListings]);

  // "New" = untriaged: no like, pass, or contact yet. Only surface ones that
  // pass the geo rules so the section stays actionable.
  const newListings = useMemo(
    () => allListings.filter((l) => (l.status ?? "none") === "none" && l.passesGeo),
    [allListings]
  );

  const searchLabel = activeResult?.label ?? "Listings";

  // Tailor the outreach message to the active search: bigger units imply more
  // applicants, but never fewer than three.
  const outreachText = useMemo(() => {
    const bedrooms = APARTMENT_SEARCHES.find((s) => s.id === activeResult?.searchId)?.bedroomsMin;
    return apartmentOutreach(Math.max(3, bedrooms ?? 3));
  }, [activeResult]);

  const visible = useMemo(() => {
    if (view === "passed") return passed;
    return activePool.filter((l) => showExcluded || l.passesGeo);
  }, [view, passed, activePool, showExcluded]);

  const qualifying = activePool.filter((l) => l.passesGeo);
  const filteredOut = activePool.filter((l) => !l.passesGeo).length;
  const prices = qualifying.map((l) => l.price);
  const median =
    prices.length > 0 ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {results.length > 1 ? (
          <div className="inline-flex gap-1 rounded-full nu-inset p-1">
            {results.map((r) => (
              <button
                key={r.searchId}
                type="button"
                onClick={() => {
                  setActiveSearch(r.searchId);
                  setView("active");
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium nu-pressable transition-colors",
                  r.searchId === activeSearch ? "nu-raised-sm text-foreground" : "text-muted"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <RefreshButton
          action={refreshApartmentsAction}
          label="Refresh listings"
          accent="#0a7cff"
          formatResult={(r) =>
            r.live ? `${r.new} new · ${r.upserted} synced` : "No live data"
          }
        />
      </div>

      {newListings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] nu-raised-sm text-[#0a7cff]">
              <Icon name="Sparkle" size={17} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">New listings</div>
              <div className="text-[11px] text-muted">Not yet liked, passed, or contacted</div>
            </div>
            <span className="ml-auto rounded-full nu-inset px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#0a7cff]">
              {newListings.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {newListings.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="raised">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] nu-raised-sm text-[#17a673]">
              <Icon name="BedDouble" size={17} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">{searchLabel}</div>
              <div className="text-[11px] text-muted">East Village · StreetEasy</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>
              <span className="font-semibold tabular-nums text-[#17a673]">{qualifying.length}</span> matching
            </span>
            <span className="text-muted-2">·</span>
            <span>
              <span className="font-semibold tabular-nums text-[var(--danger)]">{filteredOut}</span> filtered out
            </span>
            {median && (
              <>
                <span className="text-muted-2">·</span>
                <span>
                  median <span className="font-semibold tabular-nums text-foreground">{formatCurrency(median)}</span>
                </span>
              </>
            )}
          </div>
        </Card>

        <Card variant="raised">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] nu-raised-sm text-[#0a7cff]">
              <Icon name="MapPin" size={17} />
            </span>
            <div>
              <div className="text-sm font-semibold tracking-tight">Geo filters</div>
              <div className="text-[11px] text-muted">Hard limits on every listing</div>
            </div>
          </div>
          <div className="space-y-2">
            {GEO_RULES.notes.map((rule) => (
              <div
                key={rule}
                className="flex items-center gap-2.5 rounded-[var(--radius-sm)] nu-inset px-3 py-2.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md nu-raised-sm text-[var(--danger)]">
                  <Icon name="Ban" size={12} />
                </span>
                <span className="text-xs leading-snug text-foreground">{rule}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <OutreachScript text={outreachText} />

      {/* toggle (active view only) */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {view === "passed" ? "Passed" : "Showing"} {visible.length}{" "}
          {visible.length === 1 ? "listing" : "listings"}
          {view === "passed" ? (
            <button
              type="button"
              onClick={() => setView("active")}
              className="ml-2 text-[#0a7cff] hover:underline"
            >
              Back to active
            </button>
          ) : (
            passed.length > 0 && (
              <button
                type="button"
                onClick={() => setView("passed")}
                className="ml-2 text-[#0a7cff] hover:underline"
              >
                View passed ({passed.length})
              </button>
            )
          )}
        </p>
        {view === "active" && (
          <button
            onClick={() => setShowExcluded((s) => !s)}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium nu-pressable",
              showExcluded ? "nu-inset text-foreground" : "nu-raised-sm text-muted"
            )}
          >
            <span
              className={cn(
                "h-3.5 w-3.5 rounded-full transition-colors",
                showExcluded ? "bg-[var(--danger)]" : "nu-inset-sm"
              )}
            />
            Show excluded
          </button>
        )}
      </div>

      {/* grid */}
      {visible.length === 0 ? (
        <Card variant="inset" className="grid place-items-center py-16 text-center">
          <Icon name={view === "passed" ? "ThumbsDown" : "Search"} size={28} className="mb-3 text-muted-2" />
          <p className="text-sm font-medium">
            {view === "passed" ? "Nothing passed yet" : "No qualifying listings right now"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {view === "passed"
              ? "Listings you mark as Pass will collect here."
              : "All current results fall outside your geo rules. Toggle \u201cShow excluded\u201d to see them."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((l, i) => (
            <ListingCard key={l.id} listing={l} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { updateApartmentStatus } from "@/app/apartments/actions";
import type { ApartmentStatus, Listing } from "@/lib/types";

const STATUS_OPTIONS: {
  value: Exclude<ApartmentStatus, "none">;
  icon: string;
  label: string;
  accent: string;
}[] = [
  { value: "like", icon: "ThumbsUp", label: "Like", accent: "#17a673" },
  { value: "dislike", icon: "ThumbsDown", label: "Pass", accent: "#e5484d" },
  { value: "contact", icon: "MessageSquare", label: "In contact", accent: "#0a7cff" },
];

export function ListingCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [status, setStatus] = useState<ApartmentStatus>(listing.status ?? "none");
  const [isPending, startTransition] = useTransition();
  const excluded = !listing.passesGeo;

  function choose(next: Exclude<ApartmentStatus, "none">) {
    const value = status === next ? "none" : next;
    setStatus(value); // optimistic
    startTransition(() => {
      updateApartmentStatus(listing.id, value);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius-lg)] nu-raised p-0",
        excluded && "opacity-70",
        status === "like" && "ring-2 ring-[#17a673]/40",
        status === "contact" && "ring-2 ring-[#0a7cff]/40",
        status === "dislike" && "opacity-60"
      )}
    >
      <a
        href={listing.url}
        target="_blank"
        rel="noreferrer"
        className="block transition-transform hover:-translate-y-0.5"
      >
        <div className="relative h-40 w-full overflow-hidden">
          {listing.imageUrl && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.address}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="grid h-full w-full place-items-center nu-inset">
              <Icon name="Building2" size={30} className="text-muted-2" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {listing.isNew && <Badge tone="info">New</Badge>}
            {listing.noFee && <Badge tone="success">No fee</Badge>}
            {listing.priceDelta && listing.priceDelta < 0 && (
              <Badge tone="info">↓ {formatCurrency(Math.abs(listing.priceDelta))}</Badge>
            )}
          </div>
          {excluded && (
            <div className="absolute right-3 top-3">
              <Badge tone="danger">Excluded</Badge>
            </div>
          )}
        </div>

        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight text-foreground">
                {listing.address}
                {listing.unit ? <span className="text-muted"> · {listing.unit}</span> : null}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                <Icon name="MapPin" size={12} /> {listing.neighborhood}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-base font-semibold tracking-tight tabular-nums">
                {formatCurrency(listing.price)}
              </div>
              <div className="text-[10px] text-muted-2">/mo</div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Icon name="BedDouble" size={13} /> {listing.bedrooms} bd
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="Bath" size={13} /> {listing.bathrooms} ba
            </span>
            {listing.sqft ? <span className="tabular-nums">{listing.sqft.toLocaleString()} ft²</span> : null}
          </div>

          {excluded && listing.geoReasons.length > 0 && (
            <div className="mt-3 rounded-lg nu-inset-sm px-2.5 py-1.5 text-[11px] text-[var(--danger)]">
              {listing.geoReasons.join(" · ")}
            </div>
          )}
        </div>
      </a>

      {/* status controls */}
      <div className="mt-auto flex items-center gap-1.5 border-t border-border px-3 py-2.5">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={isPending}
              onClick={() => choose(opt.value)}
              aria-pressed={active}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-[11px] font-medium nu-pressable transition-colors disabled:opacity-60",
                active ? "nu-inset" : "nu-raised-sm text-muted hover:text-foreground"
              )}
              style={active ? { color: opt.accent } : undefined}
            >
              <Icon name={opt.icon} size={13} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FEEDBACK_KINDS,
  FEEDBACK_KIND_LABELS,
  type FeedbackKind,
} from "@/lib/feedback";
import { restaurants } from "@/data/restaurants";
import { cn } from "@/lib/utils";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("idea");
  const [message, setMessage] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  function reset() {
    setKind("idea");
    setMessage("");
    setRestaurantId("");
    setCompany("");
    setError(null);
    setDone(false);
    setPending(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          message,
          restaurantId: restaurantId || null,
          company,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not save that note. Try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not save that note. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="link"
        className="h-auto px-0 text-xs"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <MessageSquarePlus data-icon="inline-start" />
        Suggest a change
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Suggest a change</DialogTitle>
            <DialogDescription>
              Tell us a place is wrong, or what you want the picker to do next.
            </DialogDescription>
          </DialogHeader>
          {done ? (
            <p className="text-sm">Thanks. The note was saved.</p>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={submit}>
              <fieldset>
                <legend className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  What is this about?
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_KINDS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={kind === item}
                      onClick={() => setKind(item)}
                      className={cn(
                        "inline-flex h-8 items-center rounded-full border px-3 text-sm",
                        kind === item
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card",
                      )}
                    >
                      {FEEDBACK_KIND_LABELS[item]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Place, if it is about one
                </span>
                <select
                  value={restaurantId}
                  onChange={(event) => setRestaurantId(event.target.value)}
                  className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Not about a specific place</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Note
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  maxLength={1000}
                  rows={4}
                  placeholder="Hours are wrong, or I wish the wheel could…"
                  className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </label>
              <input
                tabIndex={-1}
                name="company"
                autoComplete="off"
                aria-hidden
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Sending…" : "Send note"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

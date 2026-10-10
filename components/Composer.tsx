"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, FileJson, FolderOpen, RotateCcw, Sparkles, Trash2, Upload } from "lucide-react";
import { useWorkspaceData } from "@/components/data-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MAX_IMPORT_BYTES } from "@/lib/dashboard/data";

const examples = [
  { title: "Revenue & customers", text: "Revenue trend and top customers", detail: "Growth and the customer book" },
  { title: "Accounts at risk", text: "At-risk customers and average deal size", detail: "Accounts that need attention" },
  { title: "Billing & conversion", text: "Invoice for Acme and conversion funnel", detail: "Invoice total and funnel" },
  { title: "Team operations", text: "Team roster, kanban tasks and service health", detail: "People, tasks, and services" },
];

export function Composer() {
  const { draft, setDraft, generate, startSample, loading, importData, resetDemo, saved, load, remove } = useWorkspaceData();
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const generateRef = useRef(generate);
  generateRef.current = generate;

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function onPrompt(value: string) {
    setDraft(value);
    if (timer.current) window.clearTimeout(timer.current);
    if (value.trim().length < 3) return;
    timer.current = window.setTimeout(() => {
      void generateRef.current(value);
    }, 300);
  }

  function apply(text = json) {
    try {
      importData(text);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to import data");
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void generate();
        }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="prompt">Ask</Label>
          <span className="text-[11px] text-muted-foreground">{draft.length}/600</span>
        </div>
        <Textarea
          id="prompt"
          value={draft}
          onChange={(event) => onPrompt(event.target.value)}
          maxLength={600}
          className="min-h-28 resize-y bg-background leading-6"
          placeholder="Revenue trends and top customers…"
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void generate();
            }
          }}
        />
        <Button className="w-full" type="submit" disabled={draft.trim().length < 3}>
          <Sparkles />
          {loading ? "Updating" : "Generate dashboard"}
          <ArrowUpRight className="ml-auto" />
        </Button>
        <p className="text-[11px] leading-5 text-muted-foreground">The dashboard updates as you type. Only the prompt is sent for selection. <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd></p>
      </form>

      <Separator />

      <Collapsible open={importOpen} onOpenChange={setImportOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
          <span>Bring your own data</span>
          <Badge variant="outline">{importOpen ? "Hide" : "JSON"}</Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-3">
          <p className="text-xs leading-5 text-muted-foreground">
            Up to 500 KB. Included datasets replace what is on screen. Revenue periods use YYYY-MM. Amounts are USD.
          </p>
          <a href="/example-data.json" download className="flex items-center gap-2 text-xs font-medium text-primary underline underline-offset-4">
            <FileJson className="size-4" />
            Download example JSON
          </a>
          <Label htmlFor="json-data">JSON data</Label>
          <Textarea
            id="json-data"
            value={json}
            onChange={(event) => setJson(event.target.value)}
            placeholder={'{"customers":{"rows":[…]}}'}
            className="min-h-28 bg-background font-mono text-xs"
          />
          {error && (
            <p role="alert" className="text-xs leading-5 text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => apply()} disabled={!json.trim()}>
              Apply JSON
            </Button>
            <Button size="sm" variant="outline" onClick={() => file.current?.click()}>
              <Upload />
              Choose file
            </Button>
          </div>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Upload JSON file"
            onChange={async (event) => {
              const chosen = event.target.files?.[0];
              if (!chosen) return;
              if (chosen.size > MAX_IMPORT_BYTES) {
                setError("JSON must be smaller than 500 KB");
                return;
              }
              try {
                const text = await chosen.text();
                setJson(text);
                apply(text);
              } catch {
                setError("Could not read this file.");
              }
              event.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              resetDemo();
              setJson("");
              setError("");
            }}
          >
            <RotateCcw />
            Restore demo data
          </Button>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      <section aria-label="Example prompts" className="space-y-2">
        <p className="eyebrow">Samples</p>
        <div className="space-y-1">
          {examples.map((example) => (
            <HoverCard key={example.title}>
              <HoverCardTrigger asChild>
                <button type="button" className="example-button" onClick={() => startSample(example.text)}>
                  <span className="flex items-center justify-between gap-2 text-sm font-medium">
                    {example.title}
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{example.detail}</span>
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 text-sm">
                <p className="font-medium">{example.title}</p>
                <p className="mt-1 text-muted-foreground">{example.detail}. Opens fictional sample numbers in the canvas.</p>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </section>

      <Separator />

      <section aria-label="Saved dashboards" className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Saved on this device</p>
          <Badge variant="secondary">{saved.length}/10</Badge>
        </div>
        {!saved.length ? (
          <p className="text-xs leading-5 text-muted-foreground">Save a view from the canvas. It stays in this browser, with its data and filters.</p>
        ) : (
          <ul className="space-y-1">
            {saved.map((item) => (
              <li key={item.id} className="flex items-center gap-1 rounded-lg border bg-background">
                <button aria-label={item.name} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left" onClick={() => load(item.id)}>
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {new Date(item.savedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </span>
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${item.name}`}><Trash2 /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                      <AlertDialogDescription>This removes the saved view from this browser. The file on disk is unchanged.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(item.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

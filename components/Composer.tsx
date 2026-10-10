"use client";

import { useRef, useState } from "react";
import { FileJson, FolderOpen, Play, Trash2, Upload } from "lucide-react";
import { useWorkspaceData } from "@/components/data-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { importFromCsv } from "@/lib/dashboard/csv-import";
import { MAX_IMPORT_BYTES } from "@/lib/dashboard/data";
import { toast } from "sonner";

const SAMPLE_QUESTIONS = [
  "Show revenue growth and top customers",
  "Which customers are at risk?",
  "Show invoices and monthly revenue",
];

export function Composer() {
  const { draft, setDraft, generate, loading, raw, importData, loadSample, clearDashboard, saved, load, remove } = useWorkspaceData();
  const jsonInput = useRef<HTMLTextAreaElement>(null);
  const [hasJson, setHasJson] = useState(false);
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const excelFile = useRef<File | null>(null);
  const [sheetDialog, setSheetDialog] = useState(false);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheetMode, setSheetMode] = useState<"all" | "one" | "selected">("all");
  const [sheetOne, setSheetOne] = useState("");
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [sampleLoading, setSampleLoading] = useState(false);
  function replaceJson(text: string) {
    if (jsonInput.current) jsonInput.current.value = text;
    setHasJson(text.trim().length > 0);
  }
  function apply(text = jsonInput.current?.value ?? "") {
    try {
      importData(text);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to import data");
    }
  }

  async function uploadSpreadsheet(chosen: File, sheet?: string | string[]) {
    const body = new FormData();
    body.append("file", chosen);
    if (Array.isArray(sheet)) body.append("sheets", JSON.stringify(sheet));
    else if (sheet) body.append("sheet", sheet);
    const response = await fetch("/api/import/spreadsheet", { method: "POST", body });
    const payload = await response.json() as { data?: unknown; error?: string; needsChoice?: boolean; sheets?: string[] };
    if (!response.ok) throw new Error(payload.error || "Could not read this spreadsheet.");
    if (payload.needsChoice && payload.sheets?.length) {
      excelFile.current = chosen;
      setSheetNames(payload.sheets);
      setSheetOne(payload.sheets[0]);
      setSelectedSheets(payload.sheets.slice(0, 1));
      setSheetMode("all");
      setSheetDialog(true);
      return;
    }
    if (!payload.data) throw new Error(payload.error || "Could not read this spreadsheet.");
    const text = JSON.stringify(payload.data);
    replaceJson(text);
    apply(text);
  }

  async function trySample(question?: string) {
    setSampleLoading(true);
    try { await loadSample(question); }
    catch (caught) { toast.error(caught instanceof Error ? caught.message : "Could not load sample data."); }
    finally { setSampleLoading(false); }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
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
          onChange={(event) => setDraft(event.target.value)}
          maxLength={600}
          className="min-h-32 resize-y rounded-xl bg-background leading-6 shadow-none"
          placeholder="Describe the dashboard you want after you import data…"
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void generate();
            }
          }}
        />
        <Button className="w-full" type="submit" disabled={draft.trim().length < 3 || loading}>
          {loading ? "Updating" : "Generate dashboard"}
        </Button>
        <p className="text-[11px] leading-5 text-muted-foreground">Views generate only when you click the button or press <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd>. Only the prompt is sent for selection.</p>
      </form>

      <Separator />

      {(raw.origin === "empty" || raw.origin === "demo") && <section aria-label="Try sample data" className="space-y-3 rounded-xl border bg-muted/30 p-3">
        <div><p className="text-sm font-medium">Try it with sample data</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Load an example workspace in one click. It will not use Jev until you generate a dashboard.</p></div>
        <Button className="w-full" variant="outline" disabled={sampleLoading} onClick={() => void trySample()}><Play/>{sampleLoading ? "Loading sample…" : "Load sample data"}</Button>
        <div><p className="mb-2 text-xs font-medium">Try a question</p><div className="flex flex-col gap-1.5">{SAMPLE_QUESTIONS.map(question => <button key={question} type="button" className="rounded-md border bg-background px-3 py-2 text-left text-xs hover:bg-muted" onClick={() => raw.origin === "empty" ? void trySample(question) : setDraft(question)}>{question}</button>)}</div></div>
      </section>}

      <Collapsible open={importOpen} onOpenChange={setImportOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
          <span>Bring your own data</span>
          <Badge variant="outline" className="shrink-0">{importOpen ? "Hide" : "4 file types"}</Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-3">
          <p className="text-xs leading-5 text-muted-foreground">
            JSON or SQLite for the full workspace. CSV and Excel keep whatever column headers you upload (no fixed schema). Known layouts still power revenue and customer widgets when headers match. Multi-tab Excel can import one, selected, or all sheets. Up to 500 KB.
          </p>
          <a href="/example-data.json" download className="flex items-center gap-2 text-xs font-medium text-primary underline underline-offset-4">
            <FileJson className="size-4" />
            Download example JSON
          </a>
          <Label htmlFor="json-data">JSON data</Label>
          <Textarea
            id="json-data"
            ref={jsonInput}
            defaultValue=""
            onChange={(event) => setHasJson(event.target.value.trim().length > 0)}
            placeholder={'{"customers":{"rows":[…]}}'}
            className="min-h-28 bg-background font-mono text-xs"
          />
          {error && (
            <p role="alert" className="text-xs leading-5 text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => apply()} disabled={!hasJson}>
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
            accept=".json,application/json,.sqlite,.db,.sqlite3,.csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            aria-label="Upload JSON, SQLite, CSV, or Excel file"
            onChange={async (event) => {
              const chosen = event.target.files?.[0];
              if (!chosen) return;
              if (chosen.size > MAX_IMPORT_BYTES) {
                setError("File must be smaller than 500 KB");
                return;
              }
              try {
                const name = chosen.name.toLowerCase();
                if (name.endsWith(".sqlite") || name.endsWith(".db") || name.endsWith(".sqlite3")) {
                  const body = new FormData();
                  body.append("file", chosen);
                  const response = await fetch("/api/import/sqlite", { method: "POST", body });
                  const payload = await response.json() as { data?: unknown; error?: string };
                  if (!response.ok || !payload.data) throw new Error(payload.error || "Could not read this database.");
                  const text = JSON.stringify(payload.data);
                  replaceJson(text);
                  apply(text);
                } else if (name.endsWith(".csv")) {
                  const text = JSON.stringify(importFromCsv(await chosen.text()));
                  replaceJson(text);
                  apply(text);
                } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
                  await uploadSpreadsheet(chosen);
                } else {
                  const text = await chosen.text();
                  replaceJson(text);
                  apply(text);
                }
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not read this file.");
              }
              event.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                clearDashboard();
                replaceJson("");
                setError("");
              }}
            >
              <Trash2 />
              Clear dashboard
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={sheetDialog} onOpenChange={setSheetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Excel worksheets</DialogTitle>
            <DialogDescription>
              Every tab with data is stored with its own columns. Tabs that match Glance revenue or customer headers also feed those curated metrics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="sheet-mode" checked={sheetMode === "all"} onChange={() => setSheetMode("all")} />
              All sheets ({sheetNames.length} tabs)
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="sheet-mode" checked={sheetMode === "one"} onChange={() => setSheetMode("one")} />
              One sheet
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="sheet-mode" checked={sheetMode === "selected"} onChange={() => setSheetMode("selected")} />
              Selected sheets
            </label>
            {sheetMode === "one" && (
              <div>
                <Label htmlFor="excel-sheet">Worksheet</Label>
                <select id="excel-sheet" className="control-input mt-1" value={sheetOne} onChange={(event) => setSheetOne(event.target.value)}>
                  {sheetNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}
            {sheetMode === "selected" && <fieldset className="max-h-48 space-y-2 overflow-auto rounded-md border p-3"><legend className="px-1 text-xs font-medium">Choose worksheets</legend>{sheetNames.map(name=><label key={name} className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={selectedSheets.includes(name)} onChange={event=>setSelectedSheets(current=>event.target.checked?[...current,name]:current.filter(item=>item!==name))}/>{name}</label>)}</fieldset>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSheetDialog(false); excelFile.current = null; }}>Cancel</Button>
            <Button
              disabled={sheetMode === "selected" && selectedSheets.length === 0}
              onClick={() => {
                const pending = excelFile.current;
                if (!pending) return;
                void uploadSpreadsheet(pending, sheetMode === "all" ? "all" : sheetMode === "one" ? sheetOne : selectedSheets)
                  .then(() => {
                    setSheetDialog(false);
                    excelFile.current = null;
                  })
                  .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not read this spreadsheet."));
              }}
            >
              Import {sheetMode === "all" ? "all sheets" : sheetMode === "one" ? "one sheet" : "selected sheets"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Separator />

      <section aria-label="Data and privacy" className="space-y-2 rounded-xl border p-3 text-xs leading-5 text-muted-foreground">
        <p className="text-sm font-medium text-foreground">Your data and this demo</p>
        <p>Imported records and saved views are stored in this browser. Saved views do not follow you to another device.</p>
        <p>Jev receives your question and a source label to select views; Glance calculates the numbers. Uploaded rows are not sent to Jev.</p>
        <p>Excel and SQLite files briefly reach the server for conversion, then return to your browser. Glance does not save those files on the server.</p>
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

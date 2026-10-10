"use client";
import Link from "next/link";
import { Composer } from "@/components/Composer";
import { InspectorStrip } from "@/components/InspectorStrip";
import { LiveDashboard } from "@/components/LiveDashboard";
import { useWorkspaceData } from "@/components/data-provider";
export function AppFrame(){
  const {loading,raw}=useWorkspaceData();
  return <div className="min-h-screen bg-background">
    <a href="#dashboard" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:p-3">Skip to dashboard</a>
    <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="border-b bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:border-sidebar-border">
        <div className="flex h-14 shrink-0 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Glance home">
            <img src="/glance-mark.svg" alt="" width={32} height={32} className="size-8" />
            <span className="text-sm font-semibold tracking-tight">Glance</span>
          </Link>
        </div>
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto"><Composer/></div>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b bg-background px-5 md:px-8">
          <p className="text-sm text-muted-foreground">A question becomes a dashboard</p>
          <span className="status-pill"><span className={`size-1.5 rounded-full ${loading?"animate-pulse bg-amber-500":"bg-emerald-600"}`}/>{loading?"Selecting views":raw.origin==="empty"?"No data loaded":raw.origin==="demo"?"Sample workspace":"Your imported data"}</span>
        </header>
        <main id="dashboard" tabIndex={-1} className="min-w-0 p-5 outline-none md:p-8 lg:p-9"><LiveDashboard/><InspectorStrip/></main>
        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">Glance · Numbers appear only after you import data or open a sample · USD</footer>
      </div>
    </div>
  </div>;
}

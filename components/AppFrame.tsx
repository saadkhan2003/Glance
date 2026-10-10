"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Composer } from "@/components/Composer";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { InspectorStrip } from "@/components/InspectorStrip";
import { LiveDashboard } from "@/components/LiveDashboard";
import { useWorkspaceData } from "@/components/data-provider";

export function AppFrame(){
  const {loading,raw}=useWorkspaceData();
  const [open,setOpen]=useState(true);
  useEffect(()=>{ if (localStorage.getItem("glance.sidebar")==="closed") setOpen(false); },[]);
  function toggle(){ setOpen((value)=>{ const next=!value; localStorage.setItem("glance.sidebar", next?"open":"closed"); return next; }); }
  const workspaceLabel=raw.origin==="empty"?"Empty workspace":"Your data";
  const statusLabel=loading?"Selecting views":raw.origin==="empty"?"No data loaded":"Your imported data";
  return <div className={open?"app-shell":"app-shell is-collapsed"}>
    <a href="#dashboard" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:p-3">Skip to dashboard</a>
    <aside className="side">
      <div className={`side-brand ${open?"justify-between":"justify-center"}`}>
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Glance home">
          <img src="/glance-mark.svg" alt="" width={32} height={32} className="size-8 shrink-0" />
          {open&&<span className="min-w-0"><span className="block text-sm font-semibold tracking-tight">Glance</span><span className="block text-[11px] text-muted-foreground">Analytics workspace</span></span>}
        </Link>
        {open&&<Tooltip><TooltipTrigger asChild><button type="button" aria-label="Collapse sidebar" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" onClick={toggle}><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button></TooltipTrigger><TooltipContent>Collapse sidebar</TooltipContent></Tooltip>}
      </div>
      {open?<div className="side-scroll"><Composer/></div>:<div className="side-rail">
        <button type="button" aria-label="Expand sidebar" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" onClick={toggle}><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>}
    </aside>
    <div className="stage min-w-0">
      <header className="stage-bar">
        <div className="flex flex-wrap items-center gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Glance</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{workspaceLabel}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Menubar className="h-8 border-0 bg-transparent p-0 shadow-none">
            <MenubarMenu>
              <MenubarTrigger className="text-xs">File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={() => document.getElementById("prompt")?.focus()}>Focus the prompt</MenubarItem>
                <MenubarItem onSelect={() => document.getElementById("dashboard")?.scrollIntoView()}>Jump to the canvas</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
        <div className="flex flex-wrap items-center gap-2"><FeedbackDialog/><span className="status-pill"><span className={`size-1.5 rounded-full ${loading?"animate-pulse bg-amber-500":"bg-emerald-600"}`}/>{statusLabel}</span></div>
      </header>
      <main id="dashboard" tabIndex={-1} className="stage-main outline-none"><LiveDashboard/><InspectorStrip/></main>
      <footer className="stage-foot">Glance · Import your data to see numbers · USD</footer>
    </div>
  </div>;
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Composer } from "@/components/Composer";
import { InspectorStrip } from "@/components/InspectorStrip";
import { LiveDashboard } from "@/components/LiveDashboard";
import { useWorkspaceData } from "@/components/data-provider";

export function AppFrame(){
  const {loading,raw,startSample}=useWorkspaceData();
  const [open,setOpen]=useState(true);
  useEffect(()=>{ if (localStorage.getItem("glance.sidebar")==="closed") setOpen(false); },[]);
  function toggle(){ setOpen((value)=>{ const next=!value; localStorage.setItem("glance.sidebar", next?"open":"closed"); return next; }); }
  return <div className="min-h-screen bg-background">
    <a href="#dashboard" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:p-3">Skip to dashboard</a>
    <div className={open?"lg:grid lg:grid-cols-[300px_minmax(0,1fr)]":"lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)]"}>
      <aside className="border-b bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:border-sidebar-border">
        <div className={`flex h-14 shrink-0 items-center border-b ${open?"justify-between px-4":"justify-center px-2"}`}>
          <Link href="/" className="flex items-center gap-3" aria-label="Glance home">
            <img src="/glance-mark.svg" alt="" width={32} height={32} className="size-8" />
            {open&&<span className="text-sm font-semibold tracking-tight">Glance</span>}
          </Link>
          {open&&<Tooltip><TooltipTrigger asChild><button type="button" aria-label="Collapse sidebar" className="rounded-md p-2 text-muted-foreground hover:bg-muted" onClick={toggle}><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button></TooltipTrigger><TooltipContent>Collapse sidebar</TooltipContent></Tooltip>}
        </div>
        {open?<div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto"><Composer/></div>:<button type="button" aria-label="Expand sidebar" className="mx-auto mt-3 rounded-md p-2 text-muted-foreground hover:bg-muted" onClick={toggle}><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b bg-background px-5 md:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>Glance</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>{raw.origin==="empty"?"Empty workspace":raw.origin==="demo"?"Sample":"Import"}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Menubar className="h-8 border-0 bg-transparent p-0 shadow-none">
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onSelect={() => document.getElementById("prompt")?.focus()}>Focus the prompt</MenubarItem>
                  <MenubarItem onSelect={() => document.getElementById("dashboard")?.scrollIntoView()}>Jump to the canvas</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Samples</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-64 gap-1 p-2">
                      {[
                        ["Revenue sample", "Revenue trend and top customers"],
                        ["Risk sample", "At-risk customers and average deal size"],
                        ["Billing sample", "Invoice for Acme and conversion funnel"],
                        ["Team sample", "Team roster, kanban tasks and service health"],
                      ].map(([title, text]) => (
                        <li key={title}><button type="button" className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => startSample(text)}>{title}</button></li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <span className="status-pill"><span className={`size-1.5 rounded-full ${loading?"animate-pulse bg-amber-500":"bg-emerald-600"}`}/>{loading?"Selecting views":raw.origin==="empty"?"No data loaded":raw.origin==="demo"?"Sample workspace":"Your imported data"}</span>
        </header>
        <main id="dashboard" tabIndex={-1} className="min-w-0 p-5 outline-none md:p-8 lg:p-9"><LiveDashboard/><InspectorStrip/></main>
        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">Glance · Numbers appear only after you import data or open a sample · USD</footer>
      </div>
    </div>
  </div>;
}

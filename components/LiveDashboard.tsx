"use client";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Plus, Save, X, Database, Sparkles, LayoutGrid } from "lucide-react";
import { useWorkspaceData } from "@/components/data-provider";
import { WidgetView } from "@/components/widgets/WidgetView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { availableData, EMPTY_FILTERS, importable, tableFilterKey } from "@/lib/dashboard/data";
import { candidatesFor, CURATED_WIDGETS, type DashboardPlan, type PlanRequest } from "@/lib/dashboard/planner";
import { dashboardCsv, downloadFile } from "@/lib/dashboard/export";
import { componentSnippet } from "@/lib/dashboard/snippet";
import { readModel } from "@/lib/widgets/model";
import { toast } from "sonner";

export function LiveDashboard(){
  const {snapshot,raw,prompt,selection,loading,source,filters,setFilters,setPlan,save}=useWorkspaceData();
  const [showSave,setShowSave]=useState(false),[name,setName]=useState("");
  const candidates=candidatesFor({prompt,source,available:availableData(raw) as PlanRequest["available"]});
  const remaining=candidates.filter(w=>!selection.widgets.includes(w.id));
  const regions=[...new Set(raw.customers.rows.map(row=>row.region))].sort();
  const statuses=[...new Set(raw.customers.rows.map(row=>row.status))].sort();
  const hasFilterControls=raw.revenue.labels.length>0 || regions.length>0 || raw.tables.items.some(table=>table.rows.length>0);
  const hasFilters=filters.from!=="" || filters.to!=="" || filters.region!=="all" || filters.status!=="all" || Object.values(filters.table??{}).some(Boolean);
  const changeWidgets=(widgets:string[])=>setPlan({layout:selection.layout,widgets});
  function move(index:number,step:number){const ids=[...selection.widgets];[ids[index],ids[index+step]]=[ids[index+step],ids[index]];changeWidgets(ids);}
  const updated=raw.updatedAt?new Date(raw.updatedAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):"Today";
  const [dragging,setDragging]=useState<string|null>(null);
  const gridRef=useRef<HTMLDivElement>(null);
  const hoverTarget=useRef<string|null>(null);
  function dropOn(target:string,from:string){
    if(!from||from===target) return;
    const ids=[...selection.widgets];
    const start=ids.indexOf(from),end=ids.indexOf(target);
    if(start<0||end<0) return;
    const before=new Map([...gridRef.current?.querySelectorAll<HTMLElement>("[data-widget]")??[]].map(node=>[node.dataset.widget,node.getBoundingClientRect()]));
    ids.splice(start,1);ids.splice(end,0,from);changeWidgets(ids);
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(()=>{
      for(const node of gridRef.current?.querySelectorAll<HTMLElement>("[data-widget]")??[]){
        if(reduce||node.dataset.widget===from) continue;
        const prev=before.get(node.dataset.widget);
        if(!prev) continue;
        const next=node.getBoundingClientRect();
        const dx=prev.left-next.left,dy=prev.top-next.top;
        if(Math.abs(dx)<1&&Math.abs(dy)<1) continue;
        node.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"translate(0,0)"}],{duration:220,easing:"cubic-bezier(.2,.8,.2,1)"});
      }
    });
  }
  if(raw.origin==="empty") return <div className="empty-stage"><img src="/empty-dashboard.svg" alt="" width={96} height={72} className="mb-5"/><p className="eyebrow">Workspace</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Your dashboard starts empty</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Nothing is loaded yet. Import JSON, SQLite, CSV, or Excel from the sidebar, then describe what you want to see.</p></div>;
  return <div>
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><div className="mb-3 flex items-center gap-2"><span className="eyebrow">The big picture</span><span className="rounded-sm border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Imported data</span></div><h2 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">{prompt || "Your data is ready"}</h2><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Database className="size-3.5"/>Browser import · {updated} · USD</p></div>
    <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>setShowSave(!showSave)} aria-expanded={showSave}><Save/>Save view</Button><Button size="sm" variant="outline" disabled={!selection.widgets.length} onClick={()=>{downloadFile("jev-dashboard.csv",dashboardCsv(snapshot,selection.widgets),"text/csv;charset=utf-8");toast.success("CSV exported using the current filters");}}><Download/>Export CSV</Button></div></div>
    {showSave&&<form className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4" onSubmit={e=>{e.preventDefault();save(name);}}><div className="min-w-0 flex-1"><label htmlFor="save-name" className="mb-2 block text-xs font-medium">Dashboard name</label><Input id="save-name" maxLength={60} required value={name} onChange={e=>setName(e.target.value)} placeholder="My revenue dashboard"/></div><Button type="submit">Save dashboard</Button><p className="w-full text-xs text-muted-foreground">Saved in this browser, including imported data, filters and widget order. Up to 10 views.</p></form>}
    <div className="command-bar mb-5">
      <Drawer>
        <DrawerTrigger asChild><Button variant="ghost" size="sm">Component library</Button></DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>shadcn pieces in this view</DrawerTitle>
            <DrawerDescription>Buttons, cards, tables, charts, badges, dialogs, menus, and drawers. Copy a card to take its current numbers into your own app.</DrawerDescription>
          </DrawerHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-6 text-sm sm:grid-cols-3">
            {["Button","Card","Table","Chart","Badge","Dialog","Drawer","Menubar","Navigation menu","Tooltip","Alert","Kbd"].map((name)=><div key={name} className="rounded-md border px-3 py-2">{name}</div>)}
          </div>
        </DrawerContent>
      </Drawer>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">More</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={()=>downloadFile("jev-data.json",JSON.stringify(importable(raw),null,2),"application/json")}>Download source JSON</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <label htmlFor="layout" className="sr-only">Layout</label><LayoutGrid className="ml-auto hidden size-4 text-muted-foreground sm:block"/><select id="layout" className="control-select" value={selection.layout} onChange={e=>setPlan({widgets:selection.widgets,layout:e.target.value as DashboardPlan["layout"]})}><option value="overview">Overview</option><option value="balanced">Balanced grid</option><option value="wide">Full width</option></select>
    </div>
    {hasFilterControls&&<section aria-label="Dashboard filters" className="mb-5 rounded-xl border bg-muted/30 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-medium">Live filters</h3><p className="text-xs text-muted-foreground">Showing fields in your imported data. Results update as you change them.</p></div>{hasFilters&&<Button size="sm" variant="ghost" onClick={()=>setFilters(EMPTY_FILTERS)}>Clear filters</Button>}</div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {raw.revenue.labels.length>0&&<><div><label htmlFor="from" className="filter-label">Revenue from</label><input id="from" type="month" className="control-input" value={filters.from} min={raw.revenue.labels[0]} max={filters.to||raw.revenue.labels.at(-1)} onChange={e=>setFilters({...filters,from:e.target.value})}/></div><div><label htmlFor="to" className="filter-label">Revenue through</label><input id="to" type="month" className="control-input" value={filters.to} min={filters.from||raw.revenue.labels[0]} max={raw.revenue.labels.at(-1)} onChange={e=>setFilters({...filters,to:e.target.value})}/></div></>}
      {regions.length>0&&<div><label htmlFor="region" className="filter-label">Customer region</label><select id="region" className="control-input" value={filters.region} onChange={e=>setFilters({...filters,region:e.target.value})}><option value="all">All regions</option>{regions.map(region=><option key={region} value={region}>{region}</option>)}</select></div>}
      {statuses.length>0&&<div><label htmlFor="status" className="filter-label">Customer status</label><select id="status" className="control-input" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value as typeof filters.status})}><option value="all">All statuses</option>{statuses.map(status=><option key={status} value={status}>{status}</option>)}</select></div>}
      {raw.tables.items.filter(table=>table.rows.length>0).flatMap(table=>table.columns.map(column=>{const key=tableFilterKey(table.id,column);return <div key={key}><label htmlFor={`table-filter-${key}`} className="filter-label">{table.title} · {column}</label><input id={`table-filter-${key}`} type="search" className="control-input" maxLength={200} value={filters.table?.[key]??""} onChange={e=>setFilters({...filters,table:{...filters.table,[key]:e.target.value}})} placeholder={`Search ${column}`} /></div>;}))}
    </div><p className="mt-3 text-xs text-muted-foreground">{raw.revenue.labels.length>0&&`${snapshot.revenue.labels.length} revenue periods · `}{regions.length>0&&`${snapshot.customers.rows.length} customers · `}{raw.tables.items.filter(table=>table.rows.length>0).map(table=>`${table.title}: ${snapshot.tables.items.find(item=>item.id===table.id)?.rows.length??0} rows`).join(" · ")}</p>{filters.from&&filters.to&&filters.from>filters.to&&<p role="alert" className="text-xs text-destructive">The start period must be before the end period.</p>}</section>}
    {/last year|year.over.year|\byoy\b/i.test(prompt)&&<Alert variant="warning" className="mb-4"><AlertTitle>Year-over-year is not in this demo</AlertTitle><AlertDescription>Showing the available monthly data instead.</AlertDescription></Alert>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><p role="status" className="flex items-center gap-2">{loading?<Skeleton className="size-3.5 rounded-full"/>:<Sparkles className="size-3.5"/>}{loading?"Jev is selecting views. Your local dashboard is ready.":selection.message}</p><span>Drag a card to reorder · {selection.widgets.length} views</span></div>
    {!selection.widgets.length?<div className="rounded-xl border border-dashed p-12 text-center"><Database className="mx-auto mb-4 size-8 text-muted-foreground"/><h3 className="font-medium">{prompt?"No matching views":"Ready to generate"}</h3><p className="mt-2 text-sm text-muted-foreground">{prompt?"Try another question or import a dataset with the fields you want to explore.":"Describe what you want to see, then click Generate dashboard. No model request runs while you type or import."}</p></div>:<div ref={gridRef} className={`dashboard-grid ${selection.layout}`} aria-busy={loading}>
      {selection.widgets.map((id,index)=>{const spec=CURATED_WIDGETS.find(w=>w.id===id);if(!spec)return null;const wide=["line","table","kanban","invoice"].includes(spec.kind);return <section key={id} data-widget={id} aria-label={spec.label} draggable onDragStart={e=>{if((e.target as HTMLElement).closest("button")){e.preventDefault();return;}e.dataTransfer.setData("text/plain",id);e.dataTransfer.effectAllowed="move";hoverTarget.current=id;setDragging(id);}} onDragEnd={()=>{hoverTarget.current=null;setDragging(null);}} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";if(dragging&&dragging!==id&&hoverTarget.current!==id){hoverTarget.current=id;dropOn(id,dragging);}}} onDrop={e=>{e.preventDefault();hoverTarget.current=null;setDragging(null);}} className={`widget-frame min-w-0 ${wide?"widget-wide":""} ${dragging===id?"is-dragging":""}`}>
        <div className="widget-controls" onMouseDown={e=>e.stopPropagation()}><span className="drag-grip" aria-hidden="true"><svg viewBox="0 0 12 12" width="12" height="12"><circle cx="4" cy="3" r="1" fill="currentColor"/><circle cx="8" cy="3" r="1" fill="currentColor"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="8" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="9" r="1" fill="currentColor"/><circle cx="8" cy="9" r="1" fill="currentColor"/></svg></span><button aria-label={`Copy ${spec.label} code`} onClick={async()=>{try{await navigator.clipboard.writeText(componentSnippet(spec, readModel(snapshot, spec)));toast.success("Component code copied");}catch{toast.error("Could not copy the component code.");}}}><svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><rect x="6" y="6" width="8" height="8" rx="1.5" fill="none" stroke="currentColor"/><path d="M4 10H3.5A1.5 1.5 0 0 1 2 8.5v-5A1.5 1.5 0 0 1 3.5 2h5A1.5 1.5 0 0 1 10 3.5V4" fill="none" stroke="currentColor"/></svg></button><button aria-label={`Move ${spec.label} earlier`} disabled={index===0} onClick={()=>move(index,-1)}><ArrowUp/></button><button aria-label={`Move ${spec.label} later`} disabled={index===selection.widgets.length-1} onClick={()=>move(index,1)}><ArrowDown/></button><button aria-label={`Remove ${spec.label}`} disabled={selection.widgets.length===1} onClick={()=>changeWidgets(selection.widgets.filter(w=>w!==id))}><X/></button></div>
        <WidgetView spec={spec} prompt={prompt}/>
      </section>;})}
    </div>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Plus className="size-4 text-muted-foreground"/><label htmlFor="add-widget" className="sr-only">Add a widget</label><select id="add-widget" className="control-select max-w-full" value="" disabled={!remaining.length||selection.widgets.length>=8} onChange={e=>{if(e.target.value)changeWidgets([...selection.widgets,e.target.value]);}}><option value="">{selection.widgets.length>=8?"Maximum 8 views":"Add a view…"}</option>{remaining.map(w=><option key={w.id} value={w.id}>{w.label}</option>)}</select></div><Button size="sm" variant="ghost" onClick={()=>downloadFile("jev-data.json",JSON.stringify(importable(raw),null,2),"application/json")}><Download/>Download source JSON</Button></div>
  </div>;
}

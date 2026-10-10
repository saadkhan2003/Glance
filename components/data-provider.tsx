"use client";
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { availableData, demoSnapshot, emptySnapshot, EMPTY_FILTERS, filterSnapshot, filtersSchema, importable, parseImport, type Filters } from "@/lib/dashboard/data";
import { localPlan, planSchema, validatePlan, type Selection, type DashboardPlan, type PlanRequest } from "@/lib/dashboard/planner";
import { SOURCE_IDS, type SourceId, type WorkspaceSnapshot } from "@/lib/sources/types";

const INITIAL_PROMPT="Revenue trend and top customers";
const STORAGE_KEY="jev.saved.v1";
const savedSchema=z.object({id:z.string(),name:z.string().min(1).max(60),savedAt:z.string(),prompt:z.string().min(3).max(600),source:z.enum(SOURCE_IDS),filters:filtersSchema,selection:planSchema,data:z.string().max(500000),origin:z.enum(["demo","import"])});
type SavedDashboard=z.infer<typeof savedSchema>;
type WorkspaceContext={
  snapshot:WorkspaceSnapshot; raw:WorkspaceSnapshot; source:SourceId; setSource:(s:SourceId)=>void;
  prompt:string; draft:string; setDraft:(s:string)=>void; loading:boolean; selection:Selection;
  generate:(text?:string,source?:SourceId,data?:WorkspaceSnapshot)=>Promise<void>;
  startSample:(text:string)=>void;
  filters:Filters; setFilters:(f:Filters)=>void; importData:(text:string)=>void; resetDemo:()=>void; clearDashboard:()=>void;
  setPlan:(plan:DashboardPlan)=>void; saved:SavedDashboard[]; save:(name:string)=>void; load:(id:string)=>void; remove:(id:string)=>void;
};
const Context=createContext<WorkspaceContext|null>(null);
export function DataProvider({children}:{children:ReactNode}) {
  const [raw,setRaw]=useState(emptySnapshot);
  const [source,setSourceValue]=useState<SourceId>("workspace");
  const [prompt,setPrompt]=useState(""),[draft,setDraft]=useState("");
  const [filters,setFilters]=useState<Filters>(EMPTY_FILTERS);
  const [selection,setSelection]=useState<Selection>({layout:"overview",widgets:[],mode:"local",message:"Import your data, or open a sample."});
  const [loading,setLoading]=useState(false),[saved,setSaved]=useState<SavedDashboard[]>([]);
  const request=useRef<AbortController|null>(null);
  useEffect(()=>{
    try { const value=localStorage.getItem(STORAGE_KEY); if(value) setSaved(z.array(savedSchema).max(10).parse(JSON.parse(value))); }
    catch {toast.error("Saved dashboards could not be read. You can still use the demo.");}
    return ()=>request.current?.abort();
  },[]);
  function stopRequest(){request.current?.abort();request.current=null;setLoading(false);}
  async function generate(text=draft,nextSource=source,data=raw,options?:{scroll?:boolean}) {
    const trimmed=text.trim();
    if(trimmed.length<3 || text.length>600) {toast.error("Use a prompt between 3 and 600 characters.");return;}
    if(!availableData(data).length) {data=demoSnapshot();setRaw(data);}
    stopRequest();
    const input:PlanRequest={prompt:trimmed,source:nextSource,available:availableData(data) as PlanRequest["available"]};
    setPrompt(input.prompt);setDraft(text);setSourceValue(nextSource);
    if (options?.scroll && window.innerWidth < 1024) requestAnimationFrame(() => document.getElementById("dashboard")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    const local=localPlan(input);setSelection(local);
    if(!local.widgets.length) return;
    const controller=new AbortController();request.current=controller;setLoading(true);
    const timeout=setTimeout(()=>controller.abort(),10000);
    try {
      const response=await fetch("/api/dashboard",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),signal:controller.signal});
      if(!response.ok) throw new Error("Selection unavailable");
      const result=await response.json();
      const plan=validatePlan(result,input);
      if(request.current!==controller) return;
      setSelection({...plan,mode:result.mode==="ai"?"ai":"local",message:typeof result.message==="string"?result.message:local.message,ms:result.ms});
    } catch {
      if(request.current===controller) setSelection({...local,message:"AI connection unavailable · local selection is ready"});
    } finally {clearTimeout(timeout);if(request.current===controller){setLoading(false);request.current=null;}}
  }
  function setSource(next:SourceId){void generate(prompt,next);}
  function importData(text:string){
    const next=parseImport(text);
    if(!availableData(next).length) throw new Error("Import at least one nonempty dataset.");
    stopRequest();setRaw(next);setFilters(EMPTY_FILTERS);setSourceValue("workspace");
    setSelection({...localPlan({prompt,source:"workspace",available:availableData(next) as PlanRequest["available"]}),message:"Imported data · generate to ask Jev for a new selection"});
    toast.success("Data imported. Your data stays in this browser.");
  }
  function startSample(text:string){const next=demoSnapshot();setRaw(next);setFilters(EMPTY_FILTERS);void generate(text,"workspace",next,{scroll:true});}
  function resetDemo(){startSample(INITIAL_PROMPT);toast.success("Sample data loaded");}
  function clearDashboard(){stopRequest();setRaw(emptySnapshot());setPrompt("");setDraft("");setFilters(EMPTY_FILTERS);setSourceValue("workspace");setSelection({layout:"overview",widgets:[],mode:"local",message:"Import your data, or open a sample."});toast.success("Dashboard cleared");}
  function persist(next:SavedDashboard[]){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));setSaved(next);return true;}
    catch{toast.error("Browser storage is full or unavailable. Export your data instead.");return false;}
  }
  function save(name:string){
    if(!name.trim()) {toast.error("Give your dashboard a name.");return;}
    if(!selection.widgets.length){toast.error("Add a widget before saving.");return;}
    if(saved.length>=10){toast.error("You can save 10 dashboards. Delete one to make room.");return;}
    const item:SavedDashboard={id:crypto.randomUUID(),name:name.trim().slice(0,60),savedAt:new Date().toISOString(),prompt,source,filters,selection:{layout:selection.layout,widgets:selection.widgets},data:JSON.stringify(importable(raw)),origin:raw.origin==="demo"?"demo":"import"};
    if(persist([item,...saved])) toast.success("Dashboard saved on this device");
  }
  function load(id:string){
    const item=saved.find(s=>s.id===id);if(!item)return;
    try {
      const next=parseImport(item.data);next.origin=item.origin;
      const plan=validatePlan(item.selection,{prompt:item.prompt,source:item.source,available:availableData(next) as PlanRequest["available"]});
      stopRequest();setRaw(next);setPrompt(item.prompt);setDraft(item.prompt);setSourceValue(item.source);setFilters(item.filters);setSelection({...plan,mode:"local",message:"Saved dashboard restored · no AI request"});toast.success(`Opened ${item.name}`);
    }catch{toast.error("This saved dashboard is incompatible. Import its data again.");}
  }
  function setPlan(plan:DashboardPlan){stopRequest();setSelection({...plan,mode:"local",message:"Your custom selection"});}
  return <Context.Provider value={{raw,snapshot:filterSnapshot(raw,filters),source,setSource,prompt,draft,setDraft,loading,selection,generate,startSample,filters,setFilters,importData,resetDemo,clearDashboard,setPlan,saved,save,load,remove:(id)=>{if(persist(saved.filter(s=>s.id!==id)))toast.success("Saved dashboard deleted");}}}>{children}</Context.Provider>;
}
export function useWorkspaceData(){const context=useContext(Context);if(!context)throw new Error("DataProvider is required");return context;}

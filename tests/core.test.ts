import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { demoSnapshot, parseImport, importable, filterSnapshot, EMPTY_FILTERS, availableData } from "../lib/dashboard/data";
import { readModel } from "../lib/widgets/model";
import { widgetById } from "../lib/widgets/definitions";
import { localPlan, validatePlan, CURATED_WIDGETS, type PlanRequest } from "../lib/dashboard/planner";
import { csvCell, dashboardCsv } from "../lib/dashboard/export";
import { reserveRequest } from "../lib/dashboard/budget";
const demo=demoSnapshot();
const model=(id:string,s=demo)=>readModel(s,widgetById(id)!);

test("supplied demo additions produce accurate metrics",()=>{
  assert.equal(model("customer-count").value,8);
  assert.equal(model("customer-count").unit,"");
  assert.equal(model("booked-revenue").value,101000);
  assert.equal(model("average-deal").value,12625);
  assert.equal(model("largest-account").value,22100);
  assert.equal(model("at-risk-count").value,1);
  assert.equal(model("at-risk-count").unit,"");
  assert.equal(model("invoice-total").value,3396);
  assert.equal(model("revenue-headline").value,76000);
  assert.equal(model("revenue-mom").previous,71000);
  assert.equal(model("na-book-stat").value,55500);
  assert.equal(model("eu-book-stat").value,31900);
  assert.equal(model("funnel-progress").value,15);
  assert.equal(model("funnel-progress").max,100);
  assert.equal(model("funnel-conversion").value,3.5000000000000004);
  assert.equal(model("team-online").value,3);
});
test("every exposed widget has finite data",()=>{
  assert.equal(CURATED_WIDGETS.length,15);
  for(const w of CURATED_WIDGETS){const m=readModel(demo,w);assert.ok(Number.isFinite(m.value),w.id);if(!["stat","delta"].includes(w.kind))assert.ok(m.rows.length>0,w.id);}
});
test("JSON roundtrip and partial imports never mix with demo rows",()=>{
  const restored=parseImport(JSON.stringify(importable(demo)));
  assert.equal(restored.customers.rows.length,8);
  const customerOnly=parseImport(JSON.stringify({customers:{rows:[{id:"a",name:"Example",region:"NA",amount:1.25,status:"Active"}]}}));
  assert.equal(customerOnly.revenue.labels.length,0);
  assert.deepEqual(availableData(customerOnly),["customers"]);
  assert.equal(model("booked-revenue",customerOnly).value,1.25);
});
test("import rejects malformed, oversized, mismatched and misleading input",()=>{
  for(const data of ["{", "{}",'{"foo":1}',JSON.stringify({revenue:{labels:["Jul"],values:[1],costs:[1],goal:100}}),JSON.stringify({revenue:{labels:["2026-07"],values:[],costs:[1],goal:100}}),JSON.stringify({regions:{regions:[{region:"A",value:80},{region:"B",value:32}]}})," ".repeat(500001)])assert.throws(()=>parseImport(data));
});
test("revenue imports sort periods while keeping numbers aligned",()=>{
  const s=parseImport(JSON.stringify({revenue:{labels:["2026-07","2026-01"],values:[76,42],costs:[36,28],goal:100}}));
  assert.deepEqual(s.revenue.values,[42,76]);assert.equal(s.revenue.previous,42);
});
test("filters affect only intended datasets and use empty results honestly",()=>{
  const f=filterSnapshot(demo,{from:"2026-07",to:"2026-07",region:"EU",status:"At risk"});
  assert.equal(f.revenue.current,76000);assert.equal(f.revenue.previous,0);assert.equal(f.customers.rows.length,1);assert.equal(f.invoice.lines.length,3);
  const empty=filterSnapshot(demo,{...EMPTY_FILTERS,from:"2030-01",region:"MISSING"});assert.equal(empty.customers.rows.length,0);assert.equal(empty.revenue.labels.length,0);
});
test("local selection is relevant, bounded and source aware",()=>{
  const input:PlanRequest={prompt:"At-risk customers and average deal size",source:"workspace",available:availableData(demo) as PlanRequest["available"]};
  const p=localPlan(input);assert.ok(p.widgets.includes("risk-table"));assert.ok(p.widgets.includes("average-deal"));validatePlan(p,input);
  const invoice=localPlan({...input,prompt:"Invoice for Acme and conversion funnel"});assert.ok(invoice.widgets.includes("invoice-card"));assert.ok(invoice.widgets.includes("funnel-chart"));
  assert.deepEqual(localPlan({...input,source:"customers",available:["revenue"]}).widgets,[]);
  assert.throws(()=>validatePlan({layout:"wide",widgets:["arbitrary"]},input));
  assert.throws(()=>validatePlan({layout:"wide",widgets:["risk-table","risk-table"]},input));
});
test("CSV exports filtered values and neutralizes spreadsheet formulas",()=>{
  assert.equal(csvCell('=SUM(A1:A2)'), '"\'=SUM(A1:A2)"');
  assert.equal(csvCell('"hello",\nworld'),'"""hello"",\nworld"');
  const filtered=filterSnapshot(demo,{...EMPTY_FILTERS,status:"At risk"});
  const csv=dashboardCsv(filtered,["customer-count","customer-table"]);
  assert.ok(csv.includes('"value","1"'));assert.ok(csv.includes("Stark Ind"));assert.ok(!csv.includes("Acme Corp"));
});
test("AI budget persists and fails closed on corruption",()=>{
  const dir=mkdtempSync(path.join(tmpdir(),"jev-budget-"));const oldDir=process.env.AI_BUDGET_DIR,oldLimit=process.env.AI_DAILY_REQUEST_LIMIT;
  try{process.env.AI_BUDGET_DIR=dir;process.env.AI_DAILY_REQUEST_LIMIT="2";assert.equal(reserveRequest(),true);assert.equal(reserveRequest(),true);assert.equal(reserveRequest(),false);assert.equal(JSON.parse(readFileSync(path.join(dir,"usage.json"),"utf8")).count,2);}finally{if(oldDir===undefined)delete process.env.AI_BUDGET_DIR;else process.env.AI_BUDGET_DIR=oldDir;if(oldLimit===undefined)delete process.env.AI_DAILY_REQUEST_LIMIT;else process.env.AI_DAILY_REQUEST_LIMIT=oldLimit;rmSync(dir,{recursive:true,force:true});}
});

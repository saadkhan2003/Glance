import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { demoSnapshot, parseImport, importable, filterSnapshot, EMPTY_FILTERS, availableData, isCustomerMirrorTable } from "../lib/dashboard/data";
import { importFromSqlite } from "../lib/dashboard/sqlite-import";
import { importFromCsv } from "../lib/dashboard/csv-import";
import { importFromXlsx } from "../lib/dashboard/xlsx-import";
import * as XLSX from "xlsx";
import { DatabaseSync } from "node:sqlite";
import { readModel } from "../lib/widgets/model";
import { widgetById } from "../lib/widgets/definitions";
import { localPlan, validatePlan, CURATED_WIDGETS, type PlanRequest } from "../lib/dashboard/planner";
import { csvCell, dashboardCsv } from "../lib/dashboard/export";
import { reserveD1Request, reserveRequest } from "../lib/dashboard/budget";
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
  assert.equal(CURATED_WIDGETS.length,28);
  for(const w of CURATED_WIDGETS){const m=readModel(demo,w);assert.ok(Number.isFinite(m.value),w.id);if(w.id.startsWith("import-"))continue;if(!["stat","delta","tabs"].includes(w.kind))assert.ok(m.rows.length>0,w.id);}
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
test("SQLite and CSV imports keep the booked total, average deal and invoice",()=>{
  const dir=mkdtempSync(path.join(tmpdir(),"glance-sqlite-"));
  const file=path.join(dir,"sample.sqlite");
  const db=new DatabaseSync(file);
  db.exec(`CREATE TABLE monthly_revenue (month TEXT, revenue INTEGER, costs INTEGER);
    CREATE TABLE customers (id TEXT, name TEXT, region TEXT, amount INTEGER, status TEXT);
    CREATE TABLE invoice_lines (number TEXT, client TEXT, due TEXT, item TEXT, qty INTEGER, price INTEGER);
    CREATE TABLE goal (goal INTEGER);
    INSERT INTO goal (goal) VALUES (100000);
    INSERT INTO monthly_revenue (month, revenue, costs) VALUES ('2026-06',71000,35000),('2026-07',76000,36000);
    INSERT INTO customers (id, name, region, amount, status) VALUES
      ('5','Stark Ind','EU',22100,'At risk'),('6','Wayne Ent','NA',18400,'Active'),('4','Umbrella','NA',15600,'Active'),
      ('1','Acme Corp','NA',12400,'Active'),('2','Globex','EU',9800,'Active'),('8','Soylent','NA',9100,'Active'),
      ('3','Initech','APAC',7200,'Pending'),('7','Hooli','APAC',6400,'Pending');
    INSERT INTO invoice_lines (number, client, due, item, qty, price) VALUES
      ('INV-2048','Acme Corp','2026-10-15','Platform license',1,2400),
      ('INV-2048','Acme Corp','2026-10-15','Support',1,600),
      ('INV-2048','Acme Corp','2026-10-15','Extra seats',4,99);`);
  db.close();
  const snap=parseImport(JSON.stringify(importFromSqlite(readFileSync(file))));
  assert.equal(model("booked-revenue",snap).value,101000);
  assert.equal(model("average-deal",snap).value,12625);
  assert.equal(model("invoice-total",snap).value,3396);
  rmSync(dir,{recursive:true,force:true});
  const csv=parseImport(JSON.stringify(importFromCsv("id,name,region,amount,status\n1,Acme Corp,NA,12400,Active\n")));
  assert.equal(model("booked-revenue",csv).value,12400);
  assert.equal(isCustomerMirrorTable(csv.tables.items[0],csv.customers.rows),true);
  assert.equal(filterSnapshot(csv,{...EMPTY_FILTERS,region:"EU"}).tables.items[0].rows.length,0);
  const arbitrary=importFromCsv("name,amount\nAcme,1\n");
  const dyn=parseImport(JSON.stringify(arbitrary));
  assert.equal(dyn.tables.items[0].columns[0],"name");
  assert.equal(dyn.customers.rows.length,0);
  const sheet=XLSX.utils.aoa_to_sheet([["month","revenue","costs"],["2026-07",76000,36000]]);
  const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,"Data");
  const bytes=new Uint8Array(XLSX.write(book,{type:"array",bookType:"xlsx"}));
  const single=importFromXlsx(bytes);
  assert.ok("data" in single);
  const xlsx=parseImport(JSON.stringify(single.data));
  assert.equal(xlsx.revenue.current,76000);
  const customers=XLSX.utils.aoa_to_sheet([["id","name","region","amount","status"],["1","Acme Corp","NA",12400,"Active"]]);
  const revenue=XLSX.utils.aoa_to_sheet([["month","revenue","costs"],["2026-07",76000,36000]]);
  const multi=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(multi,customers,"Customers");
  XLSX.utils.book_append_sheet(multi,revenue,"Revenue");
  const multiBytes=new Uint8Array(XLSX.write(multi,{type:"array",bookType:"xlsx"}));
  assert.deepEqual(importFromXlsx(multiBytes).sheets,["Customers","Revenue"]);
  const merged=importFromXlsx(multiBytes,"all");
  assert.ok("data" in merged);
  const both=parseImport(JSON.stringify(merged.data));
  assert.equal(both.customers.rows.length,1);
  assert.equal(both.revenue.current,76000);
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

test("shared AI budget atomically enforces minute and UTC day limits",async()=>{
  const db=new DatabaseSync(":memory:");
  try {
    db.exec(readFileSync(path.join(process.cwd(),"migrations/0001_ai_budget.sql"),"utf8"));
    const adapter={prepare:(sql:string)=>({bind:(...values:number[])=>({run:async()=>{
      const result=db.prepare(sql).run(...values);
      return {success:true,meta:{changes:Number(result.changes)}};
    }})})};
    const start=Date.UTC(2026,9,10,12,0,0);
    assert.equal(await reserveD1Request(adapter,start,2,3),true);
    assert.equal(await reserveD1Request(adapter,start+1000,2,3),true);
    assert.equal(await reserveD1Request(adapter,start+2000,2,3),false);
    assert.equal(await reserveD1Request(adapter,start+60_000,2,3),true);
    assert.equal(await reserveD1Request(adapter,start+120_000,2,3),false);
    assert.equal(await reserveD1Request(adapter,start+86_400_000,2,3),true);
    assert.equal(await reserveD1Request(adapter,start+86_400_001,0,3),false);
    const counts=db.prepare("SELECT day_count, minute_count FROM ai_budget WHERE id = 1").get() as {day_count:number;minute_count:number};
    assert.equal(counts.day_count,1);
    assert.equal(counts.minute_count,1);
  } finally { db.close(); }
});

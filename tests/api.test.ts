import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../app/api/dashboard/route";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const input={prompt:"Revenue trend",source:"revenue",available:["revenue"]};
const req=(body:unknown,origin="http://localhost:3100")=>new NextRequest("http://localhost:3100/api/dashboard",{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify(body)});
test("API validates input, origin and size before model access",async()=>{
  assert.equal((await POST(req({prompt:"x"}))).status,400);
  assert.equal((await POST(req(input,"https://evil.example"))).status,403);
  assert.equal((await POST(req({prompt:"x".repeat(5000)}))).status,413);
});
test("standalone internal hostname accepts the actual browser host",async()=>{
  const old=process.env.AI_ENABLED;delete process.env.AI_ENABLED;
  try {
    const request=new NextRequest("http://localhost:3100/api/dashboard",{method:"POST",headers:{host:"127.0.0.1:3100",origin:"http://127.0.0.1:3100","Content-Type":"application/json"},body:JSON.stringify(input)});
    assert.equal((await POST(request)).status,200);
  }finally{if(old!==undefined)process.env.AI_ENABLED=old;}
});
test("API returns usable local selection without credentials",async()=>{
  const old=process.env.AI_ENABLED;delete process.env.AI_ENABLED;
  try{const res=await POST(req(input));const json=await res.json();assert.equal(res.status,200);assert.equal(json.mode,"local");assert.ok(json.widgets.includes("revenue-line"));}finally{if(old!==undefined)process.env.AI_ENABLED=old;}
});
test("provider outage and malformed answers fall back; valid answers remain bounded",async()=>{
  const dir=mkdtempSync(path.join(tmpdir(),"jev-api-"));const env={...process.env};const fetch=global.fetch;
  process.env.AI_ENABLED="true";process.env.OPENROUTER_API_KEY="test-placeholder";process.env.AI_BUDGET_DIR=dir;
  try {
    global.fetch=async()=>new Response("outage",{status:503});
    assert.equal((await (await POST(req(input))).json()).mode,"local");
    global.fetch=async()=>Response.json({answers:{layout:{type:"choice",choice:"unknown",confidence:1}}});
    assert.equal((await (await POST(req(input))).json()).mode,"local");
    global.fetch=async(_url,options)=>{const sent=JSON.parse(String(options?.body));assert.deepEqual(Object.keys(sent.state.app),["prompt","source"]);return Response.json({answers:{layout:{type:"choice",choice:"overview",confidence:1},"revenue-line":{type:"score",score:3,confidence:1}}});};
    const result=await (await POST(req(input))).json();assert.equal(result.mode,"ai");assert.deepEqual(result.widgets,["revenue-line"]);
  }finally{global.fetch=fetch;for(const k of ["AI_ENABLED","OPENROUTER_API_KEY","AI_BUDGET_DIR"]){if(env[k]===undefined)delete process.env[k];else process.env[k]=env[k];}rmSync(dir,{recursive:true,force:true});}
});

"use client";
import { useWorkspaceData } from "@/components/data-provider";
import { widgetById } from "@/lib/widgets/definitions";
export function InspectorStrip(){const {selection}=useWorkspaceData();return <details className="mt-8 border-t pt-4 text-xs text-muted-foreground"><summary className="cursor-pointer">How this view was selected</summary><div className="mt-3 space-y-2 leading-5"><p>{selection.message}{selection.ms!==undefined?` · ${selection.ms} ms`:""}</p><p>Numbers are calculated from your data. AI only selects the presentation. Revenue filters affect monthly metrics; region and status filters affect customers.</p><ul className="list-inside list-disc">{selection.widgets.map(id=><li key={id}>{widgetById(id)?.label}: {widgetById(id)?.when}</li>)}</ul></div></details>;}

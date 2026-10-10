"use client";

import type { FC } from "react";

import { WidgetView } from "@/components/widgets/WidgetView";
import { WIDGETS, type WidgetSpec } from "@/lib/widgets/definitions";

function bind(spec: WidgetSpec) {
  function DataWidget({ prompt }: { prompt: string }) {
    return <WidgetView spec={spec} prompt={prompt} />;
  }
  DataWidget.displayName = spec.id;
  return DataWidget;
}

/** One React component per data widget. Jev chooses among these ids. */
export const DATA_COMPONENTS: Record<string, FC<{ prompt: string }>> = Object.fromEntries(
  WIDGETS.map((spec) => [spec.id, bind(spec)]),
);

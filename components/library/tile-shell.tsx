import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TileShell({
  title,
  subtitle,
  isSample,
  children,
  className,
  footer,
}: {
  title: string;
  subtitle?: string;
  isSample?: boolean;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <Card className={cn("h-full rounded-2xl border-border/80 shadow-[0_1px_2px_oklch(0.2_0.02_180/0.05),0_18px_40px_-30px_oklch(0.28_0.04_180/0.55)]", className)}>
      <CardHeader className="space-y-1 p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {subtitle ? (
              <CardDescription>{subtitle}</CardDescription>
            ) : null}
          </div>
          {isSample ? (
            <Badge variant="secondary" className="shrink-0 uppercase">
              Sample
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">{children}</CardContent>
      {footer}
    </Card>
  );
}

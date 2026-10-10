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
    <Card className={cn("h-full shadow-none", className)}>
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

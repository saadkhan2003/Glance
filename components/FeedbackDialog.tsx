"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FEEDBACK_ENDPOINT = "https://formsubmit.co/msaad.official6@gmail.com";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [pilot, setPilot] = useState(false);

  function show(requestPilot: boolean) {
    setPilot(requestPilot);
    setOpen(true);
  }

  return <>
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => show(false)}><MessageSquare/>Give feedback</Button>
      <Button size="sm" onClick={() => show(true)}>Request a pilot</Button>
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pilot ? "Request a Glance pilot" : "Tell us about your report"}</DialogTitle>
          <DialogDescription>Help shape Glance with a real reporting task. Do not include private customer records.</DialogDescription>
        </DialogHeader>
        <form action={FEEDBACK_ENDPOINT} method="POST" className="space-y-4">
          <input type="hidden" name="_subject" value={pilot ? "Glance pilot request" : "Glance product feedback"}/>
          <input type="hidden" name="_template" value="table"/>
          <input type="hidden" name="product" value="Glance"/>
          <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
          <div className="space-y-1.5"><Label htmlFor="feedback-report">What report do you make today?</Label><Textarea id="feedback-report" name="report" required maxLength={1000} className="min-h-24" placeholder="For example, a weekly client revenue report from Excel"/></div>
          <div className="space-y-1.5"><Label htmlFor="feedback-result">Did Glance handle your data?</Label><select id="feedback-result" name="result" required defaultValue="" className="control-input"><option value="" disabled>Choose one</option><option value="Not tried yet">I have not tried it yet</option><option value="Yes">Yes</option><option value="Partly">Partly</option><option value="No">No</option></select></div>
          <div className="space-y-1.5"><Label htmlFor="feedback-notes">What worked or got in your way?</Label><Textarea id="feedback-notes" name="notes" maxLength={1000} placeholder="Optional details"/></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pilot" value="Yes" checked={pilot} onChange={event => setPilot(event.target.checked)}/>I would like to join a pilot</label>
          <div className="space-y-1.5"><Label htmlFor="feedback-email">Your email {pilot ? "(required for the pilot)" : "(optional)"}</Label><Input id="feedback-email" name="email" type="email" required={pilot} maxLength={254} autoComplete="email" placeholder="you@example.com"/></div>
          <p className="text-xs leading-5 text-muted-foreground">Only these answers are sent through FormSubmit to msaad.official6@gmail.com. Your uploaded files and dashboard data are not attached.</p>
          <Button type="submit" className="w-full"><Send/>Send {pilot ? "pilot request" : "feedback"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}

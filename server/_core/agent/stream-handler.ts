import type { Response } from "express";
import type { StreamEvent } from "@shared/stream";

export function writeStreamEvent(res: Response, event: StreamEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

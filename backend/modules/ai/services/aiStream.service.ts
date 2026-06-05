import type { Response } from 'express';
import type { AiStreamEventName } from '../types/ai.types.js';

const serializeEvent = (event: AiStreamEventName, data: unknown) => {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
};

export const initializeSse = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
};

export const writeSseEvent = (res: Response, event: AiStreamEventName, data: unknown) => {
  if (res.writableEnded || res.destroyed) return;
  res.write(serializeEvent(event, data));
};

export const closeSse = (res: Response) => {
  if (!res.writableEnded) {
    res.end();
  }
};


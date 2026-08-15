// internal-imports
import { router as chatRouter } from './chat/route.js';

// external-imports
import express from 'express';

// function to create application
export function createApp() {
  // create express application
  return express()
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use('/api/v1/chat', chatRouter);
}

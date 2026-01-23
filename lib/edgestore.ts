import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';
import { initEdgeStoreClient } from '@edgestore/server/core';

const es = initEdgeStore.create();

/** Maximum file size in bytes (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * This is the main router for the Edge Store buckets.
 */
const edgeStoreRouter = es.router({
  publicFiles: es.fileBucket({
    accept: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: MAX_FILE_SIZE,
  }),
});

export const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

/**
 * Backend client for server-side EdgeStore operations.
 * Initialized lazily to avoid issues during build time without env vars.
 */
let backendClient: ReturnType<typeof initEdgeStoreClient<typeof edgeStoreRouter>> | null = null;

export function getEdgeStoreBackendClient() {
  if (!backendClient) {
    backendClient = initEdgeStoreClient({
      router: edgeStoreRouter,
    });
  }
  return backendClient;
}

/**
 * This type is used to create the type-safe client for the frontend.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter;

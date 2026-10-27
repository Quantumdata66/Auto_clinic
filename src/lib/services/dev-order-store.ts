import type { Order } from "@/types";

export interface IdempotencyEntry {
  order: Order;
  timestamp: number;
}

// In-Memory Idempotency & Order Cache for development & immediate deduplication
export const IDEMPOTENCY_STORE = new Map<string, IdempotencyEntry>();
export const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

// In-Memory Dev Order Store (for mock/dev execution when live Supabase is not connected)
export const DEV_ORDERS_STORE = new Map<string, Order>();

// In-Memory Dev Inventory Lock Store (tracks live reservations across requests in dev mode)
export const DEV_INVENTORY_RESERVATIONS = new Map<string, number>();

// Concurrency mutex lock for simulated transactional execution
let devTransactionLock = Promise.resolve();

/**
 * Acquires a simulated transactional lock for dev mode sequential execution.
 */
export function acquireDevTransactionLock(): {
  prevLock: Promise<void>;
  releaseMutex: () => void;
} {
  let releaseMutex: () => void;
  const nextLock = new Promise<void>((resolve) => {
    releaseMutex = resolve;
  });
  const prevLock = devTransactionLock;
  devTransactionLock = nextLock;
  return { prevLock, releaseMutex: releaseMutex! };
}

/**
 * Returns current in-memory reserved inventory quantity for a product (dev mode/testing helper).
 * Note: Placed in this service module (outside "use server") so test helpers are not exposed
 * as public Server Action endpoints.
 */
export function getDevInventoryReservation(productId: string): number {
  return DEV_INVENTORY_RESERVATIONS.get(productId) || 0;
}

/**
 * Clears in-memory dev reservations and order stores for test isolation.
 */
export function resetDevInventoryStore(): void {
  DEV_INVENTORY_RESERVATIONS.clear();
  DEV_ORDERS_STORE.clear();
  IDEMPOTENCY_STORE.clear();
}

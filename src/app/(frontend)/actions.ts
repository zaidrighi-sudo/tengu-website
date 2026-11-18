'use server'

// Deprecated shim kept for compatibility. The storefront server actions moved
// to their feature backends — import from there instead:
//   placeOrder / getMyOrders  -> @/features/orders/backend
//   sendMessage               -> @/features/messages/backend
//   subscribe                 -> @/features/subscribers/backend

import {
  placeOrder as placeOrderOnServer,
  getMyOrders as getMyOrdersOnServer,
  type PlaceOrderInput,
  type PlaceOrderResult,
  type ServerOrder,
} from "@/features/orders/backend"
import {
  sendMessage as sendMessageOnServer,
  type SendMessageInput,
} from "@/features/messages/backend"
import { subscribe as subscribeOnServer } from "@/features/subscribers/backend"
import type { ActionFailure } from "@/shared/storefront-actions"

export type { PlaceOrderInput, PlaceOrderResult, ServerOrder, SendMessageInput, ActionFailure }

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  return placeOrderOnServer(input)
}

export async function getMyOrders(): Promise<{ ok: true; orders: ServerOrder[] } | { ok: false; error: string }> {
  return getMyOrdersOnServer()
}

export async function sendMessage(input: SendMessageInput): Promise<{ ok: true } | ActionFailure> {
  return sendMessageOnServer(input)
}

export async function subscribe(input: { email: string; language: string }): Promise<{ ok: true } | ActionFailure> {
  return subscribeOnServer(input)
}

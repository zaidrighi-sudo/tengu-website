// Shared internals for the storefront server actions (placeOrder, sendMessage,
// subscribe). Plain module — no "use server" — only the action modules export
// async functions; this one holds helpers, types and form field id mapping.

type FieldErrors = Record<string, string>
export type ActionFailure = { ok: false; error: string; fieldErrors: FieldErrors }

/** Map field paths to the storefront's form field ids. */
const FIELD_IDS: Record<string, string> = {
  'customer.firstName': 'ship-firstName',
  'customer.lastName': 'ship-lastName',
  'customer.phone': 'ship-phone',
  'address.wilaya': 'ship-region',
  'address.commune': 'ship-city',
  'address.street': 'ship-address1',
  email: 'contact-email',
  name: 'contact-name',
  topic: 'contact-topic',
  orderNumber: 'contact-order',
  message: 'contact-message',
}

export const text = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '')

export function failure(error: unknown, fallback: string): ActionFailure {
  const issues: { path?: string; message?: string }[] =
    (error as { data?: { errors?: { path?: string; message?: string }[] } })?.data?.errors ?? []
  const fieldErrors: FieldErrors = {}
  for (const issue of issues) {
    if (!issue.message) continue
    const id = issue.path ? (FIELD_IDS[issue.path] ?? issue.path) : 'form'
    fieldErrors[id] ??= issue.message
  }
  const first = Object.values(fieldErrors)[0]
  return { ok: false, error: first ?? fallback, fieldErrors }
}

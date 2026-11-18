import mongoose, { Schema } from 'mongoose'

/**
 * In long-running dev processes, `mongoose.models.X` may hold a model compiled
 * before a schema was extended. Strict updates then silently drop the new
 * paths — the write "succeeds" (updatedAt bumps) but the field never lands.
 *
 * Instead of hand-maintained per-model path lists, this walks the *current*
 * schema (recursing into single nested subdocs and document arrays) and
 * requires the cached model to define every one of those paths. Any schema
 * edit — top-level or nested — re-registers the model. Older models with
 * extra paths (deleted fields) are kept: extra paths never lose writes.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = Schema<any>

function collectRequiredPaths(schema: AnySchema, prefix = ''): string[] {
  const out: string[] = []
  for (const key of Object.keys(schema.paths)) {
    if (key === '_id' || key === '__v') continue
    const full = prefix ? `${prefix}.${key}` : key
    const pathType = schema.path(full)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = (pathType as any)?.schema as AnySchema | undefined
    if (sub && sub.paths) {
      out.push(full, ...collectRequiredPaths(sub, full))
    } else {
      out.push(full)
    }
  }
  return out
}

export function resolveModel(
  name: string,
  schema: AnySchema,
  collection: string,
  /** Optional extra paths to require (rarely needed — the full set is derived). */
  requiredPaths: string[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): mongoose.Model<any> {
  const required = [...new Set([...collectRequiredPaths(schema), ...requiredPaths])]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = mongoose.models[name] as mongoose.Model<any> | undefined
  if (cached) {
    const stale = required.some((path) => cached.schema.path(path) === undefined)
    if (!stale) return cached
    delete mongoose.models[name]
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mongoose.model(name, schema, collection) as mongoose.Model<any>
}

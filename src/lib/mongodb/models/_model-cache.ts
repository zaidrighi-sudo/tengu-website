import mongoose, { Schema } from 'mongoose'

/**
 * In long-running dev processes, `mongoose.models.X` may hold a model compiled
 * before a schema was extended. Strict updates then silently drop the new
 * paths — the write "succeeds" (updatedAt bumps) but the field never lands.
 * Re-register the model when the cached schema is missing a required path.
 */
export function resolveModel(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Schema<any>,
  collection: string,
  requiredPaths: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): mongoose.Model<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = mongoose.models[name] as mongoose.Model<any> | undefined
  if (cached) {
    const paths = cached.schema?.paths ?? {}
    if (requiredPaths.every((path) => path in paths)) return cached
    delete mongoose.models[name]
  }
  return mongoose.model(name, schema, collection)
}

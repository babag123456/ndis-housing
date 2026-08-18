import type { z } from 'zod'
import type { ParticipantProfile } from '@/types/profile'

/**
 * One profile field, defined in one place.
 *
 * This replaces a closed enum with two exhaustive switch statements over it.
 * The guarantee that mattered is kept: `schema` and `write` share the type
 * parameter, so a field cannot be given a value its schema rejects. The
 * guarantee that is lost — the compiler forcing a central switch to handle every
 * field — is replaced by a registry-integrity test, which is stronger, because it
 * also catches a field nothing ever asks about.
 */
export type FieldDef<T extends string> = {
  schema: z.ZodType<T>
  read: (profile: ParticipantProfile) => T | null
  write: (profile: ParticipantProfile, value: T) => void
}

/**
 * A field whose value type has been erased to `string`.
 *
 * The registry has to hold fields of many different value types side by side, and
 * `FieldDef<T>` is not assignable to `FieldDef<string>` — `write` takes `T` as a
 * parameter, and under `strictFunctionTypes` a function accepting `'red' | 'blue'`
 * is not a function accepting any string. Correctly so.
 */
export type AnyFieldDef = {
  schema: z.ZodType<string>
  read: (profile: ParticipantProfile) => string | null
  write: (profile: ParticipantProfile, value: string) => void
}

export type FieldRegistry = Readonly<Record<string, AnyFieldDef>>

/**
 * Defines a field and erases its value type for the registry.
 *
 * The erasure is sound rather than convenient, and this is the only place it
 * happens. `T` is inferred from `schema` and checked against `read` and `write` at
 * the definition site, which is where a mistake would be made; and every write
 * through the registry goes via `writeTo`, which parses with that same schema
 * before calling `write`. So `write` never receives a value its schema rejected,
 * which is exactly what the type parameter was protecting.
 */
export function defineField<T extends string>(def: FieldDef<T>): AnyFieldDef {
  return def as unknown as AnyFieldDef
}

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never

/**
 * Merges field groups into one registry.
 *
 * A function rather than an inline object literal so a test can compose a
 * registry containing a synthetic track. Extensibility we cannot construct in a
 * test is extensibility we cannot check.
 *
 * Duplicate ids throw rather than silently overwriting: two tracks claiming one
 * field would mean each quietly reading the other's answers.
 */
export function composeFields<const T extends readonly Record<string, AnyFieldDef>[]>(
  ...groups: T
): UnionToIntersection<T[number]> {
  const merged: Record<string, AnyFieldDef> = {}
  for (const group of groups) {
    for (const [id, def] of Object.entries(group)) {
      if (id in merged) {
        throw new Error(`Profile field "${id}" is already defined by another group`)
      }
      merged[id] = def
    }
  }
  return merged as UnionToIntersection<T[number]>
}

/** The field's current value, or null when unanswered or unknown to the registry. */
export function readFrom(
  registry: FieldRegistry,
  profile: ParticipantProfile,
  id: string,
): string | null {
  const def = registry[id]
  if (def === undefined) return null
  return def.read(profile)
}

/**
 * Writes a validated value. Returns false when the value is not valid for the
 * field, so a stale saved answer is dropped rather than corrupting the profile.
 */
export function writeTo(
  registry: FieldRegistry,
  profile: ParticipantProfile,
  id: string,
  raw: string,
): boolean {
  const def = registry[id]
  if (def === undefined) return false
  const parsed = def.schema.safeParse(raw)
  if (!parsed.success) return false
  def.write(profile, parsed.data)
  return true
}

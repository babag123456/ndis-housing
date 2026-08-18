import type { ParticipantProfile } from '@/types/profile'
import { HOME_AND_LIVING_FIELDS } from '@/tracks/home-and-living/fields'
import { composeFields, readFrom, writeTo, type FieldRegistry } from './field'
import { SHARED_FIELDS } from './shared-fields'

/**
 * The one place field groups are composed.
 *
 * Adding a track means adding one argument here. `FieldId` is derived, so a
 * condition, clause or roadmap step referencing a field that does not exist
 * still fails to typecheck — the guarantee the old enum provided.
 *
 * This module imports track *field groups* only, never whole track modules, so
 * the import graph stays acyclic: field groups depend on nothing but the
 * primitive and the profile types.
 */
export const FIELDS = composeFields(SHARED_FIELDS, HOME_AND_LIVING_FIELDS)

export type FieldId = keyof typeof FIELDS

export const FIELD_IDS = Object.keys(FIELDS) as readonly FieldId[]

/** Bound to the production registry. Pass a registry explicitly to override. */
export function readField(
  profile: ParticipantProfile,
  id: string,
  registry: FieldRegistry = FIELDS,
): string | null {
  return readFrom(registry, profile, id)
}

export function writeField(
  profile: ParticipantProfile,
  id: string,
  raw: string,
  registry: FieldRegistry = FIELDS,
): boolean {
  return writeTo(registry, profile, id, raw)
}

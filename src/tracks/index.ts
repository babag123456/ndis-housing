import { HOME_AND_LIVING } from './home-and-living'
import type { Track } from './track'

export type { Track } from './track'

/**
 * Every track, in the order they are offered.
 *
 * Adding a track means one entry here and one argument to `composeFields`.
 * Nothing under `src/lib/` imports this module — the builders take what they
 * need as parameters, which keeps the graph acyclic and lets a test substitute a
 * synthetic track.
 */
export const TRACKS: readonly Track[] = [HOME_AND_LIVING]

export type TrackId = 'home-and-living'

export const DEFAULT_TRACK_ID: TrackId = 'home-and-living'

export function trackById(id: string): Track | undefined {
  return TRACKS.find((track) => track.id === id)
}

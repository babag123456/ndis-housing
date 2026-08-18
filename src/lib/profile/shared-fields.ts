import { defineField } from './field'
import {
  lifeStageSchema,
  ndisContextSchema,
  stateSchema,
  timingSchema,
  userPerspectiveSchema,
} from '@/types/profile'

/**
 * Fields any track may write to.
 *
 * These describe the person and their circumstances rather than one subject
 * area, so a second track should not have to ask again. Everything else belongs
 * to the track that asks about it.
 */
export const SHARED_FIELDS = {
  perspective: defineField({
    schema: userPerspectiveSchema,
    read: (profile) => profile.perspective,
    write: (profile, value) => {
      profile.perspective = value
    },
  }),
  'context.lifeStage': defineField({
    schema: lifeStageSchema,
    read: (profile) => profile.context.lifeStage,
    write: (profile, value) => {
      profile.context.lifeStage = value
    },
  }),
  'context.timing': defineField({
    schema: timingSchema,
    read: (profile) => profile.context.timing,
    write: (profile, value) => {
      profile.context.timing = value
    },
  }),
  'context.ndis': defineField({
    schema: ndisContextSchema,
    read: (profile) => profile.context.ndis,
    write: (profile, value) => {
      profile.context.ndis = value
    },
  }),
  'context.state': defineField({
    schema: stateSchema,
    read: (profile) => profile.context.state,
    write: (profile, value) => {
      profile.context.state = value
    },
  }),
} as const

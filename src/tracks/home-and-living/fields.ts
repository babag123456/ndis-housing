import { defineField } from '@/lib/profile/field'
import {
  currentLivingSchema,
  desiredChangeSchema,
  desiredLivingSchema,
  housingFeatureNeedSchema,
  informalSupportSchema,
  overnightSupportSchema,
  supportIntensitySchema,
} from '@/types/profile'

/**
 * Fields owned by the home and living track.
 *
 * `goals.change` lives here rather than in the shared group because its values
 * are about housing — moving out of the family home, changing who someone lives
 * with. A second track wanting a goal should define its own.
 */
export const HOME_AND_LIVING_FIELDS = {
  'housing.current': defineField({
    schema: currentLivingSchema,
    read: (profile) => profile.housing.current,
    write: (profile, value) => {
      profile.housing.current = value
    },
  }),
  'housing.desired': defineField({
    schema: desiredLivingSchema,
    read: (profile) => profile.housing.desired,
    write: (profile, value) => {
      profile.housing.desired = value
    },
  }),
  'housing.featureNeeds': defineField({
    schema: housingFeatureNeedSchema,
    read: (profile) => profile.housing.featureNeeds,
    write: (profile, value) => {
      profile.housing.featureNeeds = value
    },
  }),
  'support.dailyIntensity': defineField({
    schema: supportIntensitySchema,
    read: (profile) => profile.support.dailyIntensity,
    write: (profile, value) => {
      profile.support.dailyIntensity = value
    },
  }),
  'support.overnight': defineField({
    schema: overnightSupportSchema,
    read: (profile) => profile.support.overnight,
    write: (profile, value) => {
      profile.support.overnight = value
    },
  }),
  'support.informal': defineField({
    schema: informalSupportSchema,
    read: (profile) => profile.support.informal,
    write: (profile, value) => {
      profile.support.informal = value
    },
  }),
  'goals.change': defineField({
    schema: desiredChangeSchema,
    read: (profile) => profile.goals.change,
    write: (profile, value) => {
      profile.goals.change = value
    },
  }),
} as const

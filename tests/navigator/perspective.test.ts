import { describe, expect, it } from 'vitest'
import { resolveCopy, sentenceCase, voiceFor } from '@/lib/copy/perspective'
import type { UserPerspective } from '@/types/profile'

const PERSPECTIVES: UserPerspective[] = [
  'self',
  'parent',
  'carer',
  'family',
  'professional',
  'other',
]

describe('perspective layer', () => {
  it('uses second person for someone exploring for themselves', () => {
    const voice = voiceFor('self')
    expect(voice.subject).toBe('you')
    expect(voice.possessive).toBe('your')
    expect(voice.isSelf).toBe(true)
  })

  it('uses third person for every other perspective', () => {
    for (const perspective of PERSPECTIVES.filter((value) => value !== 'self')) {
      const voice = voiceFor(perspective)
      expect(voice.subject, perspective).toBe('they')
      expect(voice.possessive, perspective).toBe('their')
      expect(voice.isSelf, perspective).toBe(false)
    }
  })

  it('names the person without repeating "the person you support"', () => {
    expect(voiceFor('parent').personLabel).toBe('your child')
    expect(voiceFor('self').personLabel).toBe('yourself')
  })

  it('resolves copy to the right variant', () => {
    const variants = { self: 'Where do you live?', other: 'Where do they live?' }
    expect(resolveCopy(variants, voiceFor('self'))).toBe('Where do you live?')
    expect(resolveCopy(variants, voiceFor('carer'))).toBe('Where do they live?')
  })

  it('falls back to the third-person variant before a perspective is chosen', () => {
    const variants = { self: 'Where do you live?', other: 'Where do they live?' }
    expect(resolveCopy(variants, null)).toBe('Where do they live?')
  })

  it('capitalises only the first letter', () => {
    expect(sentenceCase('they live in the family home')).toBe(
      'They live in the family home',
    )
    expect(sentenceCase('')).toBe('')
  })
})

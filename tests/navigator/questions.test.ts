import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '@/lib/navigator/questions'
import {
  FIELD_VALUE_SCHEMAS,
  questionSchema,
} from '@/lib/navigator/question-schema'

/**
 * Content validation. Questions are data, so they get checked like data rather
 * than trusted because they happen to compile.
 */
describe('question definitions', () => {
  it('every question matches the schema', () => {
    for (const question of QUESTIONS) {
      expect(questionSchema.safeParse(question).success, question.id).toBe(true)
    }
  })

  it('question ids are unique', () => {
    const ids = QUESTIONS.map((question) => question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every option value is valid for the profile field it writes to', () => {
    for (const question of QUESTIONS) {
      const schema = FIELD_VALUE_SCHEMAS[question.profileField]
      for (const option of question.options) {
        expect(
          schema.safeParse(option.value).success,
          `${question.id}: ${option.value}`,
        ).toBe(true)
      }
    }
  })

  it('every option value is valid for any field it implies', () => {
    for (const question of QUESTIONS) {
      for (const option of question.options) {
        for (const implied of option.implies ?? []) {
          expect(
            FIELD_VALUE_SCHEMAS[implied.field].safeParse(implied.value).success,
            `${question.id}: ${option.value} implies ${implied.field}`,
          ).toBe(true)
        }
      }
    }
  })

  it('option values are unique within a question', () => {
    for (const question of QUESTIONS) {
      const values = question.options.map((option) => option.value)
      expect(new Set(values).size, question.id).toBe(values.length)
    }
  })

  it('at most one option per question is the unsure answer', () => {
    for (const question of QUESTIONS) {
      const unsure = question.options.filter((option) => option.unsure === true)
      expect(unsure.length, question.id).toBeLessThanOrEqual(1)
    }
  })

  it('conditions only reference fields an earlier question fills in', () => {
    const filled = new Set<string>()
    for (const question of QUESTIONS) {
      for (const condition of question.showWhen ?? []) {
        expect(filled.has(condition.field), `${question.id} -> ${condition.field}`).toBe(
          true,
        )
      }
      filled.add(question.profileField)
      for (const option of question.options) {
        for (const implied of option.implies ?? []) filled.add(implied.field)
      }
    }
  })

  it('no question text uses an acronym before the full term is introduced', () => {
    const acronyms = ['SDA', 'SIL', 'ILO', 'MTA']
    for (const question of QUESTIONS) {
      const text = [
        question.question.self,
        question.question.other,
        question.help?.self ?? '',
        question.help?.other ?? '',
        ...question.options.flatMap((option) => [
          option.label.self,
          option.label.other,
          option.hint?.self ?? '',
          option.hint?.other ?? '',
        ]),
      ].join(' ')
      for (const acronym of acronyms) {
        expect(text.includes(acronym), `${question.id} uses ${acronym}`).toBe(false)
      }
    }
  })

  it('every unsure answer says it is unsure in words, not just in the data', () => {
    for (const question of QUESTIONS) {
      for (const option of question.options) {
        if (option.unsure !== true) continue
        // The interface shows no separate badge, so the sentence has to carry it.
        expect(option.statement.self.toLowerCase(), question.id).toContain('not sure')
        expect(option.statement.other.toLowerCase(), question.id).toContain('not sure')
      }
    }
  })

  it('offers an unsure answer wherever the person may genuinely not know', () => {
    // Perspective and current living are facts the person asking always knows.
    const alwaysKnown = new Set(['perspective', 'current-living'])
    for (const question of QUESTIONS) {
      const hasUnsure = question.options.some((option) => option.unsure === true)
      expect(hasUnsure, question.id).toBe(!alwaysKnown.has(question.id))
    }
  })
})

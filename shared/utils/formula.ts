// ─── Formula AST ─────────────────────────────────────────────────────────────

export type FormulaVar =
  | 'level'
  | 'class_level'
  | 'prof_bonus'
  | 'str_mod'
  | 'dex_mod'
  | 'con_mod'
  | 'int_mod'
  | 'wis_mod'
  | 'cha_mod'

export type Formula =
  | { op: 'fixed'; value: number }
  | { op: 'var'; name: FormulaVar }
  | { op: 'add' | 'sub' | 'mul' | 'div'; left: Formula; right: Formula }
  | { op: 'max' | 'min'; left: Formula; right: Formula }
  | { op: 'floor' | 'ceil'; value: Formula }
  | { op: 'lookup'; table: number[] } // index = class_level - 1

// ─── Evaluation context ───────────────────────────────────────────────────────

export interface FormulaContext {
  level: number
  class_level: number
  prof_bonus: number
  str_mod: number
  dex_mod: number
  con_mod: number
  int_mod: number
  wis_mod: number
  cha_mod: number
}

// ─── Evaluator ────────────────────────────────────────────────────────────────

export function evaluate(formula: Formula, ctx: FormulaContext): number {
  switch (formula.op) {
    case 'fixed':
      return formula.value

    case 'var':
      return ctx[formula.name]

    case 'add':
      return evaluate(formula.left, ctx) + evaluate(formula.right, ctx)

    case 'sub':
      return evaluate(formula.left, ctx) - evaluate(formula.right, ctx)

    case 'mul':
      return evaluate(formula.left, ctx) * evaluate(formula.right, ctx)

    case 'div':
      return evaluate(formula.left, ctx) / evaluate(formula.right, ctx)

    case 'max':
      return Math.max(evaluate(formula.left, ctx), evaluate(formula.right, ctx))

    case 'min':
      return Math.min(evaluate(formula.left, ctx), evaluate(formula.right, ctx))

    case 'floor':
      return Math.floor(evaluate(formula.value, ctx))

    case 'ceil':
      return Math.ceil(evaluate(formula.value, ctx))

    case 'lookup': {
      const index = Math.min(ctx.class_level - 1, formula.table.length - 1)
      return formula.table[Math.max(0, index)]!
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const fixed = (value: number): Formula => ({ op: 'fixed', value })
export const variable = (name: FormulaVar): Formula => ({ op: 'var', name })
export const lookup = (table: number[]): Formula => ({ op: 'lookup', table })
export const add = (left: Formula, right: Formula): Formula => ({ op: 'add', left, right })
export const mul = (left: Formula, right: Formula): Formula => ({ op: 'mul', left, right })
export const max = (left: Formula, right: Formula): Formula => ({ op: 'max', left, right })
export const floor = (value: Formula): Formula => ({ op: 'floor', value })

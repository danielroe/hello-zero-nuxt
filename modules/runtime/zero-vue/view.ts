// based on https://github.com/rocicorp/mono/tree/main/packages/zero-solid

import { applyChange } from '@rocicorp/zero/advanced'
import type { Change, Entry, Format, Input, Output, Query, QueryType, Smash, TableSchema, View } from '@rocicorp/zero/advanced'
import { ref } from 'vue'
import type { Ref } from 'vue'

export class VueView<V extends View> implements Output {
  readonly #input: Input
  readonly #format: Format
  readonly #onDestroy: () => void

  // Synthetic "root" entry that has a single "" relationship, so that we can
  // treat all changes, including the root change, generically.
  readonly #root: Ref<Entry>

  constructor(
    input: Input,
    format: Format = { singular: false, relationships: {} },
    onDestroy: () => void = () => {},
  ) {
    this.#input = input
    this.#format = format
    this.#onDestroy = onDestroy
    this.#root = ref({
      '': format.singular ? undefined : [],
    })
    input.setOutput(this)

    for (const node of input.fetch({})) {
      applyChange(
        this.#root.value,
        { type: 'add', node },
        input.getSchema(),
        '',
        this.#format,
      )
    }
  }

  get data() {
    return this.#root.value[''] as V
  }

  destroy() {
    this.#onDestroy()
  }

  push(change: Change): void {
    applyChange(
      this.#root.value,
      change,
      this.#input.getSchema(),
      '',
      this.#format,
    )
  }
}

export function vueViewFactory<
  TSchema extends TableSchema,
  TReturn extends QueryType,
>(
  _query: Query<TSchema, TReturn>,
  input: Input,
  format: Format,
  onDestroy: () => void,
): VueView<Smash<TReturn>> {
  const v = new VueView<Smash<TReturn>>(input, format, onDestroy)

  return v
}

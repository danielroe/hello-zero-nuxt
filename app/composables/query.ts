// Much of this uses code from `@rocicorp/react`

import type { Query, QueryType, Smash, TableSchema } from '@rocicorp/zero'
import { ref, onUnmounted } from 'vue'

function hasOwn(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function deepClone(value: unknown): unknown {
  const seen: unknown[] = []
  return internalDeepClone(value, seen)
}

function internalDeepClone(value: unknown, seen: unknown[]): unknown {
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return value
    case 'object': {
      if (value === null) {
        return null
      }
      if (seen.includes(value)) {
        throw new Error('Cyclic object')
      }
      seen.push(value)
      if (Array.isArray(value)) {
        const rv = value.map(v => internalDeepClone(v, seen))
        seen.pop()
        return rv
      }
      const obj: Record<string, unknown> = {}
      for (const k in value) {
        if (hasOwn(value as Record<string, unknown>, k)) {
          const v = (value as Record<string, unknown>)[k]
          if (v !== undefined) {
            obj[k] = internalDeepClone(v, seen)
          }
        }
      }
      seen.pop()
      return obj
    }
    default:
      throw new Error(`Invalid type: ${typeof value}`)
  }
}

const emptyArray: unknown[] = []
const disabledSubscriber = () => () => {}
const defaultSnapshots = {
  singular: [undefined, { type: 'unknown' }] as [unknown, { type: string }],
  plural: [emptyArray, { type: 'unknown' }] as [unknown[], { type: string }],
}

function getDefaultSnapshot(singular: boolean): [unknown, { type: string }] | [unknown[], { type: string }] {
  return singular ? defaultSnapshots.singular : defaultSnapshots.plural
}

class ViewStore {
  #views = new Map<string, ViewWrapper>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getView(clientID: string, query: any, enabled?: boolean): ViewWrapper {
    if (!enabled) {
      return {
        getSnapshot: () => getDefaultSnapshot(query.format.singular),
        subscribe: disabledSubscriber,
      } as unknown as ViewWrapper
    }
    const hash = query.hash() + clientID
    let existing = this.#views.get(hash)
    if (!existing) {
      existing = new ViewWrapper(
        query,
        (view) => {
          const lastView = this.#views.get(hash)
          if (lastView && lastView !== view) {
            throw new Error('View already exists')
          }
          this.#views.set(hash, view)
        },
        () => {
          this.#views.delete(hash)
        },
      )
      this.#views.set(hash, existing)
    }
    return existing
  }
}

const viewStore = new ViewStore()

class ViewWrapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #view: any
  #onDematerialized: () => void
  #onMaterialized: (view: ViewWrapper) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #query: any
  #snapshot: [unknown, { type: string }] | [unknown[], { type: string }]
  #internals: Set<() => void>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(query: any, onMaterialized: (view: ViewWrapper) => void, onDematerialized: () => void) {
    this.#snapshot = getDefaultSnapshot(query.format.singular)
    this.#onMaterialized = onMaterialized
    this.#onDematerialized = onDematerialized
    this.#internals = new Set()
    this.#query = query
  }

  #onData = (snap: unknown, resultType: string) => {
    const data = snap === undefined ? snap : deepClone(snap)
    this.#snapshot = [data, { type: resultType }]
    for (const internals of this.#internals) {
      internals()
    }
  }

  #materializeIfNeeded = () => {
    if (this.#view) {
      return
    }
    this.#view = this.#query.materialize()
    this.#view.addListener(this.#onData)
    this.#onMaterialized(this)
  }

  getSnapshot = (): [unknown, { type: string }] | [unknown[], { type: string }] => this.#snapshot

  subscribe = (callback: () => void) => {
    this.#internals.add(callback)
    this.#materializeIfNeeded()
    return () => {
      this.#internals.delete(callback)
      if (this.#internals.size === 0) {
        this.#view?.destroy()
        this.#view = undefined
        this.#onDematerialized()
      }
    }
  }
}

export type ResultType = 'unknown' | 'complete'
export type QueryResultDetails = {
  type: ResultType
}

export type QueryResult<TReturn extends QueryType> = [
  Smash<TReturn>,
  QueryResultDetails,
]

export function useQuery<TSchema extends TableSchema, TReturn extends QueryType>(q: Query<TSchema, TReturn> | ComputedRef<Query<TSchema, TReturn>>, enable: boolean = true): Ref<Smash<TReturn>> {
  const z = useZero()
  let view = viewStore.getView(z.clientID, unref(q), enable)

  const snapshot = ref(view.getSnapshot()[0])

  let unsubscribe = view.subscribe(() => {
    snapshot.value = view.getSnapshot()[0]
  })

  if (isRef(q)) {
    watch(q, () => {
      unsubscribe()
      view = viewStore.getView(z.clientID, unref(q), enable)
      snapshot.value = view.getSnapshot()[0]
      unsubscribe = view.subscribe(() => {
        snapshot.value = view.getSnapshot()[0]
      })
    })
  }

  onUnmounted(() => {
    unsubscribe()
  })

  return snapshot as Ref<Smash<TReturn>>
}

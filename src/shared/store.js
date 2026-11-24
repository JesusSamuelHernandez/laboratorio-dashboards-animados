import { useSyncExternalStore } from 'react'

// Store mínimo reutilizable por todos los prototipos (sin dependencias).
export function createStore(initial) {
  let state = initial
  const subs = new Set()
  return {
    get: () => state,
    set: (patch) => {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
      subs.forEach((fn) => fn())
    },
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }
}

// El selector debe devolver valores primitivos o referencias estables.
export function useStore(store, selector = (s) => s) {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()))
}

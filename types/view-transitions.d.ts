// Типы для View Transitions API
declare global {
  interface Document {
    startViewTransition?: (callback: () => void | Promise<void>) => {
      finished: Promise<void>
      ready: Promise<void>
      updateCallbackDone: Promise<void>
      skipTransition: () => void
    }
  }
}

export {}

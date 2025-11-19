// Типы для View Transitions API
declare global {
  interface Document {
    // eslint-disable-next-line no-unused-vars
    startViewTransition?: (callback: () => void | Promise<void>) => {
      finished: Promise<void>
      ready: Promise<void>
      updateCallbackDone: Promise<void>
      skipTransition: () => void
    }
  }
}

export {}

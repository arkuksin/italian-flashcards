import { useCallback, useEffect, useRef, useState } from 'react'

export type NavigationContext = 'mode-selection' | 'analytics' | 'dashboard' | 'external'

export interface PendingNavigation {
  context: NavigationContext
  onProceed: () => void | Promise<void>
  onDiscard?: () => void | Promise<void>
}

interface UseConfirmNavigationOptions {
  when: boolean
  beforeUnloadMessage?: string
}

interface UseConfirmNavigationResult {
  isDialogOpen: boolean
  pendingNavigation: PendingNavigation | null
  requestNavigation: (navigation: PendingNavigation) => void
  cancelNavigation: () => void
  confirmNavigation: () => Promise<void>
  discardNavigation: () => Promise<void>
}

export interface ConfirmNavigationState {
  isDialogOpen: boolean
  pendingNavigation: PendingNavigation | null
}

export const initialConfirmNavigationState: ConfirmNavigationState = {
  isDialogOpen: false,
  pendingNavigation: null,
}

export const applyRequestNavigation = (
  state: ConfirmNavigationState,
  shouldConfirm: boolean,
  navigation: PendingNavigation,
): { nextState: ConfirmNavigationState; shouldProceed: boolean } => {
  if (!shouldConfirm) {
    return { nextState: state, shouldProceed: true }
  }

  return {
    nextState: {
      isDialogOpen: true,
      pendingNavigation: navigation,
    },
    shouldProceed: false,
  }
}

export const applyCancelNavigation = (): ConfirmNavigationState => ({ ...initialConfirmNavigationState })

export const applyResolveNavigation = (
  state: ConfirmNavigationState,
): { nextState: ConfirmNavigationState; navigation: PendingNavigation | null } => ({
  nextState: { ...initialConfirmNavigationState },
  navigation: state.pendingNavigation,
})

export const useConfirmNavigation = ({
  when,
  beforeUnloadMessage = 'Dein aktueller Fortschritt wird verworfen. Bist du sicher?',
}: UseConfirmNavigationOptions): UseConfirmNavigationResult => {
  const [state, setState] = useState<ConfirmNavigationState>(initialConfirmNavigationState)
  const optionsRef = useRef({ when, beforeUnloadMessage })

  optionsRef.current.when = when
  optionsRef.current.beforeUnloadMessage = beforeUnloadMessage

  const requestNavigation = useCallback(
    (navigation: PendingNavigation) => {
      setState(prevState => {
        const { nextState, shouldProceed } = applyRequestNavigation(
          prevState,
          optionsRef.current.when,
          navigation,
        )

        if (shouldProceed) {
          void navigation.onProceed()
          return prevState
        }

        return nextState
      })
    },
    [],
  )

  const cancelNavigation = useCallback(() => {
    setState(applyCancelNavigation())
  }, [])

  const confirmNavigation = useCallback(async () => {
    let navigation: PendingNavigation | null = null
    setState(prevState => {
      const result = applyResolveNavigation(prevState)
      navigation = result.navigation
      return result.nextState
    })
    await navigation?.onProceed()
  }, [])

  const discardNavigation = useCallback(async () => {
    let navigation: PendingNavigation | null = null
    setState(prevState => {
      const result = applyResolveNavigation(prevState)
      navigation = result.navigation
      return result.nextState
    })
    if (navigation?.onDiscard) {
      await navigation.onDiscard()
      return
    }
    await navigation?.onProceed()
  }, [])

  useEffect(() => {
    if (!optionsRef.current.when) return

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = optionsRef.current.beforeUnloadMessage
      return optionsRef.current.beforeUnloadMessage
    }

    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [when])

  return {
    isDialogOpen: state.isDialogOpen,
    pendingNavigation: state.pendingNavigation,
    requestNavigation,
    cancelNavigation,
    confirmNavigation,
    discardNavigation,
  }
}

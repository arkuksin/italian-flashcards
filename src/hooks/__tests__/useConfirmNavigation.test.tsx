import { describe, expect, it, vi } from 'vitest'
import {
  applyCancelNavigation,
  applyRequestNavigation,
  applyResolveNavigation,
  initialConfirmNavigationState,
  type PendingNavigation,
} from '../useConfirmNavigation'

describe('confirm navigation helpers', () => {
  const createNavigation = (): PendingNavigation => ({
    context: 'analytics',
    onProceed: vi.fn(),
    onDiscard: vi.fn(),
  })

  it('opens confirmation dialog when confirmation is required', () => {
    const navigation = createNavigation()
    const result = applyRequestNavigation(initialConfirmNavigationState, true, navigation)

    expect(result.shouldProceed).toBe(false)
    expect(result.nextState.isDialogOpen).toBe(true)
    expect(result.nextState.pendingNavigation).toBe(navigation)
  })

  it('proceeds immediately when confirmation is not required', () => {
    const navigation = createNavigation()
    const result = applyRequestNavigation(initialConfirmNavigationState, false, navigation)

    expect(result.shouldProceed).toBe(true)
    expect(result.nextState).toBe(initialConfirmNavigationState)
  })

  it('resets state when cancelling the dialog', () => {
    const cancelledState = applyCancelNavigation()
    expect(cancelledState.isDialogOpen).toBe(false)
    expect(cancelledState.pendingNavigation).toBeNull()
  })

  it('returns the pending navigation when resolving the dialog', () => {
    const navigation = createNavigation()
    const activeState = { isDialogOpen: true, pendingNavigation: navigation }
    const result = applyResolveNavigation(activeState)

    expect(result.nextState.isDialogOpen).toBe(false)
    expect(result.nextState.pendingNavigation).toBeNull()
    expect(result.navigation).toBe(navigation)
  })
})

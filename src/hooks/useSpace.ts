'use client'

import { useContext } from 'react'
import { SpaceContext } from '../context/SpaceContext'
import type { SpaceContextValue } from '../types'

/**
 * Access the current Space context.
 * Must be used within a `<Space>` provider.
 */
export function useSpace(): SpaceContextValue {
  const ctx = useContext(SpaceContext)
  if (!ctx) {
    throw new Error(
      'useSpace() must be used within a <Space> provider. ' +
      'Wrap your component tree with <Space id="..." connection={...}>'
    )
  }
  return ctx
}

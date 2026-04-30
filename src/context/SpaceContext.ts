'use client'

import { createContext } from 'react'
import type { SpaceContextValue } from '../types'

export const SpaceContext = createContext<SpaceContextValue | null>(null)

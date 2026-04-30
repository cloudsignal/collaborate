'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import CloudSignalClient from '@cloudsignal/mqtt-client'
import { SpaceContext } from './SpaceContext'
import { getColorForUser } from '../utils/colors'
import { TOPIC_PREFIX, TOPICS, DEFAULTS, spaceWildcard, spaceTopic } from '../constants'
import type { SpaceProps, SpaceUser, SpaceContextValue, TopicHandler, PublishOptions } from '../types'

// Type for the CloudSignal client instance
interface CSClient {
  connect(config: Record<string, unknown>): Promise<void>
  connectWithToken(config: Record<string, unknown>): Promise<void>
  subscribe(topic: string, qos?: 0 | 1 | 2): Promise<void>
  unsubscribe(topic: string): Promise<void>
  transmit(topic: string, message: string | object, options?: { qos?: 0 | 1 | 2; retain?: boolean }): void
  destroy(): void
  onMessage(handler: (topic: string, message: string) => void): void
  offMessage(handler: (topic: string, message: string) => void): void
  onConnectionStatusChange: ((connected: boolean) => void) | null
  onReconnecting: ((attempt: number) => void) | null
  onAuthError: ((error: Error) => void) | null
}

export function Space({
  id,
  connection,
  userName,
  userColor,
  userAvatar,
  userData,
  debug = false,
  presenceHeartbeatMs = DEFAULTS.PRESENCE_HEARTBEAT_MS,
  presenceTimeoutMs = DEFAULTS.PRESENCE_TIMEOUT_MS,
  onConnectionChange,
  children,
}: SpaceProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Refs for StrictMode safety
  const clientRef = useRef<CSClient | null>(null)
  const connectingRef = useRef(false)
  const mountedRef = useRef(true)
  const handlersRef = useRef(new Map<string, Set<TopicHandler>>())
  const messageHandlerRef = useRef<((topic: string, message: string) => void) | null>(null)
  const onConnectionChangeRef = useRef(onConnectionChange)

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange
  }, [onConnectionChange])

  // Build self user
  const resolvedColor = userColor || getColorForUser(userName)
  const self = useMemo<SpaceUser>(() => ({
    userId: connection.username || userName,
    name: userName,
    color: resolvedColor,
    avatar: userAvatar,
    data: userData,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  }), [connection.username, userName, resolvedColor, userAvatar, userData])

  const selfRef = useRef(self)
  useEffect(() => { selfRef.current = self }, [self])

  // Logging
  const log = useCallback((...args: unknown[]) => {
    if (debug) console.log('[CloudSignal:Space]', ...args)
  }, [debug])

  // Topic handler registry
  const addTopicHandler = useCallback((segment: string, handler: TopicHandler): (() => void) => {
    if (!handlersRef.current.has(segment)) {
      handlersRef.current.set(segment, new Set())
    }
    handlersRef.current.get(segment)!.add(handler)
    return () => {
      handlersRef.current.get(segment)?.delete(handler)
    }
  }, [])

  // Message router — parses topic, dispatches to registered handlers
  const routeMessage = useCallback((topic: string, messageStr: string) => {
    const prefix = `${TOPIC_PREFIX}/${id}/`
    if (!topic.startsWith(prefix)) return

    const subtopic = topic.slice(prefix.length) // e.g. "cursors", "state/myKey", "broadcast/chat"
    const segment = subtopic.split('/')[0]       // first segment is the feature

    let payload: unknown
    try {
      payload = JSON.parse(messageStr)
    } catch {
      payload = messageStr
    }

    log('←', segment, subtopic)

    const handlers = handlersRef.current.get(segment)
    if (handlers) {
      for (const handler of handlers) {
        handler(subtopic, payload)
      }
    }
  }, [id, log])

  // Publish helper — auto-prefixes with space topic
  const publish = useCallback((subtopic: string, payload: unknown, options?: PublishOptions) => {
    if (!clientRef.current) {
      log('Cannot publish: not connected')
      return
    }
    const topic = spaceTopic(id, subtopic)
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload)
    clientRef.current.transmit(topic, message, options)
    log('→', subtopic)
  }, [id, log])

  // Presence heartbeat
  useEffect(() => {
    if (!isConnected) return

    const sendHeartbeat = () => {
      publish(TOPICS.PRESENCE, {
        userId: selfRef.current.userId,
        name: selfRef.current.name,
        color: selfRef.current.color,
        avatar: selfRef.current.avatar,
        data: selfRef.current.data,
        ts: Date.now(),
      })
    }

    // Send immediately on connect
    sendHeartbeat()

    const interval = setInterval(sendHeartbeat, presenceHeartbeatMs)
    return () => clearInterval(interval)
  }, [isConnected, publish, presenceHeartbeatMs])

  // Explicit leave on beforeunload
  useEffect(() => {
    if (!isConnected) return

    const handleUnload = () => {
      publish(TOPICS.PRESENCE, {
        userId: selfRef.current.userId,
        type: 'leave',
        ts: Date.now(),
      })
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [isConnected, publish])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    mountedRef.current = true

    const doConnect = async () => {
      if (connectingRef.current || clientRef.current) return

      connectingRef.current = true
      setIsConnecting(true)
      setError(null)

      try {
        const clientOptions: Record<string, unknown> = {
          debug,
          preset: 'desktop',
        }
        if (connection.tokenServiceUrl) {
          clientOptions.tokenServiceUrl = connection.tokenServiceUrl
        }

        const client = new CloudSignalClient(clientOptions) as unknown as CSClient

        // Connection status
        client.onConnectionStatusChange = (connected: boolean) => {
          log('Connection:', connected)
          if (mountedRef.current) {
            setIsConnected(connected)
            onConnectionChangeRef.current?.(connected)
          }
        }

        client.onReconnecting = (attempt: number) => {
          log('Reconnecting, attempt:', attempt)
        }

        client.onAuthError = (err: Error) => {
          log('Auth error:', err.message)
          if (mountedRef.current) {
            setError(err)
            setIsConnected(false)
          }
          clientRef.current = null
        }

        // Message routing
        const handler = (topic: string, message: string) => routeMessage(topic, message)
        messageHandlerRef.current = handler
        client.onMessage(handler)

        // Build LWT (Last Will and Testament) for auto-leave on disconnect
        const willPayload = JSON.stringify({
          userId: selfRef.current.userId,
          type: 'leave',
          ts: Date.now(),
        })

        // Connect with appropriate auth method
        if (connection.secretKey || connection.externalToken) {
          await client.connectWithToken({
            host: connection.host,
            organizationId: connection.organizationId,
            secretKey: connection.secretKey,
            externalToken: connection.externalToken,
            willTopic: spaceTopic(id, TOPICS.PRESENCE),
            willMessage: willPayload,
            willQos: 0,
          })
        } else {
          await client.connect({
            host: connection.host,
            username: connection.username,
            password: connection.password,
            willTopic: spaceTopic(id, TOPICS.PRESENCE),
            willMessage: willPayload,
            willQos: 0,
          })
        }

        if (!mountedRef.current) {
          client.destroy()
          return
        }

        clientRef.current = client

        // Subscribe to all space topics
        await client.subscribe(spaceWildcard(id), 0)
        log('Subscribed to', spaceWildcard(id))

      } catch (err) {
        log('Connection failed:', err)
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        connectingRef.current = false
        if (mountedRef.current) setIsConnecting(false)
      }
    }

    doConnect()

    return () => {
      mountedRef.current = false

      // Publish explicit leave before destroying
      if (clientRef.current) {
        try {
          const leaveTopic = spaceTopic(id, TOPICS.PRESENCE)
          const leavePayload = JSON.stringify({
            userId: selfRef.current.userId,
            type: 'leave',
            ts: Date.now(),
          })
          clientRef.current.transmit(leaveTopic, leavePayload, { qos: 0 })
        } catch {
          // Best-effort leave
        }
        clientRef.current.destroy()
        clientRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, connection.host, connection.username, connection.password, connection.secretKey, connection.externalToken, connection.organizationId])

  // Context value
  const contextValue = useMemo<SpaceContextValue>(() => ({
    spaceId: id,
    self,
    isConnected,
    isConnecting,
    error,
    presenceTimeoutMs,
    publish,
    addTopicHandler,
  }), [id, self, isConnected, isConnecting, error, presenceTimeoutMs, publish, addTopicHandler])

  return (
    <SpaceContext.Provider value={contextValue}>
      {children}
    </SpaceContext.Provider>
  )
}

// Export alias for explicit naming in AI-generated code
export { Space as CloudSignalSpace }

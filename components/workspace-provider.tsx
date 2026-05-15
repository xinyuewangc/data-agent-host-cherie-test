"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { UIMessage } from "ai"

import {
  WORKSPACE_STATE_VERSION,
  initialWorkspaceState,
  makeTitleFromPrompt,
  type WorkspaceProject,
  type WorkspaceSession,
  type WorkspaceState,
} from "@/lib/workspace-mock"

const STORAGE_KEY = "data-agent-workspace-v1"

type WorkspaceRoute = {
  title: string
  breadcrumbs: string[]
}

type WorkspaceContextValue = {
  createTemporarySession: (options?: { prompt?: string }) => WorkspaceSession
  createProjectSession: (projectId: string) => WorkspaceSession | undefined
  getProject: (projectId: string) => WorkspaceProject | undefined
  getRouteByPath: (pathname: string) => WorkspaceRoute | undefined
  getSession: (sessionId: string) => WorkspaceSession | undefined
  getSessionByRoute: (
    routeSegment: string,
    projectId?: string
  ) => WorkspaceSession | undefined
  isHydrated: boolean
  projects: WorkspaceProject[]
  deleteProject: (projectId: string) => void
  deleteSession: (sessionId: string) => void
  renameProject: (projectId: string, title: string) => void
  renameSession: (sessionId: string, title: string) => void
  saveTemporarySession: (
    sessionId: string,
    options?: { title?: string }
  ) => WorkspaceSession | undefined
  setProjectMcpSharing: (projectId: string, isMcpShared: boolean) => void
  temporarySessions: WorkspaceSession[]
  updateSessionMessages: (sessionId: string, messages: UIMessage[]) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(initialWorkspaceState)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) {
        return
      }

      const stored = window.localStorage.getItem(STORAGE_KEY)

      if (!stored) {
        setIsHydrated(true)
        return
      }

      try {
        const parsed = JSON.parse(stored) as WorkspaceState
        const restoredState = restoreWorkspaceState(parsed)

        if (restoredState) {
          setState(restoredState)
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      } finally {
        setIsHydrated(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [isHydrated, state])

  const getProject = useCallback(
    (projectId: string) =>
      state.projects.find((project) => project.id === projectId),
    [state.projects]
  )

  const getSession = useCallback(
    (sessionId: string) => state.sessions[sessionId],
    [state.sessions]
  )

  const getSessionByRoute = useCallback(
    (routeSegment: string, projectId?: string) =>
      Object.values(state.sessions).find((session) => {
        if (projectId && session.projectId !== projectId) {
          return false
        }

        return (
          session.routeSegment === routeSegment || session.id === routeSegment
        )
      }),
    [state.sessions]
  )

  const createTemporarySession = useCallback(
    (options?: { prompt?: string }) => {
      const now = new Date().toISOString()
      const sessionId = createWorkspaceSessionId()
      const title = options?.prompt
        ? makeTitleFromPrompt(options.prompt)
        : "临时会话"
      const createdSession: WorkspaceSession = {
        id: sessionId,
        routeSegment: sessionId,
        title,
        createdAt: now,
        updatedAt: now,
        isTemporary: true,
        messages: [],
      }

      setState((current) => {
        return {
          ...current,
          sessions: {
            ...current.sessions,
            [sessionId]: createdSession,
          },
          temporarySessionIds: [
            sessionId,
            ...current.temporarySessionIds.filter((id) => id !== sessionId),
          ],
        }
      })

      return createdSession
    },
    []
  )

  const updateSessionMessages = useCallback(
    (sessionId: string, messages: UIMessage[]) => {
      setState((current) => {
        const session = current.sessions[sessionId]

        if (!session) {
          return current
        }

        return {
          ...current,
          sessions: {
            ...current.sessions,
            [sessionId]: {
              ...session,
              updatedAt: new Date().toISOString(),
              title: deriveSessionTitle(session, messages),
              messages,
            },
          },
        }
      })
    },
    []
  )

  const renameSession = useCallback((sessionId: string, title: string) => {
    const normalizedTitle = title.trim()

    if (!normalizedTitle) {
      return
    }

    setState((current) => {
      const session = current.sessions[sessionId]

      if (!session) {
        return current
      }
      const projects = session.projectId
        ? current.projects.map((project) =>
            project.id === session.projectId &&
            project.sessionIds.length === 1 &&
            project.sessionIds[0] === sessionId
              ? { ...project, title: normalizedTitle }
              : project
          )
        : current.projects

      return {
        ...current,
        projects,
        sessions: {
          ...current.sessions,
          [sessionId]: {
            ...session,
            title: normalizedTitle,
            updatedAt: new Date().toISOString(),
          },
        },
      }
    })
  }, [])

  const renameProject = useCallback((projectId: string, title: string) => {
    const normalizedTitle = title.trim()

    if (!normalizedTitle) {
      return
    }

    setState((current) => {
      return {
        ...current,
        projects: current.projects.map((project) =>
          project.id === projectId
            ? { ...project, title: normalizedTitle }
            : project
        ),
      }
    })
  }, [])

  const setProjectMcpSharing = useCallback(
    (projectId: string, isMcpShared: boolean) => {
      setState((current) => {
        return {
          ...current,
          projects: current.projects.map((project) =>
            project.id === projectId ? { ...project, isMcpShared } : project
          ),
        }
      })
    },
    []
  )

  const deleteProject = useCallback((projectId: string) => {
    setState((current) => {
      const project = current.projects.find((item) => item.id === projectId)

      if (!project) {
        return current
      }

      const deletedSessionIds = new Set(project.sessionIds)
      const sessions = Object.fromEntries(
        Object.entries(current.sessions).filter(
          ([sessionId]) => !deletedSessionIds.has(sessionId)
        )
      )

      return {
        ...current,
        projects: current.projects.filter((item) => item.id !== projectId),
        sessions,
        temporarySessionIds: current.temporarySessionIds.filter(
          (sessionId) => !deletedSessionIds.has(sessionId)
        ),
      }
    })
  }, [])

  const deleteSession = useCallback((sessionId: string) => {
    setState((current) => {
      const { [sessionId]: _deletedSession, ...sessions } = current.sessions

      if (!_deletedSession) {
        return current
      }

      return {
        ...current,
        projects: current.projects.map((project) => ({
          ...project,
          sessionIds: project.sessionIds.filter((id) => id !== sessionId),
        })),
        sessions,
        temporarySessionIds: current.temporarySessionIds.filter(
          (id) => id !== sessionId
        ),
      }
    })
  }, [])

  const saveTemporarySession = useCallback(
    (sessionId: string, options?: { title?: string }) => {
      const session = state.sessions[sessionId]

      if (!session || !session.isTemporary) {
        return undefined
      }

      const title = options?.title?.trim() || session.title || "保存的项目"
      const projectId = uniqueProjectId(
        slugify(title || "saved-project"),
        state.projects
      )
      const project: WorkspaceProject = {
        id: projectId,
        title,
        description: "从临时会话保存的数据查询项目。",
        isMcpShared: false,
        sessionIds: [sessionId],
      }
      const savedSession: WorkspaceSession = {
        ...session,
        title,
        isTemporary: false,
        projectId,
        routeSegment: session.routeSegment || session.id,
        updatedAt: new Date().toISOString(),
      }

      setState((current) => {
        return {
          ...current,
          projects: [project, ...current.projects],
          sessions: {
            ...current.sessions,
            [sessionId]: savedSession,
          },
          temporarySessionIds: current.temporarySessionIds.filter(
            (id) => id !== sessionId
          ),
        }
      })

      return savedSession
    },
    [state.projects, state.sessions]
  )

  const createProjectSession = useCallback(
    (projectId: string) => {
      const project = state.projects.find((item) => item.id === projectId)

      if (!project) {
        return undefined
      }

      const now = new Date().toISOString()
      const sessionNumber = project.sessionIds.length + 1
      const sessionId = `${projectId}-session-${Date.now()}`
      const createdSession: WorkspaceSession = {
        id: sessionId,
        projectId,
        routeSegment: `session-${sessionNumber}`,
        title: `会话${sessionNumber}`,
        createdAt: now,
        updatedAt: now,
        isTemporary: false,
        messages: [],
      }

      setState((current) => {
        return {
          ...current,
          projects: current.projects.map((item) =>
            item.id === projectId
              ? { ...item, sessionIds: [sessionId, ...item.sessionIds] }
              : item
          ),
          sessions: {
            ...current.sessions,
            [sessionId]: createdSession,
          },
        }
      })

      return createdSession
    },
    [state.projects]
  )

  const getRouteByPath = useCallback(
    (pathname: string): WorkspaceRoute | undefined => {
      if (pathname.startsWith("/sessions/") && pathname !== "/sessions/new") {
        const routeSegment = pathname
          .split("/")
          .filter(Boolean)
          .map((segment) => decodeURIComponent(segment))
          .at(1)
        const session = routeSegment
          ? getSessionByRoute(routeSegment)
          : undefined

        if (session) {
          return {
            title: session.title,
            breadcrumbs: ["会话", session.title],
          }
        }
      }

      if (pathname.startsWith("/assets/my/")) {
        const [, , projectId, routeSegment] = pathname
          .split("/")
          .filter(Boolean)
          .map((segment) => decodeURIComponent(segment))
        const project = projectId ? getProject(projectId) : undefined

        if (project && routeSegment) {
          const session = getSessionByRoute(routeSegment, project.id)

          if (session) {
            const isSingleSessionProject = project.sessionIds.length === 1

            return {
              title: session.title,
              breadcrumbs: isSingleSessionProject
                ? ["我的数据资产", session.title]
                : ["我的数据资产", project.title, session.title],
            }
          }
        }

        if (project) {
          return {
            title: project.title,
            breadcrumbs: ["我的数据资产", project.title],
          }
        }
      }

      return undefined
    },
    [getProject, getSessionByRoute]
  )

  const value = useMemo<WorkspaceContextValue>(() => {
    const temporarySessions = state.temporarySessionIds
      .map((sessionId) => state.sessions[sessionId])
      .filter(Boolean)

    return {
      createTemporarySession,
      createProjectSession,
      getProject,
      getRouteByPath,
      getSession,
      getSessionByRoute,
      isHydrated,
      projects: state.projects,
      deleteProject,
      deleteSession,
      renameProject,
      renameSession,
      saveTemporarySession,
      setProjectMcpSharing,
      temporarySessions,
      updateSessionMessages,
    }
  }, [
    createTemporarySession,
    createProjectSession,
    getProject,
    getRouteByPath,
    getSession,
    getSessionByRoute,
    isHydrated,
    deleteProject,
    deleteSession,
    renameProject,
    renameSession,
    saveTemporarySession,
    setProjectMcpSharing,
    state.projects,
    state.sessions,
    state.temporarySessionIds,
    updateSessionMessages,
  ])

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)

  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider.")
  }

  return context
}

function restoreWorkspaceState(state: WorkspaceState): WorkspaceState | null {
  if (!state || !Array.isArray(state.projects) || !state.sessions) {
    return null
  }

  if (state.version === WORKSPACE_STATE_VERSION) {
    return normalizeWorkspaceResultCopy(state)
  }

  if (state.version > WORKSPACE_STATE_VERSION) {
    return null
  }

  return normalizeWorkspaceResultCopy({
    ...migrateProjectsToSingleSessionFolders(state),
    version: WORKSPACE_STATE_VERSION,
  })
}

function normalizeWorkspaceResultCopy(state: WorkspaceState): WorkspaceState {
  return {
    ...state,
    sessions: Object.fromEntries(
      Object.entries(state.sessions).map(([sessionId, session]) => [
        sessionId,
        {
          ...session,
          messages: session.messages.map(normalizeMessageResultCopy),
        },
      ])
    ),
  }
}

function normalizeMessageResultCopy(message: UIMessage): UIMessage {
  let didChange = false
  const parts = message.parts.map((part) => {
    if (part.type !== "text" || typeof part.text !== "string") {
      return part
    }

    const nextText = part.text
      .replaceAll("已生成右侧 Artifacts", "已生成右侧结果")
      .replaceAll("Artifacts", "结果")

    if (nextText === part.text) {
      return part
    }

    didChange = true
    return {
      ...part,
      text: nextText,
    }
  })

  return didChange ? { ...message, parts } : message
}

function migrateProjectsToSingleSessionFolders(
  state: WorkspaceState
): WorkspaceState {
  const sessions = { ...state.sessions }
  const usedProjectIds = new Set<string>()
  const projects = state.projects.flatMap((project) => {
    const projectSessions = project.sessionIds
      .map((sessionId) => sessions[sessionId])
      .filter((session): session is WorkspaceSession => Boolean(session))

    if (projectSessions.length === 0) {
      return [
        {
          ...project,
          id: reserveProjectId(project.id, usedProjectIds),
          sessionIds: [],
        },
      ]
    }

    return projectSessions.map((session, index) => {
      const projectId = reserveProjectId(
        index === 0
          ? project.id
          : `${project.id}-${session.routeSegment || session.id}`,
        usedProjectIds
      )

      sessions[session.id] = {
        ...session,
        projectId,
      }

      return {
        ...project,
        id: projectId,
        title: session.title || project.title,
        sessionIds: [session.id],
      }
    })
  })

  return {
    ...state,
    projects,
    sessions,
  }
}

function reserveProjectId(baseId: string, usedProjectIds: Set<string>) {
  if (!usedProjectIds.has(baseId)) {
    usedProjectIds.add(baseId)
    return baseId
  }

  let index = 2
  let nextId = `${baseId}-${index}`

  while (usedProjectIds.has(nextId)) {
    index += 1
    nextId = `${baseId}-${index}`
  }

  usedProjectIds.add(nextId)
  return nextId
}

function createWorkspaceSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}`
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "saved-project"
}

function uniqueProjectId(baseId: string, projects: WorkspaceProject[]) {
  const existingIds = new Set(projects.map((project) => project.id))

  if (!existingIds.has(baseId)) {
    return baseId
  }

  let index = 2
  let nextId = `${baseId}-${index}`

  while (existingIds.has(nextId)) {
    index += 1
    nextId = `${baseId}-${index}`
  }

  return nextId
}

function deriveSessionTitle(session: WorkspaceSession, messages: UIMessage[]) {
  if (!isDefaultSessionTitle(session.title)) {
    return session.title
  }

  const firstUserText = messages
    .find((message) => message.role === "user")
    ?.parts.find((part) => part.type === "text")?.text

  return firstUserText ? makeTitleFromPrompt(firstUserText) : session.title
}

function isDefaultSessionTitle(title: string) {
  return title === "临时会话" || /^会话\d+$/.test(title)
}

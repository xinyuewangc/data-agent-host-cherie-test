const PENDING_SESSION_PROMPT_PREFIX = "data-agent-pending-session-prompt:"

export function getPendingSessionPromptKey(sessionId: string) {
  return `${PENDING_SESSION_PROMPT_PREFIX}${sessionId}`
}

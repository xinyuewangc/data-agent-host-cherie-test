import { WorkspaceSessionPage } from "@/components/workspace-session-page"

export default async function ProjectSessionPage({
  params,
}: {
  params: Promise<{ projectId: string; sessionId: string }>
}) {
  const { projectId, sessionId } = await params

  return (
    <WorkspaceSessionPage
      projectId={decodeURIComponent(projectId)}
      sessionId={decodeURIComponent(sessionId)}
    />
  )
}

import { WorkspaceSessionPage } from "@/components/workspace-session-page"

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  return <WorkspaceSessionPage sessionId={decodeURIComponent(sessionId)} />
}

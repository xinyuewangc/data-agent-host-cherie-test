import { WorkspaceProjectPage } from "@/components/workspace-project-page"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  return <WorkspaceProjectPage projectId={decodeURIComponent(projectId)} />
}

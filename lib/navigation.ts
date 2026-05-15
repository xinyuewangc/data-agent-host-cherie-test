import { getOfficialAssetById } from "@/lib/official-assets"

export const appRoutes = {
  newSession: {
    path: "/sessions/new",
    title: "新建会话",
    description:
      "发起新的 Agent 会话，后续用于查询、加工企业内部明细表并生成结果。",
    breadcrumbs: ["新建会话"],
  },
  search: {
    path: "/search",
    title: "搜索",
    description: "搜索企业内部可用的数据资产、历史会话和已保存的 project。",
    breadcrumbs: ["搜索"],
  },
  officialAssets: {
    path: "/assets/official",
    title: "官方数据资产",
    description: "浏览数仓提供的数据源和数据表，后续可从这里引用资产发起会话。",
    breadcrumbs: ["官方数据资产"],
  },
  myAssets: {
    path: "/assets/my",
    title: "我的数据资产",
    description: "展示用户保存后的数据资产入口，当前每个 folder 对应一条会话。",
    breadcrumbs: ["我的数据资产"],
  },
  requirements: {
    path: "/assets/my/requirements",
    title: "需求明细",
    description: "已保存的数据资产 project，占位展示后续 project 工作区入口。",
    breadcrumbs: ["我的数据资产", "需求明细"],
  },
  requirementsSession1: {
    path: "/assets/my/requirements/session-1",
    title: "会话1",
    description: "需求明细 project 下的第一个历史会话。",
    breadcrumbs: ["我的数据资产", "需求明细", "会话1"],
  },
  requirementsSession2: {
    path: "/assets/my/requirements/session-2",
    title: "会话2",
    description: "需求明细 project 下的第二个历史会话。",
    breadcrumbs: ["我的数据资产", "需求明细", "会话2"],
  },
  requirementsSession3: {
    path: "/assets/my/requirements/session-3",
    title: "会话3",
    description: "需求明细 project 下的第三个历史会话。",
    breadcrumbs: ["我的数据资产", "需求明细", "会话3"],
  },
  budgetFunnel: {
    path: "/assets/my/budget-funnel",
    title: "预算漏斗",
    description: "已保存的数据资产 project，占位展示后续 project 工作区入口。",
    breadcrumbs: ["我的数据资产", "预算漏斗"],
  },
  budgetFunnelSession1: {
    path: "/assets/my/budget-funnel/session-1",
    title: "会话1",
    description: "预算漏斗 project 下的第一个历史会话。",
    breadcrumbs: ["我的数据资产", "预算漏斗", "会话1"],
  },
  budgetFunnelSession2: {
    path: "/assets/my/budget-funnel/session-2",
    title: "会话2",
    description: "预算漏斗 project 下的第二个历史会话。",
    breadcrumbs: ["我的数据资产", "预算漏斗", "会话2"],
  },
  budgetFunnelSession3: {
    path: "/assets/my/budget-funnel/session-3",
    title: "会话3",
    description: "预算漏斗 project 下的第三个历史会话。",
    breadcrumbs: ["我的数据资产", "预算漏斗", "会话3"],
  },
  requestExecution: {
    path: "/assets/my/request-execution",
    title: "需求单执行情况",
    description: "已保存的数据资产 project，占位展示后续 project 工作区入口。",
    breadcrumbs: ["我的数据资产", "需求单执行情况"],
  },
  requestExecutionSession1: {
    path: "/assets/my/request-execution/session-1",
    title: "会话1",
    description: "需求单执行情况 project 下的第一个历史会话。",
    breadcrumbs: ["我的数据资产", "需求单执行情况", "会话1"],
  },
  requestExecutionSession2: {
    path: "/assets/my/request-execution/session-2",
    title: "会话2",
    description: "需求单执行情况 project 下的第二个历史会话。",
    breadcrumbs: ["我的数据资产", "需求单执行情况", "会话2"],
  },
  requestExecutionSession3: {
    path: "/assets/my/request-execution/session-3",
    title: "会话3",
    description: "需求单执行情况 project 下的第三个历史会话。",
    breadcrumbs: ["我的数据资产", "需求单执行情况", "会话3"],
  },
  sessions: {
    path: "/sessions",
    title: "会话",
    description:
      "集中查看尚未保存为 project 的临时会话，以及从官方资产发起的会话。",
    breadcrumbs: ["会话"],
  },
  tempSession1: {
    path: "/sessions/temp-1",
    title: "临时会话1",
    description: "尚未保存为 project 的临时 Agent 会话。",
    breadcrumbs: ["会话", "临时会话1"],
  },
  tempSession2: {
    path: "/sessions/temp-2",
    title: "临时会话2",
    description: "尚未保存为 project 的临时 Agent 会话。",
    breadcrumbs: ["会话", "临时会话2"],
  },
  tempSession3: {
    path: "/sessions/temp-3",
    title: "临时会话3",
    description: "尚未保存为 project 的临时 Agent 会话。",
    breadcrumbs: ["会话", "临时会话3"],
  },
  mcp: {
    path: "/settings/mcp",
    title: "MCP",
    description: "管理 Agent Host 可连接的 MCP 服务配置。",
    breadcrumbs: ["配置调试", "MCP"],
  },
  skills: {
    path: "/settings/skills",
    title: "Skills",
    description: "管理 Agent 可调用的技能配置。",
    breadcrumbs: ["配置调试", "Skills"],
  },
} as const

export type AppRouteKey = keyof typeof appRoutes
export type AppRoutePath = (typeof appRoutes)[AppRouteKey]["path"]

export function getRouteByPath(pathname: string) {
  if (pathname.startsWith("/assets/official/")) {
    const assetId = pathname.split("/")[3]
    const asset = assetId ? getOfficialAssetById(assetId) : undefined

    return {
      ...appRoutes.officialAssets,
      title: asset?.name ?? appRoutes.officialAssets.title,
      breadcrumbs: ["官方数据资产", asset?.name ?? "数据详情"],
    }
  }

  return (
    Object.values(appRoutes).find((route) => route.path === pathname) ??
    appRoutes.newSession
  )
}

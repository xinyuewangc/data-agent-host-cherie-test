import type { UIMessage } from "ai"

export type WorkspaceProject = {
  id: string
  title: string
  description: string
  sessionIds: string[]
}

export type WorkspaceSession = {
  id: string
  routeSegment: string
  title: string
  createdAt: string
  updatedAt: string
  isTemporary: boolean
  projectId?: string
  messages: UIMessage[]
}

export type WorkspaceState = {
  version: number
  projects: WorkspaceProject[]
  sessions: Record<string, WorkspaceSession>
  temporarySessionIds: string[]
}

export const WORKSPACE_STATE_VERSION = 2

export const initialWorkspaceState: WorkspaceState = {
  version: WORKSPACE_STATE_VERSION,
  projects: [
    {
      id: "requirements",
      title: "需求明细",
      description: "需求明细表、负责人、状态与超期风险分析。",
      sessionIds: [
        "requirements-session-1",
        "requirements-session-2",
        "requirements-session-3",
      ],
    },
    {
      id: "budget-funnel",
      title: "预算漏斗",
      description: "预算申请、审批、冻结、消耗与转化漏斗分析。",
      sessionIds: [
        "budget-funnel-session-1",
        "budget-funnel-session-2",
        "budget-funnel-session-3",
      ],
    },
    {
      id: "request-execution",
      title: "需求单执行情况",
      description: "需求单执行 SLA、部门完成率与阻塞原因归因。",
      sessionIds: [
        "request-execution-session-1",
        "request-execution-session-2",
        "request-execution-session-3",
      ],
    },
  ],
  temporarySessionIds: ["temp-1", "temp-2", "temp-3"],
  sessions: {
    "temp-1": temporarySession({
      id: "temp-1",
      title: "今日主体资金余额",
      user: "帮我查一下今日各主体资金余额，并生成表格",
      assistant:
        "可以。当前 mock 结果建议按主体、币种、可用余额、冻结余额、日环比、更新时间输出，并把余额低于阈值的主体置顶。",
    }),
    "temp-2": temporarySession({
      id: "temp-2",
      title: "需求明细异常记录",
      user: "把需求明细里的异常记录找出来",
      assistant:
        "已按超期未闭环、负责人缺失、状态回退、重复提交四类整理异常。mock 数据中超期未闭环占比最高，建议优先追踪 7 天以上未更新记录。",
    }),
    "temp-3": temporarySession({
      id: "temp-3",
      title: "预算漏斗执行摘要",
      user: "基于预算漏斗数据生成一份执行摘要",
      assistant:
        "预算从申请到消耗的主要损耗点集中在审批等待和冻结释放阶段。建议将高金额、长等待的预算单拆成待审批、待释放、待核销三张表跟进。",
    }),
    "requirements-session-1": projectSession({
      id: "requirements-session-1",
      projectId: "requirements",
      routeSegment: "session-1",
      title: "高优需求超期定位",
      user: "筛出 P0/P1 需求里超期且未闭环的记录，按负责人汇总。",
      assistant:
        "mock 汇总：P0/P1 超期未闭环 18 条，集中在数据接入、权限审批、口径确认三类。负责人维度 Top3 分别为 A 组 7 条、B 组 5 条、C 组 3 条。",
    }),
    "requirements-session-2": projectSession({
      id: "requirements-session-2",
      projectId: "requirements",
      routeSegment: "session-2",
      title: "需求来源占比",
      user: "统计本月需求来源占比，并找出增长最快的来源。",
      assistant:
        "mock 结果：业务运营 42%、财务分析 28%、项目管理 18%、其他 12%。增长最快的是财务分析类需求，环比提升 9 个百分点。",
    }),
    "requirements-session-3": projectSession({
      id: "requirements-session-3",
      projectId: "requirements",
      routeSegment: "session-3",
      title: "负责人待办排行",
      user: "按负责人统计待处理需求数、平均等待天数和最早创建时间。",
      assistant:
        "mock 结果显示待办集中在 5 位负责人名下，其中两位平均等待超过 6 天。建议对等待天数超过 5 天的需求自动触发提醒。",
    }),
    "budget-funnel-session-1": projectSession({
      id: "budget-funnel-session-1",
      projectId: "budget-funnel",
      routeSegment: "session-1",
      title: "预算漏斗转化分析",
      user: "从申请、审批、冻结到消耗，统计每个环节的转化率。",
      assistant:
        "mock 漏斗：申请 100%，审批通过 76%，冻结成功 63%，实际消耗 51%。最大流失点在审批到冻结，建议补充审批驳回原因字段。",
    }),
    "budget-funnel-session-2": projectSession({
      id: "budget-funnel-session-2",
      projectId: "budget-funnel",
      routeSegment: "session-2",
      title: "冻结预算原因追踪",
      user: "找出冻结预算超过 14 天仍未释放或消耗的记录。",
      assistant:
        "mock 结果：超过 14 天的冻结预算 23 笔，金额主要集中在渠道投放和联运结算。建议按金额降序人工复核前 10 笔。",
    }),
    "budget-funnel-session-3": projectSession({
      id: "budget-funnel-session-3",
      projectId: "budget-funnel",
      routeSegment: "session-3",
      title: "渠道预算消耗预警",
      user: "检查渠道预算消耗进度，标出低于计划进度 20% 的渠道。",
      assistant:
        "mock 预警：渠道 C、渠道 F、渠道 H 消耗显著低于计划。渠道 C 预算大但投放启动晚，建议拆分展示启动延迟和转化偏低两类原因。",
    }),
    "request-execution-session-1": projectSession({
      id: "request-execution-session-1",
      projectId: "request-execution",
      routeSegment: "session-1",
      title: "需求单执行 SLA",
      user: "统计需求单从创建到完成的 SLA 达成率，按部门拆分。",
      assistant:
        "mock SLA 达成率 83%。研发支持、数据平台、财务分析三个部门中，数据平台达成率最低，主要原因是上游表权限等待。",
    }),
    "request-execution-session-2": projectSession({
      id: "request-execution-session-2",
      projectId: "request-execution",
      routeSegment: "session-2",
      title: "部门完成率对比",
      user: "按部门统计本月需求单完成率、进行中数量和阻塞数量。",
      assistant:
        "mock 对比：财务分析完成率 91%，研发支持 84%，数据平台 72%。数据平台阻塞数量最高，建议进一步拆出阻塞归因。",
    }),
    "request-execution-session-3": projectSession({
      id: "request-execution-session-3",
      projectId: "request-execution",
      routeSegment: "session-3",
      title: "阻塞原因归类",
      user: "把所有阻塞中的需求单按原因归类，并给出处理建议。",
      assistant:
        "mock 阻塞原因：权限等待 38%、口径未确认 27%、排期冲突 21%、数据缺失 14%。建议把权限等待类自动同步到 MCP 权限申请流。",
    }),
  },
}

export function makeTitleFromPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim()

  if (!normalized) {
    return "临时会话"
  }

  return normalized.length > 18 ? `${normalized.slice(0, 18)}...` : normalized
}

export function createTextMessage(
  id: string,
  role: "user" | "assistant",
  text: string
): UIMessage {
  return {
    id,
    role,
    parts: [{ type: "text", text }],
  }
}

function temporarySession({
  id,
  title,
  user,
  assistant,
}: {
  id: string
  title: string
  user: string
  assistant: string
}): WorkspaceSession {
  return {
    id,
    routeSegment: id,
    title,
    createdAt: "2026-05-11T09:00:00.000Z",
    updatedAt: "2026-05-11T09:15:00.000Z",
    isTemporary: true,
    messages: [
      createTextMessage(`${id}-user`, "user", user),
      createTextMessage(`${id}-assistant`, "assistant", assistant),
    ],
  }
}

function projectSession({
  id,
  projectId,
  routeSegment,
  title,
  user,
  assistant,
}: {
  id: string
  projectId: string
  routeSegment: string
  title: string
  user: string
  assistant: string
}): WorkspaceSession {
  return {
    id,
    projectId,
    routeSegment,
    title,
    createdAt: "2026-05-11T09:00:00.000Z",
    updatedAt: "2026-05-11T09:15:00.000Z",
    isTemporary: false,
    messages: [
      createTextMessage(`${id}-user`, "user", user),
      createTextMessage(`${id}-assistant`, "assistant", assistant),
    ],
  }
}

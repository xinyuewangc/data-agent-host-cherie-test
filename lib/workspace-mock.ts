import type { UIMessage } from "ai"

export type WorkspaceProject = {
  id: string
  title: string
  description: string
  isMcpShared?: boolean
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

export const WORKSPACE_STATE_VERSION = 4

export const initialWorkspaceState: WorkspaceState = {
  version: WORKSPACE_STATE_VERSION,
  projects: [
    {
      id: "requirements-overdue",
      title: "高优需求超期定位",
      description: "筛出 P0/P1 需求里超期且未闭环的负责人汇总。",
      sessionIds: ["requirements-session-1"],
    },
    {
      id: "requirements-source-share",
      title: "需求来源占比",
      description: "统计本月需求来源占比，并找出增长最快的来源。",
      sessionIds: ["requirements-session-2"],
    },
    {
      id: "owner-todo-ranking",
      title: "负责人待办排行",
      description: "按负责人统计待处理需求数、平均等待天数和最早创建时间。",
      sessionIds: ["requirements-session-3"],
    },
    {
      id: "budget-funnel-conversion",
      title: "预算漏斗转化分析",
      description: "从申请、审批、冻结到消耗统计每个环节的转化率。",
      sessionIds: ["budget-funnel-session-1"],
    },
    {
      id: "frozen-budget-trace",
      title: "冻结预算原因追踪",
      description: "找出冻结预算超过 14 天仍未释放或消耗的记录。",
      sessionIds: ["budget-funnel-session-2"],
    },
    {
      id: "channel-budget-warning",
      title: "渠道预算消耗预警",
      description: "检查渠道预算消耗进度，标出低于计划进度 20% 的渠道。",
      sessionIds: ["budget-funnel-session-3"],
    },
    {
      id: "request-execution-sla",
      title: "需求单执行 SLA",
      description: "统计需求单从创建到完成的 SLA 达成率，按部门拆分。",
      sessionIds: ["request-execution-session-1"],
    },
    {
      id: "department-completion-rate",
      title: "部门完成率对比",
      description: "按部门统计本月需求单完成率、进行中数量和阻塞数量。",
      sessionIds: ["request-execution-session-2"],
    },
    {
      id: "blocker-reason-classification",
      title: "阻塞原因归类",
      description: "把所有阻塞中的需求单按原因归类，并给出处理建议。",
      sessionIds: ["request-execution-session-3"],
    },
  ],
  temporarySessionIds: ["temp-1", "temp-2", "temp-3"],
  sessions: {
    "temp-1": temporarySession({
      id: "temp-1",
      title: "今日主体资金余额",
      messages: [
        ["user", "帮我查一下今日各主体资金余额，并生成表格。"],
        [
          "assistant",
          "我先按主体维度整理，默认带上币种、可用余额、冻结余额、日环比和更新时间。你如果后面要继续排查，也可以再切到账户级明细。",
        ],
        ["user", "可以，先给我一个能继续筛选和导出的版本。"],
        [
          "assistant",
          "已生成右侧结果：`明细表` 里包含筛选区、结果表和数据处理过程，`可视化图表` 会基于同一份余额明细同步展示结构变化。",
        ],
      ],
    }),
    "temp-2": temporarySession({
      id: "temp-2",
      title: "需求明细异常记录",
      messages: [
        ["user", "把需求明细里的异常记录找出来。"],
        [
          "assistant",
          "我先按超期未闭环、负责人缺失、状态回退和重复提交四类异常整理，可以同时把等待时长和当前负责人也带出来。",
        ],
        ["user", "行，右侧给我异常明细和处理过程。"],
        [
          "assistant",
          "已生成右侧结果：包含异常记录明细表、异常图表表达，以及异常筛选、表格导出和数据处理过程说明。当前超期未闭环仍然是占比最高的一类。",
        ],
      ],
    }),
    "temp-3": temporarySession({
      id: "temp-3",
      title: "预算漏斗执行摘要",
      messages: [
        ["user", "基于预算漏斗数据生成一份执行摘要。"],
        [
          "assistant",
          "我会先把申请、审批、冻结、消耗四个阶段整理成一份可追问的明细，再从这份明细里提炼转化和损耗重点。",
        ],
        ["user", "可以，摘要里也帮我指出主要损耗环节。"],
        [
          "assistant",
          "已生成右侧结果：包含预算漏斗明细表、可视化转化表达和数据处理过程。当前损耗主要集中在审批等待与冻结释放阶段，后续可以继续追问单笔预算明细。",
        ],
      ],
    }),
    "requirements-session-1": projectSession({
      id: "requirements-session-1",
      projectId: "requirements-overdue",
      routeSegment: "session-1",
      title: "高优需求超期定位",
      messages: [
        ["user", "筛出 P0/P1 需求里超期且未闭环的记录，按负责人汇总。"],
        [
          "assistant",
          "我先按 P0/P1 + 未闭环口径筛，再补等待时长、阻塞原因和负责人组别，这样右侧结果能继续下钻到具体需求。",
        ],
        ["user", "可以，把未分配的也单独显出来。"],
        [
          "assistant",
          "已生成右侧结果：`明细表` 里有超期需求筛选、表格和数据处理过程，`可视化图表` 会把同一份结果按负责人做对比。当前 mock 汇总 18 条，未分配记录已单独突出。",
        ],
      ],
    }),
    "requirements-session-2": projectSession({
      id: "requirements-session-2",
      projectId: "requirements-source-share",
      routeSegment: "session-2",
      title: "需求来源占比",
      messages: [
        ["user", "统计本月需求来源占比，并找出增长最快的来源。"],
        [
          "assistant",
          "我先按自然月口径看提单来源，并统一归类成业务运营、财务分析、项目管理、其他四类。你如果需要，我也可以顺手把高优需求数一起带上。",
        ],
        ["user", "带上吧，右侧先给我明细表，我后面要切图表继续看。"],
        [
          "assistant",
          "已生成右侧结果：`明细表` 包含来源筛选、来源-模块表格和数据处理过程，`可视化图表` 会复用同一份明细做来源占比表达。当前 mock 结果里财务分析增长最快，环比提升 9 个百分点。",
        ],
      ],
    }),
    "requirements-session-3": projectSession({
      id: "requirements-session-3",
      projectId: "owner-todo-ranking",
      routeSegment: "session-3",
      title: "负责人待办排行",
      messages: [
        ["user", "按负责人统计待处理需求数、平均等待天数和最早创建时间。"],
        [
          "assistant",
          "我会先按未完成需求取数，再按负责人汇总待办数和平均等待。你如果希望后面做跟进，也可以把高优需求数和阻塞数一起保留在右侧结果里。",
        ],
        ["user", "要，加上。未分配也单独看。"],
        [
          "assistant",
          "已生成右侧结果：`明细表` 里有负责人筛选、待办排行表和处理过程，`可视化图表` 是这份排行明细的另一种展示。当前有 2 位负责人平均等待超过 6 天，未分配也已单独标记。",
        ],
      ],
    }),
    "budget-funnel-session-1": projectSession({
      id: "budget-funnel-session-1",
      projectId: "budget-funnel-conversion",
      routeSegment: "session-1",
      title: "预算漏斗转化分析",
      messages: [
        ["user", "从申请、审批、冻结到消耗，统计每个环节的转化率。"],
        [
          "assistant",
          "我先把阶段明细整理出来，再按同一份明细计算转化率和阶段损耗，这样后面可以继续追某个阶段的单据明细。",
        ],
        ["user", "好，把主要损耗环节标出来。"],
        [
          "assistant",
          "已生成右侧结果：包含阶段明细表、阶段转化图表和数据处理过程。当前最大流失点在审批到冻结，建议后续继续展开审批驳回和冻结未执行原因。",
        ],
      ],
    }),
    "budget-funnel-session-2": projectSession({
      id: "budget-funnel-session-2",
      projectId: "frozen-budget-trace",
      routeSegment: "session-2",
      title: "冻结预算原因追踪",
      messages: [
        ["user", "找出冻结预算超过 14 天仍未释放或消耗的记录。"],
        [
          "assistant",
          "我会先按冻结时长做筛选，再保留渠道、金额、当前阶段和风险等级，方便右侧继续筛选和导出。",
        ],
        ["user", "可以，按金额高的排前面。"],
        [
          "assistant",
          "已生成右侧结果：包含冻结预算异常明细表、风险图表和数据处理过程。当前超过 14 天的冻结预算共有 23 笔，已按金额降序整理。",
        ],
      ],
    }),
    "budget-funnel-session-3": projectSession({
      id: "budget-funnel-session-3",
      projectId: "channel-budget-warning",
      routeSegment: "session-3",
      title: "渠道预算消耗预警",
      messages: [
        ["user", "检查渠道预算消耗进度，标出低于计划进度 20% 的渠道。"],
        [
          "assistant",
          "我会把计划进度、实际进度、偏差和预算规模一起整理出来，这样右侧既能预警，也能继续追某个渠道的明细。",
        ],
        ["user", "好的，帮我把预警渠道优先排前面。"],
        [
          "assistant",
          "已生成右侧结果：包含渠道预警明细表、进度差异图表和处理过程。当前预警渠道是 C、F、H，已优先展示偏差最大的渠道。",
        ],
      ],
    }),
    "request-execution-session-1": projectSession({
      id: "request-execution-session-1",
      projectId: "request-execution-sla",
      routeSegment: "session-1",
      title: "需求单执行 SLA",
      messages: [
        ["user", "统计需求单从创建到完成的 SLA 达成率，按部门拆分。"],
        [
          "assistant",
          "我先按部门整理完成耗时和达成率，再保留主要原因字段，方便低达标部门继续追问题来源。",
        ],
        ["user", "好，低于平均值的部门要能一眼看到。"],
        [
          "assistant",
          "已生成右侧结果：包含部门 SLA 明细表、达成率图表和数据处理过程。当前整体达成率 83%，数据平台已经被标成低于平均值的重点部门。",
        ],
      ],
    }),
    "request-execution-session-2": projectSession({
      id: "request-execution-session-2",
      projectId: "department-completion-rate",
      routeSegment: "session-2",
      title: "部门完成率对比",
      messages: [
        ["user", "按部门统计本月需求单完成率、进行中数量和阻塞数量。"],
        [
          "assistant",
          "我会把完成率、进行中数量和阻塞数量放在同一份部门明细里，这样右侧可以直接筛出高阻塞部门。",
        ],
        ["user", "好，后面我可能还要继续看阻塞原因。"],
        [
          "assistant",
          "已生成右侧结果：包含部门完成率明细表、对比图表和数据处理过程。当前数据平台完成率最低且阻塞数最高，适合继续下钻阻塞归因。",
        ],
      ],
    }),
    "request-execution-session-3": projectSession({
      id: "request-execution-session-3",
      projectId: "blocker-reason-classification",
      routeSegment: "session-3",
      title: "阻塞原因归类",
      messages: [
        ["user", "把所有阻塞中的需求单按原因归类，并给出处理建议。"],
        [
          "assistant",
          "我先把阻塞原因统一归类，再整理成可继续筛选的明细表，这样你后面能直接只看某一类阻塞。",
        ],
        ["user", "行，建议动作也一起带出来。"],
        [
          "assistant",
          "已生成右侧结果：包含阻塞原因明细表、结构图表和数据处理过程。当前权限等待占比最高，建议动作已经一并放入结果中。",
        ],
      ],
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
  messages,
}: {
  id: string
  title: string
  user?: string
  assistant?: string
  messages?: Array<[role: "user" | "assistant", text: string]>
}): WorkspaceSession {
  return {
    id,
    routeSegment: id,
    title,
    createdAt: "2026-05-11T09:00:00.000Z",
    updatedAt: "2026-05-11T09:15:00.000Z",
    isTemporary: true,
    messages: createSessionMessages(id, messages, user, assistant),
  }
}

function projectSession({
  id,
  projectId,
  routeSegment,
  title,
  user,
  assistant,
  messages,
}: {
  id: string
  projectId: string
  routeSegment: string
  title: string
  user?: string
  assistant?: string
  messages?: Array<[role: "user" | "assistant", text: string]>
}): WorkspaceSession {
  return {
    id,
    projectId,
    routeSegment,
    title,
    createdAt: "2026-05-11T09:00:00.000Z",
    updatedAt: "2026-05-11T09:15:00.000Z",
    isTemporary: false,
    messages: createSessionMessages(id, messages, user, assistant),
  }
}

function createSessionMessages(
  id: string,
  messages: Array<[role: "user" | "assistant", text: string]> | undefined,
  fallbackUser = "",
  fallbackAssistant = ""
) {
  const normalizedMessages =
    messages ??
    ([
      ["user", fallbackUser],
      ["assistant", fallbackAssistant],
    ] as Array<[role: "user" | "assistant", text: string]>)

  return normalizedMessages.map(([role, text], index) =>
    createTextMessage(`${id}-${role}-${index + 1}`, role, text)
  )
}

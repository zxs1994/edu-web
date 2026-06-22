import { BpmProcessInstanceStatus } from '@vben/constants';

/**
 * OA/HRM 列表页详情页路由解析器
 *
 * 当单据流程状态为 RUNNING（审批中）时，跳转到 BPM 详情页（带审批按钮）；
 * 否则跳转到 OA info 页（仅查看）。
 *
 * 用法：
 * 1. 在 data.ts 的 createRouterLinkColumn 中传入 resolveRoute
 * 2. 在 index.vue 的 handleDetail 中使用 resolveOaDetailRoute
 */

/** BPM 详情页路由路径 */
const BPM_DETAIL_PATH = '/bpm/process-instance/detail';

/**
 * createRouterLinkColumn 的 resolveRoute 回调
 * 当 processStatus === RUNNING 且有 processInstanceId 时，跳 BPM 详情页
 */
export function resolveOaDetailRoute(oaInfoPath: string) {
  return (row: any) => {
    if (
      row.processStatus === BpmProcessInstanceStatus.RUNNING &&
      row.processInstanceId
    ) {
      return {
        path: BPM_DETAIL_PATH,
        query: { id: row.processInstanceId },
      };
    }
    return {
      path: oaInfoPath,
      query: { id: row.id },
    };
  };
}

/**
 * handleDetail 使用的路由解析函数
 * 根据行数据决定跳转到 BPM 详情页还是 OA info 页
 */
export function getOaDetailRoute(
  row: any,
  oaInfoPath: string,
): { path: string; query: Record<string, any> } {
  if (
    row.processStatus === BpmProcessInstanceStatus.RUNNING &&
    row.processInstanceId
  ) {
    return {
      path: BPM_DETAIL_PATH,
      query: { id: row.processInstanceId },
    };
  }
  return {
    path: oaInfoPath,
    query: { id: row.id },
  };
}

/** 报销单列表：按 billType 解析详情路由（1=日常报销，其他=差旅报销） */
export function resolveExpenseDetailRoute(row: any) {
  const oaInfoPath =
    row.billType === 1
      ? '/oa/expense-travel/daily-expense-info'
      : '/oa/expense-travel/expense-reimburse-info';
  return resolveOaDetailRoute(oaInfoPath)(row);
}

export function getExpenseDetailRoute(row: any) {
  const oaInfoPath =
    row.billType === 1
      ? '/oa/expense-travel/daily-expense-info'
      : '/oa/expense-travel/expense-reimburse-info';
  return getOaDetailRoute(row, oaInfoPath);
}

const TRAVEL_APPLY_INFO_PATH = '/oa/expense-travel/travel-apply-info';

/** 差旅申请列表详情路由 */
export function resolveTravelDetailRoute(row: any) {
  return resolveOaDetailRoute(TRAVEL_APPLY_INFO_PATH)(row);
}

export function getTravelDetailRoute(row: any) {
  return getOaDetailRoute(row, TRAVEL_APPLY_INFO_PATH);
}

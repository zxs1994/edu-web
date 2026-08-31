import { BpmProcessInstanceStatus } from '@vben/constants';

/**
 * 业务列表页详情路由解析器
 *
 * 当单据流程状态为 RUNNING（审批中）时，跳转到 BPM 详情页；
 * 否则跳转到业务 info 页。
 */

/** BPM 详情页路由路径 */
const BPM_DETAIL_PATH = '/bpm/process-instance/detail';

/**
 * createRouterLinkColumn 的 resolveRoute 回调
 */
export function resolveOaDetailRoute(infoPath: string) {
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
      path: infoPath,
      query: { id: row.id },
    };
  };
}

/**
 * handleDetail 使用的路由解析函数
 */
export function getOaDetailRoute(
  row: any,
  infoPath: string,
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
    path: infoPath,
    query: { id: row.id },
  };
}

import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';

/** 流程定义 key → 业务单据详情路由（OA 业务已移除，仅保留可扩展映射） */
export const PROCESS_KEY_INFO_PATH: Record<string, string> = {};

/**
 * 「我的流程」列表行 → 详情路由
 */
export function getProcessInstanceMyDetailRoute(
  row: BpmProcessInstanceApi.ProcessInstance,
) {
  if (row.presidentCorrectionAwaitingResubmit && row.businessKey) {
    const processKey = row.processDefinition?.key;
    const infoPath =
      row.processDefinition?.formCustomCreatePath ||
      (processKey ? PROCESS_KEY_INFO_PATH[processKey] : undefined);
    if (infoPath) {
      return {
        path: infoPath,
        query: { id: row.businessKey },
      };
    }
  }
  return {
    name: 'BpmProcessInstanceDetail',
    query: { id: String(row.id), isTodo: 'false' },
  };
}

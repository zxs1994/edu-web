import { PROCESS_KEY_INFO_PATH } from '#/utils/bpm-process-instance-route';

/** 是否为会长纠错待重提待办（todo-page 合并项，非 Flowable 任务） */
export function isPresidentCorrectionResubmitTodo(row: {
  presidentCorrectionResubmitTodo?: boolean;
}): boolean {
  return row.presidentCorrectionResubmitTodo === true;
}

/** 会长纠错待重提：跳转原业务单据详情 */
export function getPresidentCorrectionResubmitTodoRoute(row: {
  presidentCorrectionResubmitTodo?: boolean;
  sourceBillId?: number;
  sourceBillType?: string;
}) {
  if (!isPresidentCorrectionResubmitTodo(row)) {
    return null;
  }
  const billId = row.sourceBillId;
  const processKey = row.sourceBillType;
  if (!billId || !processKey) {
    return null;
  }
  const infoPath = PROCESS_KEY_INFO_PATH[processKey];
  if (!infoPath) {
    return null;
  }
  return {
    path: infoPath,
    query: { id: String(billId) },
  };
}

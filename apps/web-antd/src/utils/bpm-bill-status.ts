import { isPresidentCorrectionResubmitTodo } from '#/utils/bpm-correction-resubmit-todo';

export type TaskBillStatusTab = 'copy' | 'done' | 'myBill' | 'todo';

export type TaskBillStatusColor =
  | 'default'
  | 'error'
  | 'processing'
  | 'success'
  | 'warning';

export type TaskBillStatusMeta = {
  color: TaskBillStatusColor;
  label: string;
};

/** 判断流程关联业务单据是否已删除 */
export function isBillDeleted(record: any): boolean {
  if (!record) {
    return false;
  }
  if (record.billDeleted === true) {
    return true;
  }
  if (record.processInstance?.billDeleted === true) {
    return true;
  }
  return false;
}

/** 任务列表审批状态 Tag 元数据 */
export function getTaskBillStatusMeta(
  record: any,
  tab: TaskBillStatusTab,
): TaskBillStatusMeta {
  if (isBillDeleted(record)) {
    return { label: '已删除', color: 'default' };
  }
  if (tab === 'copy') {
    return { label: '已抄送', color: 'processing' };
  }
  if (tab === 'todo') {
    if (isPresidentCorrectionResubmitTodo(record)) {
      return { label: '待重提', color: 'warning' };
    }
    if (record?.status === 3 || record?.processInstance?.status === 3) {
      return { label: '有驳回', color: 'error' };
    }
    return { label: '待处理', color: 'processing' };
  }
  const status = record.status;
  const statusMap: Record<number, TaskBillStatusMeta> = {
    [-1]: { label: '未提交', color: 'default' },
    1: { label: '审批中', color: 'processing' },
    2: { label: '已通过', color: 'success' },
    3: { label: '未通过', color: 'error' },
    4: { label: '已取消', color: 'warning' },
  };
  return statusMap[status] ?? { label: '-', color: 'default' };
}

/** 任务列表审批状态文案 */
export function formatTaskBillStatus(
  record: any,
  tab: TaskBillStatusTab,
): string {
  return getTaskBillStatusMeta(record, tab).label;
}

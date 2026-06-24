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

/** 任务列表审批状态文案 */
export function formatTaskBillStatus(
  record: any,
  tab: 'copy' | 'done' | 'myBill' | 'todo',
): string {
  if (isBillDeleted(record)) {
    return '已删除';
  }
  if (tab === 'copy') {
    return '已抄送';
  }
  if (tab === 'todo') {
    return '待处理';
  }
  const status = tab === 'myBill' ? record.status : record.status;
  const statusMap: Record<number, string> = {
    [-1]: '未提交',
    1: '审批中',
    2: '已通过',
    3: '未通过',
    4: '已取消',
  };
  return statusMap[status] ?? '-';
}

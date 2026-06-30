import { BpmProcessInstanceStatus } from '@vben/constants';

/** 会长纠错展示层叠加标签文案 */
export const PRESIDENT_CORRECTION_DISPLAY_LABEL = '会长异议/纠错';

/** 列表/我的流程：是否仅展示「会长异议/纠错」（未重新发起） */
export function shouldShowPresidentCorrectionStatusOnly(row: {
  presidentCorrectionAwaitingResubmit?: boolean;
  presidentCorrectionDisplay?: boolean;
  processStatus?: number | null;
  status?: number | null;
}) {
  if (row.presidentCorrectionAwaitingResubmit != null) {
    return row.presidentCorrectionAwaitingResubmit === true;
  }
  if (!row.presidentCorrectionDisplay) {
    return false;
  }
  const status = row.processStatus ?? row.status;
  return status == null || status === BpmProcessInstanceStatus.NOT_START;
}

/** 列表状态列：解析应展示的状态字典值 */
export function resolveBillListStatusValue(row: {
  presidentCorrectionAwaitingResubmit?: boolean;
  presidentCorrectionDisplay?: boolean;
  processStatus?: number | null;
  status?: number | null;
}) {
  if (shouldShowPresidentCorrectionStatusOnly(row)) {
    return undefined;
  }
  return row.processStatus ?? row.status;
}

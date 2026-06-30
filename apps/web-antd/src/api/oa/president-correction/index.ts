import { requestClient } from '#/api/request';
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';
import type { PageParam, PageResult } from '@vben/request';

export namespace PresidentCorrectionApi {
  export interface InitiateReq {
    sourceBillType: string;
    sourceBillId: number;
    correctionType: number;
    correctionReason: string;
    councilDecision?: number;
    councilDecisionFile?: string;
    correctionResult?: string;
  }

  export interface BillHistoryItem {
    correctionId: number;
    approvalVersion?: number;
    correctionType: number;
    correctionReason?: string;
    revokeUserName?: string;
    revokeTime?: string;
    sourceProcessInstanceId?: string;
    newProcessInstanceId?: string;
    correctionStatus?: number;
    correctionResult?: string;
    councilDecisionFile?: string;
  }

  export interface BillHistory {
    freezeStatus?: number;
    correctionStatus?: number;
    items?: BillHistoryItem[];
  }
}

export function initiatePresidentCorrection(
  data: PresidentCorrectionApi.InitiateReq,
) {
  return requestClient.post<number>('/oa/president-correction/initiate', data);
}

/** 会长纠错 - 可纠错流程实例分页 */
export function getPresidentCorrectionPage(params: PageParam) {
  return requestClient.get<PageResult<BpmProcessInstanceApi.ProcessInstance>>(
    '/bpm/process-instance/president-correction-page',
    { params },
  );
}

/** 业务单据纠错历史（审批页展示） */
export function getBillCorrectionHistory(params: {
  sourceBillId: number;
  sourceBillType: string;
}) {
  return requestClient.get<PresidentCorrectionApi.BillHistory>(
    '/oa/president-correction/bill-history',
    { params },
  );
}

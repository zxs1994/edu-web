import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace CorrectionBillApi {
  export interface CorrectionBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    sourceBillProcessStatus?: number;
    presidentCorrectionDisplay?: boolean;
    presidentCorrectionAwaitingResubmit?: boolean;
    sourceBillType: string;
    sourceBillId: number;
    sourceBillCode: string;
    sourceBillTitle: string;
    correctionReason: string;
    councilDecision: number;
    councilDecisionFile: string;
    correctionResult: string;
    freezeStatus?: number;
    creator?: number;
    creatorName?: string;
    companyId: number;
    companyName: string;
    deptId: number;
    deptName: string;
    remark?: string;
    createTime?: Date;
    attachments?: AttachmentApi.AttachmentSaveReq[];
  }

  export interface CorrectionBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    sourceBillType?: number;
    freezeStatus?: number;
    createTime?: Date[];
  }
}

export function getCorrectionBillPage(
  params: CorrectionBillApi.CorrectionBillPageReqVO,
) {
  return requestClient.get<PageResult<CorrectionBillApi.CorrectionBill>>(
    '/oa/correction-bill/page',
    { params },
  );
}

export function getCorrectionBill(id: number) {
  return requestClient.get<CorrectionBillApi.CorrectionBill>(
    `/oa/correction-bill/get?id=${id}`,
  );
}

export function saveCorrectionBill(data: CorrectionBillApi.CorrectionBill) {
  return requestClient.post('/oa/correction-bill/save', data);
}

export function submitCorrectionBill(
  data: CorrectionBillApi.CorrectionBill,
) {
  return requestClient.post('/oa/correction-bill/submit', data);
}

export function updateCorrectionBill(
  data: CorrectionBillApi.CorrectionBill,
) {
  return requestClient.put('/oa/correction-bill/update', data);
}

export function deleteCorrectionBill(id: number) {
  return requestClient.delete(`/oa/correction-bill/delete?id=${id}`);
}

export function deleteCorrectionBillList(ids: number[]) {
  return requestClient.delete(
    `/oa/correction-bill/delete-list?ids=${ids.join(',')}`,
  );
}

export function freezeCorrectionBill(id: number) {
  return requestClient.post(`/oa/correction-bill/freeze?id=${id}`);
}

export function unfreezeCorrectionBill(id: number) {
  return requestClient.post(`/oa/correction-bill/unfreeze?id=${id}`);
}

export function exportCorrectionBill(params: any) {
  return requestClient.download('/oa/correction-bill/export-excel', {
    params,
  });
}

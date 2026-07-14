import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace ReceptionApplyBillApi {
  export interface ReceptionApplyBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    presidentCorrectionDisplay?: boolean;
    presidentCorrectionAwaitingResubmit?: boolean;
    cause: string;
    diningTime: string;
    diningStandard: string;
    guestCount: number;
    accompanyCount: number;
    estimatedCost: number;
    creator?: number | string;
    creatorName?: string;
    companyId: number;
    companyName: string;
    deptId?: number;
    deptName?: string;
    createTime?: Date;
    attachments?: AttachmentApi.AttachmentSaveReq[];
  }

  export interface ReceptionApplyBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    cause?: string;
    diningStandard?: string;
    deptName?: string;
    createTime?: Date[];
  }
}

export function getReceptionApplyBillPage(
  params: ReceptionApplyBillApi.ReceptionApplyBillPageReqVO,
) {
  return requestClient.get<PageResult<ReceptionApplyBillApi.ReceptionApplyBill>>(
    '/oa/reception-apply-bill/page',
    { params },
  );
}

export function getReceptionApplyBill(id: number) {
  return requestClient.get<ReceptionApplyBillApi.ReceptionApplyBill>(
    `/oa/reception-apply-bill/get?id=${id}`,
  );
}

export function saveReceptionApplyBill(
  data: ReceptionApplyBillApi.ReceptionApplyBill,
) {
  return requestClient.post('/oa/reception-apply-bill/save', data);
}

export function submitReceptionApplyBill(
  data: ReceptionApplyBillApi.ReceptionApplyBill,
) {
  return requestClient.post('/oa/reception-apply-bill/submit', data);
}

export function deleteReceptionApplyBill(id: number) {
  return requestClient.delete(`/oa/reception-apply-bill/delete?id=${id}`);
}

export function exportReceptionApplyBill(params: Record<string, any>) {
  return requestClient.download('/oa/reception-apply-bill/export-excel', {
    params,
  });
}

export function exportReceptionApplyBillDetail(params: { billType: string; id: number }) {
  return requestClient.download('/oa/bill/export-detail', {
    params,
  });
}

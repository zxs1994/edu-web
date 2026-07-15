import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace TravelApplyBillApi {
  export interface TravelItinerary {
    id?: number;
    billId?: number;
    departureCity: string;
    destinationCity: string;
    startDate: string;
    endDate: string;
    transportType: number;
    remark?: string;
    sortOrder?: number;
    rowKey?: string;
    createTime?: Date;
  }

  export interface TravelApplyBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    presidentCorrectionDisplay?: boolean;
    presidentCorrectionAwaitingResubmit?: boolean;
    cause: string;
    travelStartDate: string;
    travelEndDate: string;
    travelDays: number;
    companion: string;
    travelerCount?: number;
    estimatedCost: number;
    reimbursementStatus?: number;
    travelType?: number;
    creator?: number;
    creatorName?: string;
    companyId: number;
    companyName: string;
    deptId: number;
    deptName: string;
    remark?: string;
    createTime?: Date;
    itineraries?: TravelItinerary[];
    attachments?: AttachmentApi.AttachmentSaveReq[];
  }

  export interface TravelApplyBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    deptName?: string;
    creator?: number | string;
    reimbursementStatus?: number;
    excludeLinkedToExpense?: boolean;
    excludeExpenseBillId?: number;
    createTime?: Date[];
  }
}

export function getTravelApplyBillPage(
  params: TravelApplyBillApi.TravelApplyBillPageReqVO,
) {
  return requestClient.get<PageResult<TravelApplyBillApi.TravelApplyBill>>(
    '/oa/travel-apply-bill/page',
    { params },
  );
}

export function getTravelApplyBill(id: number) {
  return requestClient.get<TravelApplyBillApi.TravelApplyBill>(
    `/oa/travel-apply-bill/get?id=${id}`,
  );
}

export function saveTravelApplyBill(data: TravelApplyBillApi.TravelApplyBill) {
  return requestClient.post('/oa/travel-apply-bill/save', data);
}

export function submitTravelApplyBill(
  data: TravelApplyBillApi.TravelApplyBill,
) {
  return requestClient.post('/oa/travel-apply-bill/submit', data);
}

export function updateTravelApplyBill(
  data: TravelApplyBillApi.TravelApplyBill,
) {
  return requestClient.put('/oa/travel-apply-bill/update', data);
}

export function deleteTravelApplyBill(id: number) {
  return requestClient.delete(`/oa/travel-apply-bill/delete?id=${id}`);
}

export function deleteTravelApplyBillList(ids: number[]) {
  return requestClient.delete(
    `/oa/travel-apply-bill/delete-list?ids=${ids.join(',')}`,
  );
}

export function exportTravelApplyBill(params: any) {
  return requestClient.download('/oa/travel-apply-bill/export-excel', {
    params,
  });
}

export function exportTravelApplyBillDetail(params: { billType: string; id: number }) {
  return requestClient.download('/oa/bill/export-detail', {
    params,
  });
}

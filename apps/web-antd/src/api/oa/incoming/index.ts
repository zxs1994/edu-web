import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace IncomingDocumentBillApi {
  export interface IncomingDocumentBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    presidentCorrectionDisplay?: boolean;
    presidentCorrectionAwaitingResubmit?: boolean;
    docTitle: string;
    docNumber: string;
    secrecyLevel: number;
    receiveDate: string;
    docType: number;
    urgencyLevel: number;
    handlingDeptId: number;
    handlingDeptName: string;
    hostPerson: string;
    leaderInstruction: string;
    handlingResult: string;
    handlingDeadline: string;
    contentSummary: string;
    handlingStatus: number;
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

  export interface IncomingDocumentBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    docTitle?: string;
    docNumber?: string;
    docType?: number;
    handlingStatus?: number;
    createTime?: Date[];
  }
}

export function getIncomingDocumentBillPage(
  params: IncomingDocumentBillApi.IncomingDocumentBillPageReqVO,
) {
  return requestClient.get<
    PageResult<IncomingDocumentBillApi.IncomingDocumentBill>
  >('/oa/incoming-document-bill/page', { params });
}

export function getIncomingDocumentBill(id: number) {
  return requestClient.get<IncomingDocumentBillApi.IncomingDocumentBill>(
    `/oa/incoming-document-bill/get?id=${id}`,
  );
}

export function saveIncomingDocumentBill(
  data: IncomingDocumentBillApi.IncomingDocumentBill,
) {
  return requestClient.post('/oa/incoming-document-bill/save', data);
}

export function submitIncomingDocumentBill(
  data: IncomingDocumentBillApi.IncomingDocumentBill,
) {
  return requestClient.post('/oa/incoming-document-bill/submit', data);
}

export function updateIncomingDocumentBill(
  data: IncomingDocumentBillApi.IncomingDocumentBill,
) {
  return requestClient.put('/oa/incoming-document-bill/update', data);
}

export function deleteIncomingDocumentBill(id: number) {
  return requestClient.delete(`/oa/incoming-document-bill/delete?id=${id}`);
}

export function deleteIncomingDocumentBillList(ids: number[]) {
  return requestClient.delete(
    `/oa/incoming-document-bill/delete-list?ids=${ids.join(',')}`,
  );
}

export function exportIncomingDocumentBill(params: any) {
  return requestClient.download('/oa/incoming-document-bill/export-excel', {
    params,
  });
}

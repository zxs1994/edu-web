import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace IncomingDocumentBillApi {
  export interface IncomingDocumentBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    docTitle: string;
    docNumber: string;
    sender: string;
    receiveDate: string;
    docType: number;
    urgencyLevel: number;
    docSummary: string;
    handlingDeptId: number;
    handlingDeptName: string;
    handlingResult: string;
    handlingStatus: number;
    isImportant: number;
    cause: string;
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
    docType?: number;
    handlingStatus?: number;
    isImportant?: number;
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

import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace DocumentDispatchBillApi {
  export interface DocumentDispatchBill {
    id?: number;
    billCode?: string;
    processInstanceId?: string;
    processStatus?: number;
    docTitle: string;
    docNumber?: string;
    secrecyLevel?: number;
    templateId?: number;
    docNumberPrefix?: string;
    docNumberYear?: number;
    docNumberSerial?: number;
    isImportant?: number;
    urgencyLevel?: number;
    disclosureCategory?: number;
    issueDate?: string;
    mainRecipients?: string;
    ccDepartments?: string;
    signer?: string;
    docContent?: string;
    creator?: string;
    creatorName?: string;
    companyId: number;
    companyName: string;
    deptId: number;
    deptName: string;
    remark?: string;
    createTime?: Date;
    attachments?: AttachmentApi.AttachmentSaveReq[];
  }

  export interface DocumentDispatchBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    docTitle?: string;
    docNumber?: string;
    secrecyLevel?: number;
    urgencyLevel?: number;
    createTime?: Date[];
  }
}

export function getDocumentDispatchBillPage(
  params: DocumentDispatchBillApi.DocumentDispatchBillPageReqVO,
) {
  return requestClient.get<PageResult<DocumentDispatchBillApi.DocumentDispatchBill>>(
    '/oa/document-dispatch-bill/page',
    { params },
  );
}

export function getDocumentDispatchBill(id: number) {
  return requestClient.get<DocumentDispatchBillApi.DocumentDispatchBill>(
    `/oa/document-dispatch-bill/get?id=${id}`,
  );
}

export function saveDocumentDispatchBill(
  data: DocumentDispatchBillApi.DocumentDispatchBill,
) {
  return requestClient.post('/oa/document-dispatch-bill/save', data);
}

export function submitDocumentDispatchBill(
  data: DocumentDispatchBillApi.DocumentDispatchBill,
) {
  return requestClient.post('/oa/document-dispatch-bill/submit', data);
}

export function updateDocumentDispatchBill(
  data: DocumentDispatchBillApi.DocumentDispatchBill,
) {
  return requestClient.put('/oa/document-dispatch-bill/update', data);
}

export function deleteDocumentDispatchBill(id: number) {
  return requestClient.delete(`/oa/document-dispatch-bill/delete?id=${id}`);
}

export function deleteDocumentDispatchBillList(ids: number[]) {
  return requestClient.delete(
    `/oa/document-dispatch-bill/delete-list?ids=${ids.join(',')}`,
  );
}

export function exportDocumentDispatchBill(params: any) {
  return requestClient.download('/oa/document-dispatch-bill/export-excel', {
    params,
  });
}

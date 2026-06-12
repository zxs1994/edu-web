import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

/** 合同明细 */
export interface ContractDetail {
  id?: number;
  billId?: number;
  productName?: string;
  specification?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  remark?: string;
  sortOrder?: number;
  rowKey?: string;
}

/** 收付款计划 */
export interface PaymentPlan {
  id?: number;
  billId?: number;
  period?: number;
  planAmount?: number;
  planDate?: string;
  actualAmount?: number;
  actualDate?: string;
  status?: number;
  remark?: string;
  sortOrder?: number;
  rowKey?: string;
}

export namespace ContractBillApi {
  export interface ContractBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    contractTitle: string;
    contractCode?: string;
    contractType: number;
    contractNature?: string;
    contractCategory?: string;
    ourParty?: string;
    ourRole?: number;
    counterpartyType?: number;
    contractParty: string;
    counterpartyContact?: string;
    counterpartyPhone?: string;
    contractAmount: number;
    currency?: string;
    signDate?: string;
    effectiveDate?: string;
    expiryDate?: string;
    responsiblePerson?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    contractContent?: string;
    isMajor: number;
    majorRemark?: string;
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
    contractDetails?: ContractDetail[];
    paymentPlans?: PaymentPlan[];
  }

  export interface ContractBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    contractType?: number;
    isMajor?: number;
    createTime?: Date[];
  }
}

export function getContractBillPage(
  params: ContractBillApi.ContractBillPageReqVO,
) {
  return requestClient.get<PageResult<ContractBillApi.ContractBill>>(
    '/oa/contract-bill/page',
    { params },
  );
}

export function getContractBill(id: number) {
  return requestClient.get<ContractBillApi.ContractBill>(
    `/oa/contract-bill/get?id=${id}`,
  );
}

export function saveContractBill(data: ContractBillApi.ContractBill) {
  return requestClient.post('/oa/contract-bill/save', data);
}

export function submitContractBill(data: ContractBillApi.ContractBill) {
  return requestClient.post('/oa/contract-bill/submit', data);
}

export function updateContractBill(data: ContractBillApi.ContractBill) {
  return requestClient.put('/oa/contract-bill/update', data);
}

export function deleteContractBill(id: number) {
  return requestClient.delete(`/oa/contract-bill/delete?id=${id}`);
}

export function deleteContractBillList(ids: number[]) {
  return requestClient.delete(
    `/oa/contract-bill/delete-list?ids=${ids.join(',')}`,
  );
}

export function exportContractBill(params: any) {
  return requestClient.download('/oa/contract-bill/export-excel', { params });
}

import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace ExpenseReimburseBillApi {
  export interface ExpenseReimburseBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    expenseType: number;
    totalAmount: number;
    expenseDate: string;
    expenseDescription: string;
    paymentMethod: number;
    bankAccount: string;
    bankName: string;
    isLargeAmount: number;
    largeAmountRemark: string;
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

  export interface ExpenseReimburseBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    expenseType?: number;
    isLargeAmount?: number;
    createTime?: Date[];
  }
}

export function getExpenseReimburseBillPage(
  params: ExpenseReimburseBillApi.ExpenseReimburseBillPageReqVO,
) {
  return requestClient.get<
    PageResult<ExpenseReimburseBillApi.ExpenseReimburseBill>
  >('/oa/expense-reimburse-bill/page', { params });
}

export function getExpenseReimburseBill(id: number) {
  return requestClient.get<ExpenseReimburseBillApi.ExpenseReimburseBill>(
    `/oa/expense-reimburse-bill/get?id=${id}`,
  );
}

export function saveExpenseReimburseBill(
  data: ExpenseReimburseBillApi.ExpenseReimburseBill,
) {
  return requestClient.post('/oa/expense-reimburse-bill/save', data);
}

export function submitExpenseReimburseBill(
  data: ExpenseReimburseBillApi.ExpenseReimburseBill,
) {
  return requestClient.post('/oa/expense-reimburse-bill/submit', data);
}

export function updateExpenseReimburseBill(
  data: ExpenseReimburseBillApi.ExpenseReimburseBill,
) {
  return requestClient.put('/oa/expense-reimburse-bill/update', data);
}

export function deleteExpenseReimburseBill(id: number) {
  return requestClient.delete(`/oa/expense-reimburse-bill/delete?id=${id}`);
}

export function deleteExpenseReimburseBillList(ids: number[]) {
  return requestClient.delete(
    `/oa/expense-reimburse-bill/delete-list?ids=${ids.join(',')}`,
  );
}

export function exportExpenseReimburseBill(params: any) {
  return requestClient.download('/oa/expense-reimburse-bill/export-excel', {
    params,
  });
}

import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';
import type { TravelApplyBillApi } from '#/api/oa/travel';

import { requestClient } from '#/api/request';

export namespace ExpenseReimburseBillApi {
  export interface ExpenseReimburseDetail {
    id?: number;
    billId?: number;
    expenseType: string;
    expenseDate: string;
    departure: string;
    destination: string;
    transportType?: number;
    amount: number;
    description: string;
    receiptCount?: number;
    sortOrder?: number;
    rowKey?: string;
    createTime?: Date;
  }

  export interface ExpenseReimburseBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    presidentCorrectionDisplay?: boolean;
    presidentCorrectionAwaitingResubmit?: boolean;
    billType?: number;
    travelBillCode?: string;
    travelCause?: string;
    cause?: string;
    totalAmount: number;
    travelerCount?: number;
    paymentStatus?: number;
    creator?: number;
    creatorName?: string;
    companyId: number;
    companyName: string;
    deptId: number;
    deptName: string;
    remark?: string;
    createTime?: Date;
    details?: ExpenseReimburseDetail[];
    attachments?: AttachmentApi.AttachmentSaveReq[];
    travelBills?: TravelApplyBillApi.TravelApplyBill[];
  }

  export interface ExpenseReimburseBillPageReqVO extends PageParam {
    billType?: number;
    billCode?: string;
    processStatus?: number;
    deptName?: string;
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

export function exportExpenseBillDetail(
  params: { billType: string; id: number },
  config?: { responseReturn?: 'body' | 'raw' },
) {
  return requestClient.download('/oa/bill/export-detail', {
    params,
    ...config,
  });
}

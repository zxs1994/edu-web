import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace ExpensePaymentBillApi {
  export interface ExpensePaymentDetail {
    id?: number;
    billId?: number;
    expenseType: string;
    expenseDate: string;
    cause: string;
    amount: number;
    remark?: string;
    sortOrder?: number;
    rowKey?: string;
  }

  export interface ExpensePaymentBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    presidentCorrectionDisplay?: boolean;
    presidentCorrectionAwaitingResubmit?: boolean;
    paymentType: number;
    projectCategory?: string;
    applyDate?: string;
    urgencyLevel?: number;
    cause?: string;
    totalAmount: number;
    paymentStatus?: number;
    payeeCompanyName?: string;
    payeePersonName?: string;
    payeeBank?: string;
    payeeAccount?: string;
    contractCode?: string;
    paymentMethod?: number;
    isPrepay?: number;
    isPersonalAdvance?: number;
    officialCardNo?: string;
    creator?: number | string;
    creatorName?: string;
    companyId: number;
    companyName: string;
    deptId?: number;
    deptName?: string;
    remark?: string;
    createTime?: Date;
    details?: ExpensePaymentDetail[];
    attachments?: AttachmentApi.AttachmentSaveReq[];
  }

  export interface ExpensePaymentBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    paymentType?: number;
    deptName?: string;
    createTime?: Date[];
  }
}

export function getExpensePaymentBillPage(
  params: ExpensePaymentBillApi.ExpensePaymentBillPageReqVO,
) {
  return requestClient.get<PageResult<ExpensePaymentBillApi.ExpensePaymentBill>>(
    '/oa/expense-payment-bill/page',
    { params },
  );
}

export function getExpensePaymentBill(id: number) {
  return requestClient.get<ExpensePaymentBillApi.ExpensePaymentBill>(
    `/oa/expense-payment-bill/get?id=${id}`,
  );
}

export function saveExpensePaymentBill(
  data: ExpensePaymentBillApi.ExpensePaymentBill,
) {
  return requestClient.post('/oa/expense-payment-bill/save', data);
}

export function submitExpensePaymentBill(
  data: ExpensePaymentBillApi.ExpensePaymentBill,
) {
  return requestClient.post('/oa/expense-payment-bill/submit', data);
}

export function deleteExpensePaymentBill(id: number) {
  return requestClient.delete(`/oa/expense-payment-bill/delete?id=${id}`);
}

export function exportExpensePaymentBill(params: Record<string, any>) {
  return requestClient.download('/oa/expense-payment-bill/export-excel', {
    params,
  });
}

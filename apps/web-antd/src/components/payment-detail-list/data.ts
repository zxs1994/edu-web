import type { ExpensePaymentBillApi } from '#/api/oa/expense-payment';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

export function formatPaymentExpenseDate(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.substring(0, 10) : '';
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) ? date.toISOString().substring(0, 10) : '';
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().substring(0, 10);
  }
  return '';
}

export function isEmptyPaymentDetail(
  detail: ExpensePaymentBillApi.ExpensePaymentDetail,
): boolean {
  const hasText = [detail.expenseType, detail.cause, detail.remark].some(
    (value) => String(value || '').trim(),
  );
  const hasDate = !!formatPaymentExpenseDate(detail.expenseDate);
  const hasAmount = Number(detail.amount) > 0;
  return !hasText && !hasDate && !hasAmount;
}

export function filterEmptyPaymentDetails(
  details?: ExpensePaymentBillApi.ExpensePaymentDetail[],
): ExpensePaymentBillApi.ExpensePaymentDetail[] {
  return (details || []).filter((item) => !isEmptyPaymentDetail(item));
}

export function calcPaymentDetailsTotal(
  details?: ExpensePaymentBillApi.ExpensePaymentDetail[],
): number {
  return Number(
    filterEmptyPaymentDetails(details)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      .toFixed(2),
  );
}

export function normalizeTotalAmount(
  totalAmount: unknown,
  details?: ExpensePaymentBillApi.ExpensePaymentDetail[],
): number {
  if (totalAmount !== null && totalAmount !== undefined && totalAmount !== '') {
    const amount = Number(totalAmount);
    if (!Number.isNaN(amount)) {
      return amount;
    }
  }
  return calcPaymentDetailsTotal(details);
}

export function normalizePaymentDetail(
  detail: ExpensePaymentBillApi.ExpensePaymentDetail,
  index: number,
): ExpensePaymentBillApi.ExpensePaymentDetail {
  return {
    ...detail,
    expenseDate: formatPaymentExpenseDate(detail.expenseDate),
    amount: Number(detail.amount) || 0,
    rowKey:
      detail.rowKey ||
      (detail.id != null ? `id_${detail.id}` : `loaded_${index}_${Date.now()}`),
  };
}

export function createPaymentDetail(
  sortOrder: number,
): ExpensePaymentBillApi.ExpensePaymentDetail {
  return {
    expenseType: '',
    expenseDate: '',
    cause: '',
    amount: 0,
    remark: '',
    sortOrder,
    rowKey: `new_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
}

export function usePaymentDetailColumns(readonly = false): any[] {
  return [
    { type: 'seq', width: 60, title: '序号' },
    {
      field: 'expenseType',
      title: '费用类型',
      minWidth: 130,
      slots: { default: 'expenseType' },
    },
    {
      field: 'expenseDate',
      title: '发生日期',
      minWidth: 150,
      slots: { default: 'expenseDate' },
    },
    {
      field: 'cause',
      title: '费用事由',
      minWidth: 200,
      slots: { default: 'cause' },
    },
    {
      field: 'amount',
      title: '金额(元)',
      minWidth: 120,
      align: 'right',
      slots: { default: 'amount' },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 150,
      slots: { default: 'remark' },
    },
    ...(readonly
      ? []
      : [
          {
            title: '操作',
            width: 80,
            fixed: 'right',
            slots: { default: 'actions' },
          },
        ]),
  ];
}

export function getExpenseTypeOptions() {
  return getDictOptions(DICT_TYPE.OA_EXPENSE_PAYMENT_DETAIL_TYPE);
}

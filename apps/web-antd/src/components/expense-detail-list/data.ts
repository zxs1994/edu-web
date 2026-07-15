import type { ExpenseReimburseBillApi } from '#/api/oa/expense';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';

/**
 * @deprecated 差旅报销已改为字典 oa_travel_expense_type
 */
export const TRAVEL_EXPENSE_TYPE_OPTIONS = [
  { label: '交通费', value: '1' },
  { label: '住宿费', value: '2' },
  { label: '餐饮费', value: '3' },
  { label: '通讯费', value: '4' },
  { label: '其他', value: '5' },
];

/** @deprecated 请使用 getExpenseTypeOptions(billType) */
export const EXPENSE_TYPE_OPTIONS = TRAVEL_EXPENSE_TYPE_OPTIONS;

export function getDailyExpenseTypeOptions() {
  return getDictOptions(DICT_TYPE.OA_EXPENSE_TYPE);
}

export function getTravelExpenseTypeOptions() {
  return getDictOptions(DICT_TYPE.OA_TRAVEL_EXPENSE_TYPE);
}

export function getDailyExpenseTypeLabel(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return (
    getDictLabel(DICT_TYPE.OA_EXPENSE_TYPE, value) || String(value)
  );
}

export function getTravelExpenseTypeLabel(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return (
    getDictLabel(DICT_TYPE.OA_TRAVEL_EXPENSE_TYPE, value) || String(value)
  );
}

export function getExpenseTypeOptions(billType = 2) {
  return billType === 1
    ? getDailyExpenseTypeOptions()
    : getTravelExpenseTypeOptions();
}

export function getExpenseTypeLabel(value: unknown, billType = 2): string {
  return billType === 1
    ? getDailyExpenseTypeLabel(value)
    : getTravelExpenseTypeLabel(value);
}

export function getTransportTypeOptions() {
  return getDictOptions(DICT_TYPE.OA_TRANSPORT_TYPE, 'number');
}

export function getTransportTypeLabel(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return getDictLabel(DICT_TYPE.OA_TRANSPORT_TYPE, value) || String(value);
}

/**
 * 统一格式化发生日期，兼容字符串/数组/时间戳
 */
export function formatExpenseDate(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.substring(0, 10);
    }
    return '';
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().substring(0, 10);
    }
    return '';
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().substring(0, 10);
  }
  return '';
}

/** 判断是否为空行（所有字段均未填写） */
export function isEmptyExpenseDetail(
  detail: ExpenseReimburseBillApi.ExpenseReimburseDetail,
): boolean {
  const hasText = [
    detail.expenseType,
    detail.departure,
    detail.destination,
    detail.description,
  ].some((value) => String(value || '').trim());
  const hasDate = !!formatExpenseDate(detail.expenseDate);
  const hasAmount = Number(detail.amount) > 0;
  const hasTransport =
    detail.transportType !== null && detail.transportType !== undefined;
  const hasReceiptCount =
    detail.receiptCount !== null && detail.receiptCount !== undefined;
  return !hasText && !hasDate && !hasAmount && !hasTransport && !hasReceiptCount;
}

/** 过滤空行 */
export function filterEmptyExpenseDetails(
  details?: ExpenseReimburseBillApi.ExpenseReimburseDetail[],
): ExpenseReimburseBillApi.ExpenseReimburseDetail[] {
  return (details || []).filter((item) => !isEmptyExpenseDetail(item));
}

/** 根据费用明细计算报销总金额 */
export function calcExpenseDetailsTotal(
  details?: ExpenseReimburseBillApi.ExpenseReimburseDetail[],
): number {
  return Number(
    filterEmptyExpenseDetails(details)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      .toFixed(2),
  );
}

/** 报销总金额：无明细或未填时默认为 0 */
export function normalizeTotalAmount(
  totalAmount: unknown,
  details?: ExpenseReimburseBillApi.ExpenseReimburseDetail[],
): number {
  if (totalAmount !== null && totalAmount !== undefined && totalAmount !== '') {
    const amount = Number(totalAmount);
    if (!Number.isNaN(amount)) {
      return amount;
    }
  }
  return calcExpenseDetailsTotal(details);
}

/**
 * 标准化费用明细行，确保 VxeTable 能正确渲染
 */
export function normalizeExpenseDetail(
  detail: ExpenseReimburseBillApi.ExpenseReimburseDetail,
  index: number,
): ExpenseReimburseBillApi.ExpenseReimburseDetail {
  return {
    ...detail,
    expenseDate: formatExpenseDate(detail.expenseDate),
    amount: Number(detail.amount) || 0,
    transportType:
      detail.transportType === null || detail.transportType === undefined
        ? undefined
        : Number(detail.transportType),
    receiptCount:
      detail.receiptCount === null || detail.receiptCount === undefined
        ? undefined
        : Number(detail.receiptCount),
    rowKey:
      detail.rowKey ||
      (detail.id != null ? `id_${detail.id}` : `loaded_${index}_${Date.now()}`),
  };
}

export function createExpenseDetail(
  sortOrder: number,
): ExpenseReimburseBillApi.ExpenseReimburseDetail {
  return {
    id: undefined,
    billId: undefined,
    expenseType: '',
    expenseDate: '',
    departure: '',
    destination: '',
    transportType: undefined,
    amount: 0,
    description: '',
    receiptCount: undefined,
    sortOrder,
    rowKey: `new_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
}

/**
 * 费用明细表格列配置
 */
export function useExpenseDetailColumns(readonly: boolean = false): any[] {
  return [
    {
      type: 'seq',
      width: 60,
      title: '序号',
    },
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
      field: 'departure',
      title: '出发地',
      minWidth: 130,
      slots: { default: 'departure' },
    },
    {
      field: 'destination',
      title: '到达地',
      minWidth: 130,
      slots: { default: 'destination' },
    },
    {
      field: 'transportType',
      title: '交通工具',
      minWidth: 130,
      slots: { default: 'transportType' },
    },
    {
      field: 'receiptCount',
      title: '单据张数',
      minWidth: 110,
      align: 'right',
      slots: { default: 'receiptCount' },
    },
    {
      field: 'amount',
      title: '金额(元)',
      minWidth: 120,
      align: 'right',
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: '费用说明',
      minWidth: 180,
      slots: { default: 'description' },
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

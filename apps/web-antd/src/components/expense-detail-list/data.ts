import type { ExpenseReimburseBillApi } from '#/api/oa/expense';

/**
 * 费用类型选项
 */
export const EXPENSE_TYPE_OPTIONS = [
  { label: '交通费', value: '交通费' },
  { label: '住宿费', value: '住宿费' },
  { label: '餐饮费', value: '餐饮费' },
  { label: '通讯费', value: '通讯费' },
  { label: '其他', value: '其他' },
];

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
  return !hasText && !hasDate && !hasAmount;
}

/** 过滤空行 */
export function filterEmptyExpenseDetails(
  details?: ExpenseReimburseBillApi.ExpenseReimburseDetail[],
): ExpenseReimburseBillApi.ExpenseReimburseDetail[] {
  return (details || []).filter((item) => !isEmptyExpenseDetail(item));
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
    amount: 0,
    description: '',
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

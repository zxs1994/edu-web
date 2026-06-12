import type { PaymentPlan } from '#/api/oa/contract';

/**
 * 创建新收付款计划对象
 */
export function createPaymentPlan(sortOrder: number): PaymentPlan {
  return {
    id: undefined,
    billId: undefined,
    period: sortOrder,
    planAmount: 0,
    planDate: '',
    actualAmount: undefined,
    actualDate: '',
    status: 0,
    remark: '',
    sortOrder,
    rowKey: `new_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
}

/**
 * 收付款状态选项
 */
export const PAYMENT_STATUS_OPTIONS = [
  { label: '待收付', value: 0 },
  { label: '已收付', value: 1 },
  { label: '已逾期', value: 2 },
];

/**
 * 收付款状态文本映射
 */
export const PAYMENT_STATUS_MAP: Record<number, string> = {
  0: '待收付',
  1: '已收付',
  2: '已逾期',
};

/**
 * 收付款计划表格列配置
 * @param readonly 是否只读模式
 */
export function usePaymentPlanColumns(readonly: boolean = false): any[] {
  return [
    {
      type: 'seq',
      width: 60,
      title: '序号',
    },
    {
      field: 'period',
      title: '期次',
      width: 100,
      align: 'center',
      slots: { default: 'period' },
    },
    {
      field: 'planAmount',
      title: '计划金额',
      width: 140,
      align: 'right',
      slots: { default: 'planAmount' },
    },
    {
      field: 'planDate',
      title: '计划日期',
      width: 160,
      slots: { default: 'planDate' },
    },
    {
      field: 'actualAmount',
      title: '实际金额',
      width: 140,
      align: 'right',
      slots: { default: 'actualAmount' },
    },
    {
      field: 'actualDate',
      title: '实际日期',
      width: 160,
      slots: { default: 'actualDate' },
    },
    {
      field: 'status',
      title: '状态',
      width: 130,
      slots: { default: 'status' },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 150,
      slots: { default: 'remark' },
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

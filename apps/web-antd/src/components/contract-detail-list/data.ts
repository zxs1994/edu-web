import type { ContractDetail } from '#/api/oa/contract';

/**
 * 创建新合同明细对象
 */
export function createContractDetail(sortOrder: number): ContractDetail {
  return {
    id: undefined,
    billId: undefined,
    productName: '',
    specification: '',
    unit: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    remark: '',
    sortOrder,
    rowKey: `new_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
}

/**
 * 计算金额（数量 × 单价）
 */
export function calculateAmount(
  quantity: number | undefined,
  unitPrice: number | undefined,
): number {
  const q = quantity ?? 0;
  const p = unitPrice ?? 0;
  return Number((q * p).toFixed(2));
}

/**
 * 合同明细表格列配置
 * @param readonly 是否只读模式
 */
export function useContractDetailColumns(
  readonly: boolean = false,
): any[] {
  return [
    {
      type: 'seq',
      width: 60,
      title: '序号',
    },
    {
      field: 'productName',
      title: '项目/产品名称',
      minWidth: 160,
      slots: { default: 'productName' },
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 140,
      slots: { default: 'specification' },
    },
    {
      field: 'unit',
      title: '单位',
      width: 100,
      slots: { default: 'unit' },
    },
    {
      field: 'quantity',
      title: '数量',
      width: 130,
      align: 'right',
      slots: { default: 'quantity' },
    },
    {
      field: 'unitPrice',
      title: '单价',
      width: 130,
      align: 'right',
      slots: { default: 'unitPrice' },
    },
    {
      field: 'amount',
      title: '金额',
      width: 130,
      align: 'right',
      slots: { default: 'amount' },
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

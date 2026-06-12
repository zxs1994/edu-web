import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ExpenseReimburseBillApi } from '#/api/oa/expense';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'billCode',
      label: '单据编号',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入单据编号' },
    },
    {
      fieldName: 'processStatus',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
    },
    {
      fieldName: 'expenseType',
      label: '费用类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('oa_expense_type', 'number'),
        placeholder: '请选择费用类型',
      },
    },
    {
      fieldName: 'isLargeAmount',
      label: '是否大额',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('COMMON_STATUS', 'number'),
        placeholder: '请选择是否大额',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: getRangePickerDefaultProps(),
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions<ExpenseReimburseBillApi.ExpenseReimburseBill>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: '/oa/expense-reimburse-info',
      idField: 'id',
      queryParam: 'id',
    }),
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    {
      field: 'expenseType',
      title: '费用类型',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: 'oa_expense_type' } },
    },
    { field: 'totalAmount', title: '报销金额', minWidth: 120 },
    { field: 'expenseDate', title: '费用日期', minWidth: 120 },
    {
      field: 'paymentMethod',
      title: '支付方式',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: 'oa_payment_method' } },
    },
    {
      field: 'isLargeAmount',
      title: '是否大额',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'COMMON_STATUS' } },
    },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 100, fixed: 'right', slots: { default: 'actions' } },
  ];
}

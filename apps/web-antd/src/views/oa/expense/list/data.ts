import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ExpenseReimburseBillApi } from '#/api/oa/expense';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';
import { resolveExpenseDetailRoute } from '#/utils/oa-route-resolver';

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
      fieldName: 'deptName',
      label: '申请部门',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请选择申请部门' },
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
      path: '/oa/expense-travel/expense-reimburse-info',
      idField: 'id',
      queryParam: 'id',
      resolveRoute: resolveExpenseDetailRoute,
    }),
    {
      field: 'billType',
      title: '报销类型',
      width: 100,
      formatter: ({ cellValue }: { cellValue: number }) =>
        cellValue === 1 ? '日常报销' : '差旅报销',
    },
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'totalAmount', title: '报销总金额', minWidth: 120 },
    {
      field: 'paymentStatus',
      title: '支付状态',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.OA_EXPENSE_PAYMENT_STATUS } },
    },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 180, fixed: 'right', slots: { default: 'actions' } },
  ];
}

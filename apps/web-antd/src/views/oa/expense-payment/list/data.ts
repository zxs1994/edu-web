import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ExpensePaymentBillApi } from '#/api/oa/expense-payment';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';
import { resolveOaDetailRoute } from '#/utils/oa-route-resolver';

const INFO_PATH = '/oa/expense-travel/expense-payment-info';

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
      fieldName: 'paymentType',
      label: '支出类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.OA_EXPENSE_PAYMENT_TYPE, 'number'),
        placeholder: '请选择支出类型',
      },
    },
    {
      fieldName: 'deptName',
      label: '申请部门',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入申请部门' },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: getRangePickerDefaultProps(),
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions<ExpensePaymentBillApi.ExpensePaymentBill>['columns'] {
  return [
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: INFO_PATH,
      idField: 'id',
      queryParam: 'id',
      resolveRoute: resolveOaDetailRoute(INFO_PATH),
    }),
    {
      field: 'paymentType',
      title: '支出类型',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.OA_EXPENSE_PAYMENT_TYPE } },
    },
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellBillProcessStatus', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'totalAmount', title: '合计金额', minWidth: 120 },
    { field: 'cause', title: '申请说明', minWidth: 160 },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 120, fixed: 'right', slots: { default: 'actions' } },
  ];
}

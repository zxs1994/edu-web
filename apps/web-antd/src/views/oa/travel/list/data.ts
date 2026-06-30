import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TravelApplyBillApi } from '#/api/oa/travel';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';
import { resolveTravelDetailRoute } from '#/utils/oa-route-resolver';

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

export function useGridColumns(): VxeTableGridOptions<TravelApplyBillApi.TravelApplyBill>['columns'] {
  return [
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: '/oa/expense-travel/travel-apply-info',
      idField: 'id',
      queryParam: 'id',
      resolveRoute: resolveTravelDetailRoute,
    }),
    {
      field: 'travelType',
      title: '申请类型',
      width: 100,
      formatter: ({ cellValue }: { cellValue: number }) =>
        cellValue === 2 ? '出境差旅' : '国内差旅',
    },
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellBillProcessStatus', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'cause', title: '出差事由', minWidth: 150 },
    {
      field: 'travelStartDate',
      title: '开始日期',
      minWidth: 120,
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue ? String(cellValue).substring(0, 16) : '',
    },
    {
      field: 'travelEndDate',
      title: '结束日期',
      minWidth: 120,
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue ? String(cellValue).substring(0, 16) : '',
    },
    { field: 'travelDays', title: '天数', minWidth: 80 },
    { field: 'estimatedCost', title: '预计费用', minWidth: 120 },
    {
      field: 'reimbursementStatus',
      title: '报销状态',
      minWidth: 100,
      cellRender: {
        name: 'CellTag',
        props: (row: TravelApplyBillApi.TravelApplyBill) => ({
          color: row.reimbursementStatus === 1 ? 'success' : 'default',
          children: row.reimbursementStatus === 1 ? '已报销' : '未报销',
        }),
      },
    },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 100, fixed: 'right', slots: { default: 'actions' } },
  ];
}

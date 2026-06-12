import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TravelApplyBillApi } from '#/api/oa/travel';

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
      fieldName: 'isOverseas',
      label: '是否出境',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('COMMON_STATUS', 'number'),
        placeholder: '请选择是否出境',
      },
    },
    {
      fieldName: 'transportType',
      label: '交通方式',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('oa_transport_type', 'number'),
        placeholder: '请选择交通方式',
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

export function useGridColumns(): VxeTableGridOptions<TravelApplyBillApi.TravelApplyBill>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: '/oa/travel-apply-info',
      idField: 'id',
      queryParam: 'id',
    }),
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'destination', title: '目的地', minWidth: 130 },
    { field: 'travelStartDate', title: '开始日期', minWidth: 120 },
    { field: 'travelEndDate', title: '结束日期', minWidth: 120 },
    { field: 'travelDays', title: '天数', minWidth: 80 },
    {
      field: 'transportType',
      title: '交通方式',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: 'oa_transport_type' } },
    },
    { field: 'budgetAmount', title: '预算金额', minWidth: 120 },
    {
      field: 'isOverseas',
      title: '是否出境',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'COMMON_STATUS' } },
    },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 100, fixed: 'right', slots: { default: 'actions' } },
  ];
}

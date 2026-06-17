import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CorrectionBillApi } from '#/api/oa/correction';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';
import { resolveOaDetailRoute } from '#/utils/oa-route-resolver';

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
      fieldName: 'sourceBillType',
      label: '来源单据',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('oa_correction_bill_type', 'string'),
        placeholder: '请选择来源单据',
      },
    },
    {
      fieldName: 'freezeStatus',
      label: '冻结状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('oa_freeze_status', 'number'),
        placeholder: '请选择冻结状态',
      },
    },
    {
      fieldName: 'correctionStatus',
      label: '纠错状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('oa_correction_status', 'number'),
        placeholder: '请选择纠错状态',
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

export function useGridColumns(): VxeTableGridOptions<CorrectionBillApi.CorrectionBill>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: '/oa/correction/correction-info',
      idField: 'id',
      queryParam: 'id',
      resolveRoute: resolveOaDetailRoute('/oa/correction/correction-info'),
    }),
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'sourceBillTitle', title: '来源单据标题', minWidth: 150 },
    {
      field: 'sourceBillType',
      title: '来源单据',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: 'oa_correction_bill_type' } },
    },
    { field: 'sourceBillCode', title: '来源单据编号', minWidth: 140 },
    {
      field: 'freezeStatus',
      title: '冻结状态',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'oa_freeze_status' } },
    },
    {
      field: 'correctionStatus',
      title: '纠错状态',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'oa_correction_status' } },
    },
    { field: 'correctionReason', title: '纠错原因', minWidth: 200, showOverflow: 'ellipsis' },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 140, fixed: 'right', slots: { default: 'actions' } },
  ];
}

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ReceptionApplyBillApi } from '#/api/oa/reception';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';
import { resolveOaDetailRoute } from '#/utils/oa-route-resolver';

const INFO_PATH = '/oa/reception/reception-apply-info';

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
      fieldName: 'diningStandard',
      label: '就餐标准',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.OA_RECEPTION_DINING_STANDARD),
        placeholder: '请选择就餐标准',
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

export function useGridColumns(): VxeTableGridOptions<ReceptionApplyBillApi.ReceptionApplyBill>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: INFO_PATH,
      idField: 'id',
      queryParam: 'id',
      resolveRoute: resolveOaDetailRoute(INFO_PATH),
    }),
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellBillProcessStatus', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'cause', title: '申请事由', minWidth: 160 },
    {
      field: 'diningTime',
      title: '就餐时间',
      minWidth: 140,
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue ? String(cellValue).substring(0, 16) : '',
    },
    {
      field: 'diningStandard',
      title: '就餐标准',
      minWidth: 140,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.OA_RECEPTION_DINING_STANDARD } },
    },
    { field: 'guestCount', title: '来宾人数', minWidth: 90 },
    { field: 'accompanyCount', title: '陪同人数', minWidth: 90 },
    { field: 'estimatedCost', title: '预估费用', minWidth: 100 },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 120, fixed: 'right', slots: { default: 'actions' } },
  ];
}

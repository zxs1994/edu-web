import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ProjectInitiationBillApi } from '#/api/oa/project';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'billCode',
      label: '项目编号',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入项目编号' },
    },
    {
      fieldName: 'projectName',
      label: '项目名称',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入项目名称' },
    },
    {
      fieldName: 'projectType',
      label: '项目类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.OA_PROJECT_TYPE, 'number'),
        placeholder: '请选择项目类型',
      },
    },
    {
      fieldName: 'processStatus',
      label: '立项状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, 'number'),
        placeholder: '请选择立项状态',
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

export function useGridColumns(): VxeTableGridOptions<ProjectInitiationBillApi.ProjectInitiationBill>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    createRouterLinkColumn({
      field: 'billCode',
      title: '项目编号',
      path: '/oa/contract/project-initiation-info',
      idField: 'id',
      queryParam: 'id',
    }),
    { field: 'projectName', title: '项目名称', minWidth: 150 },
    {
      field: 'projectType',
      title: '项目类型',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.OA_PROJECT_TYPE } },
    },
    {
      field: 'priority',
      title: '优先级',
      minWidth: 90,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.OA_PRIORITY } },
    },
    {
      field: 'processStatus',
      title: '立项状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'projectManagerName', title: '项目经理', minWidth: 100 },
    { field: 'deptName', title: '所属部门', minWidth: 120 },
    { field: 'counterpartyName', title: '对方单位', minWidth: 150 },
    {
      field: 'budgetAmount',
      title: '预算金额',
      minWidth: 120,
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue != null && cellValue !== '' ? `¥${Number(cellValue).toFixed(2)}` : '-',
    },
    { field: 'createTime', title: '创建时间', minWidth: 160, formatter: 'formatDateTime' },
    { title: '操作', width: 150, fixed: 'right', slots: { default: 'actions' } },
  ];
}

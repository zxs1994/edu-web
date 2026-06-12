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
      fieldName: 'projectType',
      label: '项目类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('oa_project_type', 'number'),
        placeholder: '请选择项目类型',
      },
    },
    {
      fieldName: 'isMajor',
      label: '是否重大',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('COMMON_STATUS', 'number'),
        placeholder: '请选择是否重大',
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
      title: '单据编号',
      path: '/oa/project-initiation-info',
      idField: 'id',
      queryParam: 'id',
    }),
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'projectName', title: '项目名称', minWidth: 150 },
    {
      field: 'projectType',
      title: '项目类型',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: 'oa_project_type' } },
    },
    { field: 'budgetAmount', title: '预算金额', minWidth: 120 },
    { field: 'startDate', title: '开始日期', minWidth: 120 },
    { field: 'endDate', title: '结束日期', minWidth: 120 },
    {
      field: 'isMajor',
      title: '是否重大',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'COMMON_STATUS' } },
    },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 100, fixed: 'right', slots: { default: 'actions' } },
  ];
}

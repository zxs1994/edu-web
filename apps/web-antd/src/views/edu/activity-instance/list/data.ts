import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ActivityInstanceApi } from '#/api/edu/activity-instance';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'instanceCode',
      label: '实例编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入实例编号',
      },
    },
    {
      fieldName: 'activityName',
      label: '活动名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入活动名称',
      },
    },
    {
      fieldName: 'status',
      label: '实例状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.EDU_ACTIVITY_INSTANCE_STATUS),
        placeholder: '请选择实例状态',
      },
    },
    {
      fieldName: 'plannedDate',
      label: '计划执行时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
  ];
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<ActivityInstanceApi.ActivityInstance>['columns'] {
  return [
    createRouterLinkColumn({
      field: 'instanceCode',
      title: '实例编号',
      path: '/edu/activity/instance/info',
      idField: 'id',
      queryParam: 'id',
      minWidth: 180,
    }),
    { field: 'activityBillCode', title: '活动编号', minWidth: 160 },
    { field: 'activityName', title: '活动名称', minWidth: 160 },
    { field: 'periodNo', title: '期次', width: 80 },
    {
      field: 'plannedDate',
      title: '计划执行时间',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'actualDate',
      title: '实际执行时间',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_ACTIVITY_INSTANCE_STATUS },
      },
    },
    { field: 'enrollCount', title: '报名人数', width: 90 },
    { field: 'attendanceCount', title: '出勤人数', width: 90 },
    { field: 'createTime', title: '创建时间', minWidth: 160, formatter: 'formatDateTime' },
  ];
}

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ActivityApi } from '#/api/edu/activity';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';
import { resolveOaDetailRoute } from '#/utils/oa-route-resolver';

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'billCode',
      label: '活动编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入活动编号',
      },
    },
    {
      fieldName: 'name',
      label: '活动名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入活动名称',
      },
    },
    {
      fieldName: 'activityType',
      label: '活动类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.EDU_ACTIVITY_TYPE),
        placeholder: '请选择活动类型',
      },
    },
    {
      fieldName: 'processStatus',
      label: '活动状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
          'number',
        ),
        placeholder: '请选择活动状态',
      },
    },
    {
      fieldName: 'startDate',
      label: '开始日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
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

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<ActivityApi.Activity>['columns'] {
  return [
    createRouterLinkColumn({
      field: 'billCode',
      title: '活动编号',
      path: '/edu/activity/info',
      idField: 'id',
      queryParam: 'id',
      resolveRoute: resolveOaDetailRoute('/edu/activity/info'),
    }),
    {
      field: 'processStatus',
      title: '活动状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS },
      },
    },
    {
      field: 'name',
      title: '活动名称',
      minWidth: 160,
    },
    {
      field: 'activityType',
      title: '活动类型',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_ACTIVITY_TYPE },
      },
    },
    {
      field: 'cycleType',
      title: '周期',
      minWidth: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_ACTIVITY_CYCLE },
      },
    },
    {
      field: 'startDate',
      title: '开始日期',
      minWidth: 120,
    },
    {
      field: 'ownerUserNames',
      title: '负责人',
      minWidth: 140,
    },
    {
      field: 'participantNames',
      title: '参与人',
      minWidth: 160,
    },
    {
      field: 'budgetAmount',
      title: '预算总额',
      minWidth: 110,
    },
    {
      field: 'creatorName',
      title: '创建人',
      minWidth: 100,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      field: 'actions',
      fixed: 'right',
      width: 120,
      slots: { default: 'actions' },
    },
  ];
}

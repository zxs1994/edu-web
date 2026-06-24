import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { LeaveCancelBillApi } from '#/api/hrm/leave-cancel';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';
import { resolveOaDetailRoute } from '#/utils/oa-route-resolver';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'billCode',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入单据编号',
      },
    },
    {
      fieldName: 'processStatus',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
          'number',
        ),
        placeholder: '请选择单据状态',
      },
    },
    {
      fieldName: 'leaveType',
      label: '请假类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.HRM_LEAVE_TYPE, 'number'),
        placeholder: '请选择请假类型',
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

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<LeaveCancelBillApi.LeaveCancelBill>['columns'] {
  return [
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: '/hrm/attendance/leave-cancel-info',
      idField: 'id',
      queryParam: 'id',
      resolveRoute: resolveOaDetailRoute('/hrm/attendance/leave-cancel-info'),
    }),
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS },
      },
    },
    {
      field: 'leaveType',
      title: '请假类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_LEAVE_TYPE },
      },
    },
    {
      field: 'expectedStartTime',
      title: '预计开始时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      field: 'expectedEndTime',
      title: '预计结束时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      field: 'expectedDays',
      title: '预计天数',
      minWidth: 100,
    },
    {
      field: 'actualStartTime',
      title: '实际开始时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      field: 'actualEndTime',
      title: '实际结束时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      field: 'actualDays',
      title: '实际天数',
      minWidth: 100,
    },
    {
      field: 'creatorName',
      title: '申请人',
      minWidth: 100,
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ActivityInstanceApi } from '#/api/edu/activity-instance';

import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

const MY_FEEDBACK_OPTIONS = [
  { label: '待填写', value: 'pending' },
  { label: '已提交', value: 'submitted' },
  { label: '未开始', value: 'waiting' },
];

const ENROLLED_OPTIONS = [
  { label: '已报名', value: true },
  { label: '未报名', value: false },
];

const CAN_ENROLL_OPTIONS = [
  { label: '可报名', value: true },
  { label: '不可报名', value: false },
];

/** 我的活动 - 搜索表单 */
export function useEnrollGridFormSchema(
  defaultInstanceCode?: string,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'instanceCode',
      label: '实例编号',
      component: 'Input',
      defaultValue: defaultInstanceCode,
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
      fieldName: 'enrolled',
      label: '我的报名',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: ENROLLED_OPTIONS,
        placeholder: '请选择',
      },
    },
    {
      fieldName: 'canEnroll',
      label: '可报名',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: CAN_ENROLL_OPTIONS,
        placeholder: '请选择',
      },
    },
    {
      fieldName: 'myFeedback',
      label: '我的反馈',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: MY_FEEDBACK_OPTIONS,
        placeholder: '请选择',
      },
    },
  ];
}

/** 我的反馈状态文案 */
export function formatMyFeedbackStatus(status?: string) {
  switch (status) {
    case 'pending':
      return '待填写';
    case 'submitted':
      return '已提交';
    case 'waiting':
      return '未开始';
    default:
      return '-';
  }
}

/** 我的反馈 Tag 颜色 */
export function getMyFeedbackTagColor(status?: string) {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'submitted':
      return 'success';
    case 'waiting':
      return 'processing';
    default:
      return 'default';
  }
}

/** 我的报名 Tag 颜色 */
export function getEnrolledTagColor(enrolled?: boolean) {
  return enrolled ? 'success' : 'default';
}

/** 我的活动列表列 */
export function useEnrollGridColumns(): VxeTableGridOptions<ActivityInstanceApi.EnrollableInstance>['columns'] {
  return [
    { field: 'instanceCode', title: '实例编号', minWidth: 180 },
    { field: 'activityName', title: '活动名称', minWidth: 160 },
    {
      field: 'activityType',
      title: '活动类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_ACTIVITY_TYPE },
      },
    },
    { field: 'periodNo', title: '期次', width: 80 },
    {
      field: 'enrollStartTime',
      title: '报名开始',
      minWidth: 160,
      formatter: ({ cellValue }) => formatDateTime(cellValue) as string,
    },
    {
      field: 'enrollEndTime',
      title: '报名结束',
      minWidth: 160,
      formatter: ({ cellValue }) => formatDateTime(cellValue) as string,
    },
    { field: 'enrollCount', title: '已报人数', width: 90 },
    { field: 'attendanceCount', title: '出勤人数', width: 90 },
    { field: 'feedbackCount', title: '反馈人数', width: 90 },
    {
      field: 'enrolled',
      title: '我的报名',
      width: 100,
      slots: { default: 'enrolled' },
    },
    {
      field: 'myFeedbackStatus',
      title: '我的反馈',
      width: 100,
      fixed: 'right',
      slots: { default: 'myFeedback' },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

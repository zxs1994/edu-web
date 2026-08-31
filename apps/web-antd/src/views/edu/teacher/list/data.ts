import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TeacherApi } from '#/api/edu/teacher';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';

/**
 * 表格搜索表单配置（字段顺序、命名与详情页一致）
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'username',
      label: '用户账号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户账号',
      },
    },
    {
      fieldName: 'name',
      label: '姓名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入姓名',
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号',
      },
    },
    {
      fieldName: 'title',
      label: '职称/职级',
      component: 'Select',
      componentProps: {
        placeholder: '请选择职称/职级',
        options: getDictOptions(DICT_TYPE.EDU_TEACHER_TITLE, 'string'),
        allowClear: true,
      },
    },
    {
      fieldName: 'rewardStandard',
      label: '报酬/奖励标准',
      component: 'Select',
      componentProps: {
        placeholder: '请选择报酬/奖励标准',
        options: getDictOptions(DICT_TYPE.EDU_TEACHER_REWARD, 'string'),
        allowClear: true,
      },
    },
  ];
}

/**
 * 表格列配置（字段顺序、命名与详情页一致）
 */
export function useGridColumns(): VxeTableGridOptions<TeacherApi.Teacher>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
      fixed: 'left',
    },
    {
      ...createRouterLinkColumn({
        field: 'username',
        title: '用户账号',
        path: '/edu/teacher-info',
        idField: 'id',
        queryParam: 'id',
        minWidth: 120,
      }),
      fixed: 'left',
    },
    {
      title: '姓名',
      field: 'name',
      minWidth: 100,
      fixed: 'left',
    },
    {
      title: '手机号',
      field: 'mobile',
      width: 130,
    },
    {
      title: '性别',
      field: 'sex',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_USER_SEX },
      },
    },
    {
      title: '职称/职级',
      field: 'title',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_TEACHER_TITLE },
      },
    },
    {
      title: '报酬/奖励标准',
      field: 'rewardStandard',
      minWidth: 140,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_TEACHER_REWARD },
      },
    },
    {
      title: '备注',
      field: 'remark',
      minWidth: 160,
    },
    {
      title: '创建时间',
      field: 'createTime',
      width: 160,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      field: 'action',
      fixed: 'right',
      width: 160,
      slots: { default: 'actions' },
    },
  ];
}

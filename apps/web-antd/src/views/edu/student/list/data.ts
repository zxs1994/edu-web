import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { StudentApi } from '#/api/edu/student';

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
      fieldName: 'studentNo',
      label: '学号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入学号',
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
      fieldName: 'enrollYear',
      label: '入学年份',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入入学年份',
        min: 1900,
        max: 2100,
        class: 'w-full',
      },
    },
    {
      fieldName: 'college',
      label: '所属院系',
      component: 'Input',
      componentProps: {
        placeholder: '请输入所属院系',
      },
    },
    {
      fieldName: 'major',
      label: '专业',
      component: 'Input',
      componentProps: {
        placeholder: '请输入专业',
      },
    },
    {
      fieldName: 'className',
      label: '班级',
      component: 'Input',
      componentProps: {
        placeholder: '请输入班级',
      },
    },
    {
      fieldName: 'schoolStatus',
      label: '在校状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择在校状态',
        options: getDictOptions(DICT_TYPE.EDU_STUDENT_STATUS, 'number'),
        allowClear: true,
      },
    },
  ];
}

/**
 * 表格列配置（字段顺序、命名与详情页一致）
 */
export function useGridColumns(): VxeTableGridOptions<StudentApi.Student>['columns'] {
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
        path: '/edu/student-info',
        idField: 'id',
        queryParam: 'id',
        minWidth: 120,
      }),
      fixed: 'left',
    },
    {
      title: '学号',
      field: 'studentNo',
      minWidth: 120,
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
      width: 120,
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
      title: '出生日期',
      field: 'birthday',
      width: 120,
      formatter: 'formatDate',
    },
    {
      title: '入学年份',
      field: 'enrollYear',
      width: 100,
    },
    {
      title: '所属院系',
      field: 'college',
      minWidth: 140,
    },
    {
      title: '专业',
      field: 'major',
      minWidth: 120,
    },
    {
      title: '班级',
      field: 'className',
      minWidth: 120,
    },
    {
      title: '在校状态',
      field: 'schoolStatus',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_STUDENT_STATUS },
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

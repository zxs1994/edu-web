import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { handleTree } from '@vben/utils';

import { getCategorySimpleList } from '#/api/bpm/category';
import { getSimpleProcessDefinitionList } from '#/api/bpm/definition';
import { getCompanyList } from '#/api/system/dept';
import { getRangePickerDefaultProps } from '#/utils';
import { getCurrentUserCompanyDeptTree } from '#/utils/dept-tree';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'category',
      label: '系统分类',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择系统分类',
        allowClear: true,
        api: () => getCategorySimpleList(),
        labelField: 'name',
        valueField: 'code',
      },
    },
    {
      fieldName: 'billType',
      label: '单据类型',
      component: 'ApiSelect',
      dependencies: {
        triggerFields: ['category'],
      },
      componentProps: (values) => ({
        placeholder: '请选择单据类型',
        allowClear: true,
        immediate: false,
        alwaysLoad: true,
        params: { category: values?.category },
        api: (params: any) => getSimpleProcessDefinitionList(params?.category),
        labelField: 'name',
        valueField: 'key',
      }),
    },
    {
      fieldName: 'billCode',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入单据编号',
        allowClear: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '保存时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'companyId',
      label: '所属公司',
      component: 'ApiTreeSelect',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
      componentProps: {
        allowClear: true,
        api: async () => {
          const data = await getCompanyList();
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择公司',
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'deptId',
      label: '申请部门',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: () => getCurrentUserCompanyDeptTree(false),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择申请部门',
        treeDefaultExpandAll: true,
      },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'billTypeName',
      title: '单据类型',
      minWidth: 180,
      fixed: 'left',
    },
    {
      field: 'billCode',
      title: '单据编号',
      minWidth: 160,
      fixed: 'left',
      slots: { default: 'slot-bill-code' },
    },
    {
      field: 'summary',
      title: '摘要',
      minWidth: 200,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'deptName',
      title: '所属部门',
      minWidth: 160,
    },
    {
      field: 'createTime',
      title: '保存时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RedTemplateApi } from '#/api/oa/red-template';

import { getRangePickerDefaultProps } from '#/utils';

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'templateName',
      label: '模板名称',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入模板名称' },
    },
    {
      fieldName: 'orgName',
      label: '机关/公司名称',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入机关/公司名称' },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '开启', value: 0 },
          { label: '停用', value: 1 },
        ],
        placeholder: '请选择状态',
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
export function useGridColumns(): VxeTableGridOptions<RedTemplateApi.RedTemplate>['columns'] {
  return [
    { field: 'templateName', title: '模板名称', minWidth: 150 },
    { field: 'orgName', title: '机关/公司名称', minWidth: 160 },
    { field: 'nameFontSize', title: '名称字号', minWidth: 90 },
    { field: 'docNumberPrefix', title: '字号前缀', minWidth: 120 },
    {
      field: 'separatorStyle',
      title: '分隔线样式',
      minWidth: 110,
      cellRender: {
        name: 'CellTag',
        props: (row: RedTemplateApi.RedTemplate) => ({
          children: row.separatorStyle === 'double' ? '双线' : '单线',
        }),
      },
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 80,
      cellRender: {
        name: 'CellTag',
        props: (row: RedTemplateApi.RedTemplate) => ({
          color: row.status === 0 ? 'success' : 'default',
          children: row.status === 0 ? '开启' : '停用',
        }),
      },
    },
    { field: 'sort', title: '排序', minWidth: 80 },
    { field: 'createTime', title: '创建时间', minWidth: 160, formatter: 'formatDateTime' },
    { title: '操作', width: 150, fixed: 'right', slots: { default: 'actions' } },
  ];
}

/** 新增/编辑表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'templateName',
      label: '模板名称',
      rules: 'required',
      component: 'Input',
      componentProps: { placeholder: '请输入模板名称' },
    },
    {
      fieldName: 'orgName',
      label: '机关/公司名称',
      rules: 'required',
      component: 'Input',
      componentProps: { placeholder: '请输入机关/公司名称（红头显示）' },
    },
    {
      fieldName: 'nameFontSize',
      label: '名称字号',
      component: 'InputNumber',
      defaultValue: 36,
      componentProps: { placeholder: '字号大小', min: 12, max: 80 },
    },
    {
      fieldName: 'docNumberPrefix',
      label: '字号前缀',
      component: 'Input',
      componentProps: { placeholder: "如'无办发'" },
    },
    {
      fieldName: 'sealImage',
      label: '印章图片',
      component: 'ImageUpload',
      formItemClass: 'col-span-full',
    },
    {
      fieldName: 'separatorStyle',
      label: '分隔线样式',
      component: 'Select',
      defaultValue: 'single',
      componentProps: {
        options: [
          { label: '单线', value: 'single' },
          { label: '双线', value: 'double' },
        ],
        placeholder: '请选择分隔线样式',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      defaultValue: 0,
      componentProps: {
        options: [
          { label: '开启', value: 0 },
          { label: '停用', value: 1 },
        ],
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      defaultValue: 0,
      componentProps: { placeholder: '请输入排序值', min: 0 },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: { placeholder: '请输入备注', rows: 3 },
    },
  ];
}

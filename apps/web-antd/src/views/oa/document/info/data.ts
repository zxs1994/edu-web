import type { VbenFormSchema } from '#/adapter/form';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRedTemplateSimpleList } from '#/api/oa/red-template';
import { handleTree } from '@vben/utils';
import { getDeptList } from '#/api/system/dept';

/** 缓存部门平铺列表，供 index.vue 根据 deptId 反查公司/部门名称 */
export let cachedDeptList: any[] = [];

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    // ===== 隐藏字段 =====
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'billCode',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'companyId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'companyName',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'deptName',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'isImportant',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },

    // ===== 基本信息 =====
    {
      fieldName: 'templateId',
      label: '套红模板',
      rules: 'required',
      component: 'ApiSelect',
      componentProps: {
        api: getRedTemplateSimpleList,
        labelField: 'templateName',
        valueField: 'id',
        placeholder: '请选择套红模板',
      },
    },
    {
      fieldName: 'docTitle',
      label: '标题',
      rules: 'required',
      component: 'Input',
      componentProps: { placeholder: '请输入公文标题' },
    },
    {
      fieldName: 'docNumberPrefix',
      label: '字号',
      component: 'Input',
      componentProps: { placeholder: '如：无办发' },
    },
    {
      fieldName: 'docNumberYear',
      label: '年份',
      component: 'InputNumber',
      componentProps: { placeholder: '如：2026', min: 1900, max: 2100 },
    },
    {
      fieldName: 'docNumberSerial',
      label: '第几号文',
      component: 'InputNumber',
      componentProps: { placeholder: '序号', min: 1 },
    },
    {
      fieldName: 'secrecyLevel',
      label: '密级',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SECRECY_LEVEL, 'number'),
        placeholder: '请选择密级',
      },
    },
    {
      fieldName: 'urgencyLevel',
      label: '紧急程度',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_URGENCY_LEVEL, 'number'),
        placeholder: '请选择紧急程度',
      },
    },
    {
      fieldName: 'disclosureCategory',
      label: '公开类别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_DISCLOSURE_CATEGORY, 'number'),
        placeholder: '请选择公开类别',
      },
    },
    {
      fieldName: 'issueDate',
      label: '发文日期',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择发文日期',
      },
    },
    {
      fieldName: 'deptId',
      label: '发文部门',
      rules: 'required',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const data = await getDeptList();
          cachedDeptList = data || [];
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择发文部门',
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'mainRecipients',
      label: '主送部门',
      rules: 'required',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        multiple: true,
        api: async () => {
          const data = await getDeptList();
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择主送部门（可多选）',
        treeDefaultExpandAll: true,
        treeCheckable: true,
      },
    },
    {
      fieldName: 'ccDepartments',
      label: '抄送部门',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        multiple: true,
        api: async () => {
          const data = await getDeptList();
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择抄送部门（可多选）',
        treeDefaultExpandAll: true,
        treeCheckable: true,
      },
    },
    {
      fieldName: 'signer',
      label: '签发人',
      component: 'Input',
      componentProps: { placeholder: '请输入签发人' },
    },
    {
      fieldName: 'docContent',
      label: '公文内容',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: { placeholder: '请输入公文正文内容', rows: 6 },
    },
    {
      fieldName: 'remark',
      label: '附注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: { placeholder: '请输入附注/备注', rows: 3 },
    },
  ];
}

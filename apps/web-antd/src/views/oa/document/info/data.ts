import type { VbenFormSchema } from '#/adapter/form';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'billCode',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'docTitle',
      label: '公文标题',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入公文标题',
      },
    },
    {
      fieldName: 'docNumber',
      label: '发文字号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入发文字号',
      },
    },
    {
      fieldName: 'docType',
      label: '公文类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_DOC_TYPE, 'number'),
        placeholder: '请选择公文类型',
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
      fieldName: 'recipients',
      label: '主送单位/人员',
      component: 'Input',
      componentProps: {
        placeholder: '请输入主送单位/人员',
      },
    },
    {
      fieldName: 'ccList',
      label: '抄送',
      component: 'Input',
      componentProps: {
        placeholder: '请输入抄送',
      },
    },
    {
      fieldName: 'docContent',
      label: '公文正文',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入公文正文',
      },
    },
    {
      fieldName: 'isImportant',
      label: '是否重要公文',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择是否重要公文',
      },
    },
    {
      fieldName: 'cause',
      label: '发文事由',
      rules: 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入发文事由',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

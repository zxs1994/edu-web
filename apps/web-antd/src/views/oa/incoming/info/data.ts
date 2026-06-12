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
      label: '来文标题',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入来文标题',
      },
    },
    {
      fieldName: 'docNumber',
      label: '来文字号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入来文字号',
      },
    },
    {
      fieldName: 'sender',
      label: '来文单位',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入来文单位',
      },
    },
    {
      fieldName: 'receiveDate',
      label: '收文日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择收文日期',
      },
    },
    {
      fieldName: 'docType',
      label: '来文类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_INCOMING_DOC_TYPE, 'number'),
        placeholder: '请选择来文类型',
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
      fieldName: 'docSummary',
      label: '来文摘要',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入来文摘要',
      },
    },
    {
      fieldName: 'isImportant',
      label: '是否重要来文',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择是否重要来文',
      },
    },
    {
      fieldName: 'cause',
      label: '收文说明',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入收文说明',
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

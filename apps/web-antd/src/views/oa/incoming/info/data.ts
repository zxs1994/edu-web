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
      fieldName: 'docType',
      label: '收文类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_INCOMING_DOC_TYPE, 'number'),
        placeholder: '请选择收文类型',
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
      fieldName: 'docTitle',
      label: '公文标题',
      rules: 'required',
      component: 'Input',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入公文标题',
      },
    },
    {
      fieldName: 'secrecyLevel',
      label: '密级',
      component: 'Select',
      defaultValue: 0,
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SECRECY_LEVEL, 'number'),
        placeholder: '请选择密级',
      },
    },
    {
      fieldName: 'urgencyLevel',
      label: '紧急程度',
      component: 'Select',
      defaultValue: 0,
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_URGENCY_LEVEL, 'number'),
        placeholder: '请选择紧急程度',
      },
    },
    {
      fieldName: 'receiveDate',
      label: '收文日期',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择收文日期',
      },
    },
    {
      fieldName: 'handlingDeptName',
      label: '收文部门',
      component: 'Input',
      componentProps: {
        placeholder: '请输入收文部门',
      },
    },
    {
      fieldName: 'hostPerson',
      label: '主办人',
      component: 'Input',
      componentProps: {
        placeholder: '请输入主办人姓名',
      },
    },
    {
      fieldName: 'leaderInstruction',
      label: '领导批示',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入领导批示',
      },
    },
    {
      fieldName: 'handlingResult',
      label: '办理结果',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入办理结果',
      },
    },
    {
      fieldName: 'handlingDeadline',
      label: '办理期限',
      component: 'Input',
      componentProps: {
        placeholder: '请输入办理期限',
        addonAfter: '日',
      },
    },
    {
      fieldName: 'contentSummary',
      label: '内容摘要',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入内容摘要',
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

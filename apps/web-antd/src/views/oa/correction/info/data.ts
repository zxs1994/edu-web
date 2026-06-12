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
      fieldName: 'sourceBillType',
      label: '原单据类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_CORRECTION_BILL_TYPE, 'string'),
        placeholder: '请选择原单据类型',
      },
    },
    {
      fieldName: 'sourceBillId',
      label: '原单据ID',
      component: 'InputNumber',
      rules: 'required',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'sourceBillCode',
      label: '原单据编号',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '自动关联',
      },
    },
    {
      fieldName: 'sourceBillTitle',
      label: '原单据标题',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '自动关联',
      },
    },
    {
      fieldName: 'correctionReason',
      label: '撤销/纠错理由',
      rules: 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入撤销/纠错理由',
      },
    },
    {
      fieldName: 'councilDecision',
      label: '是否理事会决议',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择是否理事会决议',
      },
    },
    {
      fieldName: 'councilDecisionFile',
      label: '理事会决议文件',
      component: 'Input',
      componentProps: {
        placeholder: '请输入理事会决议文件',
      },
    },
    {
      fieldName: 'correctionResult',
      label: '纠错处理结果',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入纠错处理结果',
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

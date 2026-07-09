import type { VbenFormSchema } from '#/adapter/form';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

export function useFormSchema(): VbenFormSchema[] {
  return [
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
      fieldName: 'cause',
      label: '申请事由',
      rules: 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: { placeholder: '请输入申请事由' },
    },
    {
      fieldName: 'diningTime',
      label: '就餐时间',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        class: 'w-full',
        placeholder: '请选择就餐时间',
      },
    },
    {
      fieldName: 'diningStandard',
      label: '就餐标准',
      rules: 'required',
      component: 'Select',
      componentProps: {
        placeholder: '请选择就餐标准',
        options: getDictOptions(DICT_TYPE.OA_RECEPTION_DINING_STANDARD),
      },
    },
    {
      fieldName: 'guestCount',
      label: '来宾人数',
      rules: 'required',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        precision: 0,
        placeholder: '请输入来宾人数',
        class: 'w-full',
      },
    },
    {
      fieldName: 'accompanyCount',
      label: '陪同人数',
      rules: 'required',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
        placeholder: '请输入陪同人数',
        class: 'w-full',
      },
    },
    {
      fieldName: 'estimatedCost',
      label: '预估费用',
      rules: 'required',
      component: 'InputAmount',
      componentProps: {
        placeholder: '请输入预估费用',
        showUnit: false,
        precision: 2,
      },
    },
  ];
}

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
      fieldName: 'destination',
      label: '出差目的地',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入出差目的地',
      },
    },
    {
      fieldName: 'travelStartDate',
      label: '出发时间',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        placeholder: '请选择出发时间',
      },
    },
    {
      fieldName: 'travelEndDate',
      label: '返回时间',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        placeholder: '请选择返回时间',
      },
    },
    {
      fieldName: 'travelDays',
      label: '出差天数',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入出差天数',
        min: 1,
      },
    },
    {
      fieldName: 'transportType',
      label: '交通方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_TRANSPORT_TYPE, 'number'),
        placeholder: '请选择交通方式',
      },
    },
    {
      fieldName: 'accommodationType',
      label: '住宿方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_ACCOMMODATION_TYPE, 'number'),
        placeholder: '请选择住宿方式',
      },
    },
    {
      fieldName: 'budgetAmount',
      label: '预算金额',
      component: 'InputAmount',
      componentProps: {
        placeholder: '请输入预算金额',
        showUnit: false,
        precision: 2,
      },
    },
    {
      fieldName: 'travelMembers',
      label: '出差人员',
      component: 'Input',
      componentProps: {
        placeholder: '请输入出差人员',
      },
    },
    {
      fieldName: 'budgetDetail',
      label: '预算明细',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入预算明细',
      },
    },
    {
      fieldName: 'isOverseas',
      label: '是否出境差旅',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择是否出境差旅',
      },
    },
    {
      fieldName: 'overseasRemark',
      label: '出境说明',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入出境说明',
      },
      dependencies: {
        triggerFields: ['isOverseas'],
        show: (values) => values.isOverseas === 1,
      },
    },
    {
      fieldName: 'cause',
      label: '出差事由',
      rules: 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入出差事由',
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

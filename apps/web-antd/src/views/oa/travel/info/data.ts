import type { VbenFormSchema } from '#/adapter/form';

import { message } from 'ant-design-vue';

function handleTravelDateChange(values: Record<string, any>, formApi: any) {
  if (values.travelStartDate && values.travelEndDate) {
    const start = new Date(String(values.travelStartDate));
    const end = new Date(String(values.travelEndDate));
    if (
      !isNaN(start.getTime()) &&
      !isNaN(end.getTime()) &&
      end.getTime() < start.getTime()
    ) {
      message.error('结束日期不能早于开始日期');
      formApi?.setFieldValue('travelEndDate', undefined);
    }
  }
}

export function useFormSchema(_isOverseas = false): VbenFormSchema[] {
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
      fieldName: 'cause',
      label: '出差事由',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入出差事由',
      },
    },
    {
      fieldName: 'travelStartDate',
      label: '开始日期',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择开始日期',
      },
      dependencies: {
        triggerFields: ['travelStartDate', 'travelEndDate'],
        trigger: handleTravelDateChange,
      },
    },
    {
      fieldName: 'travelEndDate',
      label: '结束日期',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择结束日期',
      },
      dependencies: {
        triggerFields: ['travelStartDate', 'travelEndDate'],
        trigger: handleTravelDateChange,
      },
    },
    {
      fieldName: 'travelDays',
      label: '出差天数',
      rules: 'required',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入出差天数',
        min: 0,
        step: 0.5,
        precision: 1,
      },
    },
    {
      fieldName: 'companion',
      label: '同行人',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入同行人',
      },
    },
    {
      fieldName: 'travelerCount',
      label: '人数(含本人)',
      rules: 'required',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入人数',
        min: 1,
        precision: 0,
      },
    },
    {
      fieldName: 'estimatedCost',
      label: '预计费用',
      component: 'InputAmount',
      componentProps: {
        placeholder: '请输入预计费用',
        showUnit: false,
        precision: 2,
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

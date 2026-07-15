import type { VbenFormSchema } from '#/adapter/form';

import { message } from 'ant-design-vue';

export function calcTravelDays(start: any, end: any): number | undefined {
  if (!start || !end) return undefined;
  const s = new Date(typeof start === 'number' ? start : String(start));
  const e = new Date(typeof end === 'number' ? end : String(end));
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return undefined;
  const diffMs = e.getTime() - s.getTime();
  if (diffMs > 0) {
    return Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;
  }
  return undefined;
}

function handleTravelDateChange(values: Record<string, any>, formApi: any) {
  const days = calcTravelDays(values.travelStartDate, values.travelEndDate);
  formApi?.setFieldValue('travelDays', days);

  if (values.travelStartDate && values.travelEndDate) {
    const start = new Date(String(values.travelStartDate));
    const end = new Date(String(values.travelEndDate));
    if (
      !isNaN(start.getTime()) &&
      !isNaN(end.getTime()) &&
      end.getTime() <= start.getTime()
    ) {
      message.error('结束日期必须晚于开始日期');
      formApi?.setFieldValue('travelEndDate', undefined);
      formApi?.setFieldValue('travelDays', undefined);
    }
  }
}

export function useFormSchema(isOverseas = false): VbenFormSchema[] {
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
        showTime: true,
        format: 'YYYY-MM-DD HH:mm',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
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
        showTime: true,
        format: 'YYYY-MM-DD HH:mm',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
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
      component: 'InputNumber',
      componentProps: {
        placeholder: '自动计算',
        disabled: true,
        min: 0,
        step: 0.5,
        precision: 1,
      },
    },
    {
      fieldName: 'companion',
      label: '同行人',
      rules: isOverseas ? 'required' : undefined,
      component: 'Input',
      componentProps: {
        placeholder: '请输入同行人',
      },
    },
    {
      fieldName: 'travelerCount',
      label: '出行人数（含本人）',
      rules: isOverseas ? 'required' : undefined,
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入出行人数',
        min: 1,
        precision: 0,
      },
      dependencies: {
        triggerFields: [''],
        show: () => isOverseas,
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

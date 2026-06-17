import type { VbenFormSchema } from '#/adapter/form';

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
      fieldName: 'cause',
      label: '报销事由',
      rules: 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入报销事由',
      },
    },
    {
      fieldName: 'totalAmount',
      label: '报销总金额',
      rules: 'required',
      component: 'InputAmount',
      componentProps: {
        placeholder: '自动汇总',
        showUnit: false,
        precision: 2,
        disabled: true,
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

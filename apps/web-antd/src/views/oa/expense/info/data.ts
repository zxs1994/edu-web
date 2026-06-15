import type { VbenFormSchema } from '#/adapter/form';

export function useFormSchema(travelApplyModalRef?: any): VbenFormSchema[] {
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
      fieldName: 'travelBillCode',
      label: '关联出差申请',
      rules: 'required',
      component: 'HelpInput',
      componentProps: {
        placeholder: '请选择关联出差申请',
        bind: {
          onClick: () => {
            travelApplyModalRef?.value?.modalApi?.open();
          },
        },
      },
    },
    {
      fieldName: 'travelCause',
      label: '出差事由',
      rules: 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '根据选择的出差申请单自动回填',
        readonly: true,
      },
    },
    {
      fieldName: 'totalAmount',
      label: '报销总金额',
      rules: 'required',
      component: 'InputAmount',
      componentProps: {
        placeholder: '请输入报销总金额',
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

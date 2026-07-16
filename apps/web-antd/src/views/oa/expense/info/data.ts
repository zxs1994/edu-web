import type { VbenFormSchema } from '#/adapter/form';
import type { Ref } from 'vue';

export function useFormSchema(
  travelApplyModalRef?: any,
  readonly?: Ref<boolean>,
): VbenFormSchema[] {
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
          readonly,
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
      defaultValue: 0,
      component: 'InputAmount',
      componentProps: {
        placeholder: '请输入报销总金额',
        showUnit: false,
        precision: 2,
        disabled: true,
      },
    },
    {
      fieldName: 'travelerCount',
      label: '人数(含本人)',
      rules: 'required',
      component: 'InputNumber',
      componentProps: {
        placeholder: '本单据补贴领取人数',
        min: 1,
        precision: 0,
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

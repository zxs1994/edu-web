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
      fieldName: 'expenseType',
      label: '费用类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_EXPENSE_TYPE, 'number'),
        placeholder: '请选择费用类型',
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
      },
    },
    {
      fieldName: 'expenseDate',
      label: '费用发生日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择费用发生日期',
      },
    },
    {
      fieldName: 'paymentMethod',
      label: '付款方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PAYMENT_METHOD, 'number'),
        placeholder: '请选择付款方式',
      },
    },
    {
      fieldName: 'bankName',
      label: '收款银行名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入收款银行名称',
      },
    },
    {
      fieldName: 'bankAccount',
      label: '收款银行账号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入收款银行账号',
      },
    },
    {
      fieldName: 'expenseDescription',
      label: '费用明细说明',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入费用明细说明',
      },
    },
    {
      fieldName: 'isLargeAmount',
      label: '是否大额支出',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择是否大额支出',
      },
    },
    {
      fieldName: 'largeAmountRemark',
      label: '大额支出说明',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入大额支出说明',
      },
    },
    {
      fieldName: 'cause',
      label: '申请事由',
      rules: 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入申请事由',
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

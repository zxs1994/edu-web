import type { VbenFormSchema } from '#/adapter/form';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

const yesNoOptions = [
  { label: '否', value: 0 },
  { label: '是', value: 1 },
];

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
      fieldName: 'paymentType',
      label: '支出类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        placeholder: '请选择支出类型',
        options: getDictOptions(DICT_TYPE.OA_EXPENSE_PAYMENT_TYPE, 'number'),
      },
    },
    {
      fieldName: 'projectCategory',
      label: '费用归属项目',
      rules: 'required',
      component: 'Select',
      componentProps: {
        placeholder: '请选择费用归属项目',
        options: getDictOptions(DICT_TYPE.OA_EXPENSE_PAYMENT_PROJECT),
      },
    },
    {
      fieldName: 'applyDate',
      label: '申请日期',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        class: 'w-full',
      },
    },
    {
      fieldName: 'urgencyLevel',
      label: '紧急程度',
      rules: 'required',
      component: 'Select',
      componentProps: {
        placeholder: '请选择紧急程度',
        options: getDictOptions(DICT_TYPE.OA_URGENCY_LEVEL, 'number'),
      },
    },
    {
      fieldName: 'totalAmount',
      label: '合计金额',
      defaultValue: 0,
      component: 'InputAmount',
      componentProps: {
        placeholder: '自动汇总',
        showUnit: false,
        precision: 2,
        disabled: true,
      },
    },
    {
      fieldName: 'cause',
      label: '申请说明',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: { placeholder: '请输入费用支出整体说明或备注' },
    },
    {
      fieldName: 'payeeCompanyName',
      label: '收款单位名称',
      rules: 'required',
      component: 'Input',
      dependencies: {
        triggerFields: ['paymentType'],
        show: (values) => values.paymentType === 1,
      },
      componentProps: { placeholder: '请输入对方公司全称' },
    },
    {
      fieldName: 'payeePersonName',
      label: '报销人姓名',
      rules: 'required',
      component: 'Input',
      dependencies: {
        triggerFields: ['paymentType'],
        show: (values) => values.paymentType === 2,
      },
    },
    {
      fieldName: 'payeeBank',
      label: '收款开户行',
      rules: 'required',
      component: 'Input',
      dependencies: {
        triggerFields: ['paymentType'],
        show: (values) => values.paymentType === 1 || values.paymentType === 2,
      },
    },
    {
      fieldName: 'payeeAccount',
      label: '收款账号',
      rules: 'required',
      component: 'Input',
      dependencies: {
        triggerFields: ['paymentType'],
        show: (values) => values.paymentType === 1 || values.paymentType === 2,
      },
    },
    {
      fieldName: 'paymentMethod',
      label: '付款方式',
      rules: 'required',
      component: 'Select',
      dependencies: {
        triggerFields: ['paymentType'],
        show: (values) => values.paymentType === 1,
      },
      componentProps: {
        placeholder: '请选择付款方式',
        options: getDictOptions(DICT_TYPE.OA_PAYMENT_METHOD, 'number'),
      },
    },
    {
      fieldName: 'isPrepay',
      label: '是否预付',
      rules: 'required',
      component: 'Select',
      dependencies: {
        triggerFields: ['paymentType'],
        show: (values) => values.paymentType === 1,
      },
      componentProps: { options: yesNoOptions },
    },
    {
      fieldName: 'isPersonalAdvance',
      label: '是否个人垫付',
      rules: 'required',
      component: 'Select',
      dependencies: {
        triggerFields: ['paymentType'],
        show: (values) => values.paymentType === 2,
      },
      componentProps: { options: yesNoOptions },
    },
    {
      fieldName: 'officialCardNo',
      label: '公务卡号',
      component: 'Input',
      dependencies: {
        triggerFields: ['paymentType'],
        show: (values) => values.paymentType === 2,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
  ];
}

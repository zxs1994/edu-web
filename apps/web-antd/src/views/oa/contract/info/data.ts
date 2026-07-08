import type { VbenFormSchema } from '#/adapter/form';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

export function useFormSchema(): VbenFormSchema[] {
  return [
    // ========== 隐藏字段 ==========
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

    // ========== 第1行：合同名称、合同类型、合同编号、对方单位 ==========
    {
      fieldName: 'contractTitle',
      label: '合同名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入合同名称',
      },
    },
    {
      fieldName: 'contractType',
      label: '合同类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_CONTRACT_TYPE, 'number'),
        placeholder: '请选择合同类型',
      },
    },
    {
      fieldName: 'contractCode',
      label: '合同编号',
      component: 'Input',
      componentProps: {
        placeholder: '审批通过后自动生成',
        disabled: true,
      },
    },
    {
      fieldName: 'contractParty',
      label: '对方单位',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请选择对方单位',
      },
    },
    {
      fieldName: 'contractNature',
      label: '合同性质',
      component: 'Select',
      componentProps: {
        options: [
          { label: '标准合同', value: '标准合同' },
          { label: '框架协议', value: '框架协议' },
          { label: '补充协议', value: '补充协议' },
          { label: '备忘录', value: '备忘录' },
        ],
        placeholder: '请选择合同性质',
      },
    },

    // ========== 第2行：合同分类、我方主体、我方角色、对方类型 ==========
    {
      fieldName: 'contractCategory',
      label: '合同分类',
      component: 'Select',
      componentProps: {
        options: [
          { label: '采购类', value: '采购类' },
          { label: '销售类', value: '销售类' },
          { label: '服务类', value: '服务类' },
          { label: '合作类', value: '合作类' },
          { label: '其他', value: '其他' },
        ],
        placeholder: '请选择合同分类',
      },
    },
    // {
    //   fieldName: 'ourParty',
    //   label: '我方主体',
    //   component: 'Input',
    //   componentProps: {
    //     placeholder: '选填(默认自动填充)',
    //   },
    // },

    // {
    //   fieldName: 'counterpartyType',
    //   label: '对方类型',
    //   component: 'RadioGroup',
    //   defaultValue: 1,
    //   componentProps: {
    //     optionType: 'button',
    //     options: [
    //       { label: 'CRM客户', value: 1 },
    //       { label: 'ERP供应商', value: 2 },
    //     ],
    //   },
    // },

    // ========== 第3行：对方单位、对方联系人、对方电话、合同金额 ==========

    {
      fieldName: 'counterpartyContact',
      label: '对方负责人',
      component: 'Input',
      componentProps: {
        placeholder: '请输入对方联系人',
      },
    },
    {
      fieldName: 'counterpartyPhone',
      label: '对方电话',
      component: 'Input',
      componentProps: {
        placeholder: '请输入对方联系电话',
      },
    },
    {
      fieldName: 'responsiblePerson',
      label: '我方负责人',
      component: 'Input',
      componentProps: {
        placeholder: '请选择负责人',
      },
    },
    {
      fieldName: 'ourRole',
      label: '我方角色',
      component: 'RadioGroup',
      defaultValue: 1,
      componentProps: {
        optionType: 'button',
        options: [
          { label: '甲方', value: 1 },
          { label: '乙方', value: 2 },
        ],
      },
    },
    {
      fieldName: 'currency',
      label: '币种',
      component: 'Select',
      defaultValue: 'CNY',
      componentProps: {
        options: [
          { label: '人民币（CNY）', value: 'CNY' },
          { label: '美元（USD）', value: 'USD' },
          { label: '欧元（EUR）', value: 'EUR' },
          { label: '英镑（GBP）', value: 'GBP' },
          { label: '港币（HKD）', value: 'HKD' },
        ],
        placeholder: '请选择币种',
      },
    },
    {
      fieldName: 'contractAmount',
      label: '合同金额',
      component: 'InputAmount',
      componentProps: {
        placeholder: '请输入合同总金额',
        showUnit: false,
        precision: 2,
      },
    },

    // ========== 第4行：币种、签订日期、生效日期、截止日期 ==========

    {
      fieldName: 'signDate',
      label: '签订日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择签订日期',
      },
    },
    {
      fieldName: 'effectiveDate',
      label: '生效日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择生效日期',
      },
    },
    {
      fieldName: 'expiryDate',
      label: '截止日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择截止日期',
      },
    },

    // ========== 第5行：负责人、备注 ==========

    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },

    // ========== 隐藏字段（保持兼容） ==========
    {
      fieldName: 'contractStartDate',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'contractEndDate',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'contractContent',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'isMajor',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'majorRemark',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
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
        rows: 3,
      },
    },
  ];
}

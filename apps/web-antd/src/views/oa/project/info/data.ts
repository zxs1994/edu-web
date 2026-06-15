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
      fieldName: 'projectName',
      label: '项目名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目名称',
      },
    },
    {
      fieldName: 'projectType',
      label: '项目类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PROJECT_TYPE, 'number'),
        placeholder: '请选择项目类型',
      },
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PRIORITY, 'number'),
        placeholder: '请选择优先级',
      },
    },
    {
      fieldName: 'projectCategory',
      label: '项目分类',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PROJECT_CATEGORY, 'number'),
        placeholder: '请选择项目分类',
      },
    },
    {
      fieldName: 'projectSetName',
      label: '所属项目集',
      component: 'Input',
      componentProps: {
        placeholder: '请输入所属项目集',
      },
    },
    {
      fieldName: 'startDate',
      label: '计划开始',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择计划开始日期',
      },
    },
    {
      fieldName: 'endDate',
      label: '计划结束',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择计划结束日期',
      },
    },
    {
      fieldName: 'contractCode',
      label: '合同编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入合同编号',
      },
    },
    {
      fieldName: 'contractName',
      label: '合同名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入合同名称',
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
      fieldName: 'projectManagerName',
      label: '项目经理',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目经理',
      },
    },
    {
      fieldName: 'counterpartyType',
      label: '对方类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_COUNTERPARTY_TYPE, 'number'),
        placeholder: '请选择对方类型',
      },
    },
    {
      fieldName: 'counterpartyName',
      label: '对方单位',
      component: 'Input',
      componentProps: {
        placeholder: '请输入对方单位名称',
      },
    },
    {
      fieldName: 'counterpartyContact',
      label: '对方联系人',
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
      fieldName: 'projectDescription',
      label: '项目描述',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入项目描述',
        rows: 3,
      },
    },
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
  ];
}

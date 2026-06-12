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
      label: '项目/活动名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目/活动名称',
      },
    },
    {
      fieldName: 'projectType',
      label: '类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PROJECT_TYPE, 'number'),
        placeholder: '请选择类型',
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
      fieldName: 'startDate',
      label: '计划开始日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择计划开始日期',
      },
    },
    {
      fieldName: 'endDate',
      label: '计划结束日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择计划结束日期',
      },
    },
    {
      fieldName: 'expectedOutcome',
      label: '预期成果',
      component: 'Input',
      componentProps: {
        placeholder: '请输入预期成果',
      },
    },
    {
      fieldName: 'projectDescription',
      label: '项目/活动方案',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入项目/活动方案',
      },
    },
    {
      fieldName: 'isMajor',
      label: '是否重大项目',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择是否重大项目',
      },
    },
    {
      fieldName: 'majorRemark',
      label: '重大项目说明',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入重大项目说明',
      },
    },
    {
      fieldName: 'cause',
      label: '立项事由',
      rules: 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入立项事由',
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

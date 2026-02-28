import type { VbenFormSchema } from '#/adapter/form';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

/** 新增/修改的表单 */
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
      fieldName: 'name',
      label: '表单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入表单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'billCodePrefix',
      label: '单据类型编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入单据类型编码，如 OA103',
      },
      help: '作为单据编号前缀，如 OA103 生成 OA103-2026022700001',
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
    {
      fieldName: 'summaryFields',
      label: '摘要字段',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        placeholder: '不选则默认展示前三个字段',
        options: [],
        maxTagCount: 3,
        allowClear: true,
        style: { width: '100%' },
      },
      help: '选择显示在流程任务摘要中的字段，不选则默认展示前三个字段',
    },
  ];
}

import type { VbenFormSchema } from '@vben/common-ui';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

export interface TeacherFormSchemaOptions {
  /** 是否为新增（新增时隐藏用户账号，由后端自动生成） */
  isCreate?: boolean;
  readonly?: boolean;
}

/**
 * 教培档案基本信息表单
 */
export function useBasicFormSchema(
  options: TeacherFormSchemaOptions = {},
): VbenFormSchema[] {
  const { isCreate = false, readonly = false } = options;
  return [
    {
      fieldName: 'username',
      label: '用户账号',
      component: 'Input',
      help: '登录账号由系统自动生成，格式如 T0001',
      dependencies: {
        triggerFields: [''],
        show: () => !isCreate,
      },
      componentProps: {
        placeholder: '系统自动生成',
        disabled: true,
      },
    },
    {
      fieldName: 'name',
      label: '姓名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入姓名',
        disabled: readonly,
      },
      rules: 'required',
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号',
        maxLength: 11,
        disabled: readonly,
      },
      rules: 'mobileRequired',
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'RadioGroup',
      defaultValue: 1,
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        disabled: readonly,
      },
      rules: 'required',
    },
    {
      fieldName: 'title',
      label: '职称/职级',
      component: 'Select',
      componentProps: {
        placeholder: '请选择职称/职级',
        options: getDictOptions(DICT_TYPE.EDU_TEACHER_TITLE, 'string'),
        allowClear: true,
        disabled: readonly,
      },
      rules: 'required',
    },
    {
      fieldName: 'rewardStandard',
      label: '报酬/奖励标准',
      component: 'Select',
      componentProps: {
        placeholder: '请选择报酬/奖励标准（可选）',
        options: getDictOptions(DICT_TYPE.EDU_TEACHER_REWARD, 'string'),
        allowClear: true,
        disabled: readonly,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
        disabled: readonly,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

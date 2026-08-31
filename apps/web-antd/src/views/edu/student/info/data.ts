import type { VbenFormSchema } from '@vben/common-ui';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

export interface StudentFormSchemaOptions {
  /** 是否为新增（新增时登录账号由系统自动生成，不在表单展示） */
  isCreate?: boolean;
  readonly?: boolean;
}

/**
 * 学生档案基本信息表单
 */
export function useBasicFormSchema(
  options: StudentFormSchemaOptions = {},
): VbenFormSchema[] {
  const { isCreate = false, readonly = false } = options;
  return [
    {
      fieldName: 'username',
      label: '用户账号',
      component: 'Input',
      help: '登录账号由系统自动生成，格式如 S0001',
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
      fieldName: 'studentNo',
      label: '学号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入学号',
        disabled: readonly,
      },
      rules: 'required',
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
      },
      rules: 'mobileRequired',
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'RadioGroup',
      defaultValue: 1, // 默认男
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
      },
      rules: 'required',
    },
    {
      fieldName: 'birthday',
      label: '出生日期',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择出生日期',
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        class: 'w-full',
      },
    },
    {
      fieldName: 'enrollYear',
      label: '入学年份',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入入学年份',
        min: 1900,
        max: 2100,
        class: 'w-full',
      },
    },
    {
      fieldName: 'college',
      label: '所属院系',
      component: 'Input',
      componentProps: {
        placeholder: '请输入所属院系',
      },
    },
    {
      fieldName: 'major',
      label: '专业',
      component: 'Input',
      componentProps: {
        placeholder: '请输入专业',
      },
    },
    {
      fieldName: 'className',
      label: '班级',
      component: 'Input',
      componentProps: {
        placeholder: '请输入班级',
      },
    },
    {
      fieldName: 'schoolStatus',
      label: '在校状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择在校状态',
        options: getDictOptions(DICT_TYPE.EDU_STUDENT_STATUS, 'number'),
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

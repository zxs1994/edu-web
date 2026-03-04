import type { Ref } from 'vue';

import type { VbenFormSchema } from '#/adapter/form';

import dayjs from 'dayjs';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { message } from 'ant-design-vue';

/** 新增/修改的表单 */
export function useFormSchema(
  readonly?: Ref<boolean>,
  nodeKeyName?: Ref<string>,
  canCancelEdit?: Ref<boolean>,
): VbenFormSchema[] {
  const isCancelNode = nodeKeyName?.value === '发起人销假';

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
      label: '单据编号',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    // ========== 请假信息 ==========
    {
      fieldName: 'leaveType',
      label: '请假类型',
      rules: isCancelNode ? undefined : 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_LEAVE_TYPE, 'number'),
        placeholder: '请选择请假类型',
        disabled: isCancelNode ? true : undefined,
      },
    },
    {
      fieldName: 'leaveBalance',
      label: '假期余额（天）',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入假期余额',
        min: 0,
        precision: 1,
        disabled: isCancelNode ? true : undefined,
      },
    },
    {
      fieldName: 'expectedStartTime',
      label: '预计开始时间',
      rules: isCancelNode ? undefined : 'required',
      component: 'DatePicker',
      componentProps: {
        showTime: {
          format: 'HH:mm',
          minuteStep: 30,
          defaultValue: dayjs('09:00', 'HH:mm'),
        },
        format: 'YYYY-MM-DD HH:mm',
        valueFormat: 'x',
        placeholder: '请选择预计开始时间',
        disabled: isCancelNode ? true : undefined,
      },
      dependencies: {
        triggerFields: ['expectedEndTime'],
        trigger: (values, formApi) => {
          if (
            values.expectedEndTime &&
            values.expectedStartTime &&
            values.expectedEndTime <= values.expectedStartTime
          ) {
            message.error('预计开始时间不能晚于或等于预计结束时间');
            formApi?.setFieldValue('expectedEndTime', undefined);
          }
        },
      },
    },
    {
      fieldName: 'expectedEndTime',
      label: '预计结束时间',
      rules: isCancelNode ? undefined : 'required',
      component: 'DatePicker',
      componentProps: {
        showTime: {
          format: 'HH:mm',
          minuteStep: 30,
          defaultValue: dayjs('18:00', 'HH:mm'),
        },
        format: 'YYYY-MM-DD HH:mm',
        valueFormat: 'x',
        placeholder: '请选择预计结束时间',
        disabled: isCancelNode ? true : undefined,
      },
      dependencies: {
        triggerFields: ['expectedStartTime'],
        trigger: (values, formApi) => {
          if (
            values.expectedStartTime &&
            values.expectedEndTime &&
            values.expectedEndTime <= values.expectedStartTime
          ) {
            message.error('预计结束时间必须大于预计开始时间');
            formApi?.setFieldValue('expectedStartTime', undefined);
          }
        },
      },
    },
    {
      fieldName: 'expectedDays',
      label: '预计申请天数',
      rules: isCancelNode ? undefined : 'required',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入预计申请天数',
        min: 0,
        precision: 1,
        disabled: isCancelNode ? true : undefined,
      },
    },
    {
      fieldName: 'projectName',
      label: '项目名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目名称',
        disabled: isCancelNode ? true : undefined,
      },
    },
    {
      fieldName: 'projectCode',
      label: '项目编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目编码',
        disabled: isCancelNode ? true : undefined,
      },
    },
    {
      fieldName: 'leaveReason',
      label: '请假原因',
      rules: isCancelNode ? undefined : 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入请假原因',
        disabled: isCancelNode ? true : undefined,
      },
    },
    // ========== 销假信息 ==========
    {
      fieldName: 'actualStartTime',
      label: '实际开始时间',
      rules: isCancelNode ? 'required' : undefined,
      component: 'DatePicker',
      componentProps: {
        showTime: {
          format: 'HH:mm',
          minuteStep: 30,
          defaultValue: dayjs('09:00', 'HH:mm'),
        },
        format: 'YYYY-MM-DD HH:mm',
        valueFormat: 'x',
        placeholder: '请选择实际开始时间',
        disabled: () => {
          if (canCancelEdit?.value) {
            return false;
          }
          return readonly?.value;
        },
      },
      dependencies: {
        triggerFields: ['actualEndTime'],
        trigger: (values, formApi) => {
          if (
            values.actualEndTime &&
            values.actualStartTime &&
            values.actualEndTime <= values.actualStartTime
          ) {
            message.error('实际开始时间不能晚于或等于实际结束时间');
            formApi?.setFieldValue('actualEndTime', undefined);
          }
        },
      },
    },
    {
      fieldName: 'actualEndTime',
      label: '实际结束时间',
      rules: isCancelNode ? 'required' : undefined,
      component: 'DatePicker',
      componentProps: {
        showTime: {
          format: 'HH:mm',
          minuteStep: 30,
          defaultValue: dayjs('18:00', 'HH:mm'),
        },
        format: 'YYYY-MM-DD HH:mm',
        valueFormat: 'x',
        placeholder: '请选择实际结束时间',
        disabled: () => {
          if (canCancelEdit?.value) {
            return false;
          }
          return readonly?.value;
        },
      },
      dependencies: {
        triggerFields: ['actualStartTime'],
        trigger: (values, formApi) => {
          if (
            values.actualStartTime &&
            values.actualEndTime &&
            values.actualEndTime <= values.actualStartTime
          ) {
            message.error('实际结束时间必须大于实际开始时间');
            formApi?.setFieldValue('actualStartTime', undefined);
          }
        },
      },
    },
    {
      fieldName: 'actualDays',
      label: '实际天数',
      rules: isCancelNode ? 'required' : undefined,
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入实际天数',
        min: 0,
        precision: 1,
        disabled: () => {
          if (canCancelEdit?.value) {
            return false;
          }
          return readonly?.value;
        },
      },
    },
    {
      fieldName: 'cancelRemark',
      label: '销假备注',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入销假备注',
        disabled: () => {
          if (canCancelEdit?.value) {
            return false;
          }
          return readonly?.value;
        },
      },
    },
    // ========== 备注 ==========
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '请输入备注',
        disabled: isCancelNode ? true : undefined,
      },
    },
  ];
}

import type { VbenFormSchema } from '#/adapter/form';

import { formatDateTime } from '@vben/utils';

import { getRangePickerDefaultProps } from '#/utils';

/** 统一后端日期时间为 RangePicker 可识别的字符串 */
function normalizeDateTimeValue(value?: unknown) {
  if (value == null || value === '') {
    return undefined;
  }
  const formatted = formatDateTime(value as Parameters<typeof formatDateTime>[0]);
  return formatted || undefined;
}

/** 后端起止时间 → 表单范围 */
export function buildActualTimeRange(
  start?: unknown,
  end?: unknown,
): [string, string] | undefined {
  const normalizedStart = normalizeDateTimeValue(start);
  const normalizedEnd = normalizeDateTimeValue(end);
  if (normalizedStart && normalizedEnd) {
    return [normalizedStart, normalizedEnd];
  }
  return undefined;
}

/** 表单范围 → 后端字段（actualDate 取实际开始时间） */
export function splitActualTimeRange(
  range?: [string, string] | null | string[],
) {
  if (!range || !Array.isArray(range) || range.length < 2 || !range[0] || !range[1]) {
    return {
      actualStartTime: undefined,
      actualEndTime: undefined,
      actualDate: undefined,
    };
  }
  const [start, end] = range;
  return {
    actualStartTime: start,
    actualEndTime: end,
    actualDate: start,
  };
}

/** 活动记录表单 schema */
export function useRecordFormSchema(readonly: boolean): VbenFormSchema[] {
  return [
    {
      fieldName: 'instanceId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'actualTimeRange',
      label: '实际起止时间',
      rules: 'required',
      component: 'RangePicker',
      formItemClass: 'col-span-1',
      componentProps: {
        ...getRangePickerDefaultProps(),
        class: 'w-full',
        placeholder: ['实际开始时间', '实际结束时间'],
        disabled: readonly,
      },
    },
    {
      fieldName: 'absentUserIds',
      label: '缺席人员',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        allowClear: true,
        class: 'w-full',
        placeholder: '请选择缺席人员（须在活动参与人范围内）',
        options: [],
        showSearch: true,
        optionFilterProp: 'label',
        disabled: readonly,
      },
    },
    {
      fieldName: 'summary',
      label: '内容纪要',
      rules: 'required',
      component: 'Textarea',
      componentProps: {
        rows: 4,
        maxlength: 2000,
        showCount: true,
        placeholder: '请输入活动执行纪要',
        disabled: readonly,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

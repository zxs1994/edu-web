import type { VbenFormSchema } from '#/adapter/form';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import type { Dayjs } from 'dayjs';

/** 新建年度表单 */
export function useCreateYearFormSchema(
  existingYears: number[] = [],
): VbenFormSchema[] {
  const yearSet = new Set(existingYears);
  return [
    {
      fieldName: 'budgetYear',
      label: '预算年度',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        class: 'w-full',
        picker: 'year',
        format: 'YYYY',
        valueFormat: 'YYYY',
        placeholder: '请选择预算年度',
        allowClear: false,
        disabledDate: (current: Dayjs) => {
          if (!current) {
            return false;
          }
          return yearSet.has(current.year());
        },
      },
    },
    {
      fieldName: 'periodMode',
      label: '时段模式',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.EDU_REWARD_BUDGET_PERIOD_MODE),
        placeholder: '请选择时段模式',
      },
    },
    {
      fieldName: 'totalBudget',
      label: '全年预算',
      component: 'InputNumber',
      rules: 'required',
      help: '将按季度/月份自动均分到各时段',
      dependencies: {
        triggerFields: ['periodMode'],
        show: (values) =>
          values.periodMode === 'QUARTER' || values.periodMode === 'MONTH',
      },
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
        placeholder: '请输入全年预算金额',
      },
    },
  ];
}

/** 找一个尚未建预算的默认年份（优先本年） */
export function resolveDefaultBudgetYear(existingYears: number[]): number {
  const yearSet = new Set(existingYears);
  let year = new Date().getFullYear();
  while (yearSet.has(year) && year <= 2100) {
    year += 1;
  }
  return year;
}

/** 切换时段模式表单 */
export function useSwitchModeFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'periodMode',
      label: '时段模式',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.EDU_REWARD_BUDGET_PERIOD_MODE),
        placeholder: '请选择时段模式',
      },
    },
  ];
}

/** 重置全年预算表单 */
export function useResetBudgetFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'totalBudget',
      label: '全年预算',
      component: 'InputNumber',
      rules: 'required',
      help: '将按当前各时段平均分配（余数落在最后一段）',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
        placeholder: '请输入全年预算金额',
      },
    },
  ];
}

/** 编辑时段表单 */
export function usePeriodEditFormSchema(custom: boolean): VbenFormSchema[] {
  const schema: VbenFormSchema[] = [
    {
      fieldName: 'name',
      label: '时段名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入时段名称',
      },
    },
    {
      fieldName: 'budgetAmount',
      label: '预算金额',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
        placeholder: '请输入预算金额',
      },
    },
  ];
  if (custom) {
    schema.splice(1, 0, {
      fieldName: 'dateRange',
      label: '起止日期',
      component: 'RangePicker',
      rules: 'required',
      componentProps: {
        class: 'w-full',
        valueFormat: 'YYYY-MM-DD',
      },
    });
  }
  return schema;
}

export function formatMoney(value: null | number | string | undefined) {
  if (value == null || value === '') {
    return '¥0.00';
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return String(value);
  }
  return `¥${num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatRate(value: null | number | undefined) {
  if (value == null || Number.isNaN(Number(value))) {
    return '-';
  }
  return `${(Number(value) * 100).toFixed(2)}%`;
}

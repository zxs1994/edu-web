import type { VbenFormSchema } from '#/adapter/form';
import type { ExpenseReimburseBillApi } from '#/api/oa/expense';
import type { Ref } from 'vue';

import { calcExpenseDetailsTotal } from '#/components/expense-detail-list/data';

/** 交通补贴标准（元/人/天） */
export const TRAFFIC_SUBSIDY_STANDARD = 80;
/** 伙食补贴标准（元/人/天） */
export const MEAL_SUBSIDY_STANDARD = 100;

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** 补贴金额 = 标准 × 人数 × 天数 */
export function calcSubsidyAmount(
  days: unknown,
  people: unknown,
  standard: number,
): number {
  return (
    Math.round(toNumber(days) * toNumber(people) * standard * 100) / 100
  );
}

/** 差旅报销总金额 = 明细合计 + 交通补贴 + 伙食补贴 */
export function calcTravelReimburseTotal(
  details: ExpenseReimburseBillApi.ExpenseReimburseDetail[] | undefined,
  subsidy: {
    trafficSubsidyDays?: unknown;
    trafficSubsidyPeople?: unknown;
    mealSubsidyDays?: unknown;
    mealSubsidyPeople?: unknown;
  },
): number {
  const detailTotal = calcExpenseDetailsTotal(details);
  const traffic = calcSubsidyAmount(
    subsidy.trafficSubsidyDays,
    subsidy.trafficSubsidyPeople,
    TRAFFIC_SUBSIDY_STANDARD,
  );
  const meal = calcSubsidyAmount(
    subsidy.mealSubsidyDays,
    subsidy.mealSubsidyPeople,
    MEAL_SUBSIDY_STANDARD,
  );
  return Math.round((detailTotal + traffic + meal) * 100) / 100;
}

export function useFormSchema(
  travelApplyModalRef?: any,
  readonly?: Ref<boolean>,
  onSubsidyChange?: () => void | Promise<void>,
): VbenFormSchema[] {
  const subsidyProps = (extra: Record<string, any> = {}) => ({
    ...extra,
    onChange: () => {
      void onSubsidyChange?.();
    },
  });

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
      fieldName: 'travelBillCode',
      label: '关联出差申请',
      rules: 'required',
      component: 'HelpInput',
      componentProps: {
        placeholder: '请选择关联出差申请',
        bind: {
          readonly,
          onClick: () => {
            travelApplyModalRef?.value?.modalApi?.open();
          },
        },
      },
    },
    {
      fieldName: 'travelCause',
      label: '出差事由',
      rules: 'required',
      component: 'Textarea',
      formItemClass: 'col-span-full',
      componentProps: {
        placeholder: '根据选择的出差申请单自动回填',
        readonly: true,
      },
    },
    {
      fieldName: 'trafficSubsidyDays',
      label: '交通补贴天数',
      rules: 'required',
      component: 'InputNumber',
      componentProps: () =>
        subsidyProps({
          placeholder: '请输入交通补贴天数',
          min: 0,
          step: 0.5,
          precision: 1,
        }),
    },
    {
      fieldName: 'trafficSubsidyPeople',
      label: '交通补贴人数',
      rules: 'required',
      component: 'InputNumber',
      componentProps: () =>
        subsidyProps({
          placeholder: '请输入交通补贴人数',
          min: 0,
          precision: 0,
        }),
    },
    {
      fieldName: 'mealSubsidyDays',
      label: '伙食补贴天数',
      rules: 'required',
      component: 'InputNumber',
      componentProps: () =>
        subsidyProps({
          placeholder: '请输入伙食补贴天数',
          min: 0,
          step: 0.5,
          precision: 1,
        }),
    },
    {
      fieldName: 'mealSubsidyPeople',
      label: '伙食补贴人数',
      rules: 'required',
      component: 'InputNumber',
      componentProps: () =>
        subsidyProps({
          placeholder: '请输入伙食补贴人数',
          min: 0,
          precision: 0,
        }),
    },
    {
      fieldName: 'totalAmount',
      label: '报销总金额',
      rules: 'required',
      defaultValue: 0,
      component: 'InputAmount',
      componentProps: {
        placeholder: '明细+补贴自动汇总',
        showUnit: false,
        precision: 2,
        disabled: true,
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

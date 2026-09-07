import type { VbenFormSchema } from '#/adapter/form';

import { reactive } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { useDebounceFn } from '@vueuse/core';

import { getActivityInstancePage } from '#/api/edu/activity-instance';
import { z } from '#/adapter/form';

export function useFormSchema(): VbenFormSchema[] {
  /** ApiSelect 远程搜索参数（onSearch → params → 重新请求 api） */
  const instanceSearchParams = reactive<{ keyword?: string }>({});
  const onInstanceSearch = useDebounceFn((value: string) => {
    const keyword = value?.trim() || undefined;
    if (instanceSearchParams.keyword === keyword) {
      return;
    }
    instanceSearchParams.keyword = keyword;
  }, 300);

  return [
    {
      fieldName: 'instanceIds',
      label: '活动实例',
      component: 'ApiSelect',
      rules: 'required',
      formItemClass: 'col-span-2',
      componentProps: {
        mode: 'multiple',
        placeholder: '请选择已结项的活动实例，可搜编号/活动名',
        allowClear: true,
        showSearch: true,
        filterOption: false,
        maxTagCount: 'responsive',
        params: instanceSearchParams,
        onSearch: (value: string) => onInstanceSearch(value),
        api: async (params: { keyword?: string }) => {
          const keyword = params?.keyword?.trim();
          const page = await getActivityInstancePage({
            pageNo: 1,
            pageSize: 50,
            status: 'COMPLETED',
            ...(keyword ? { keyword } : {}),
          });
          return (page?.list || []).map((item) => ({
            label:
              `${item.instanceCode || ''}（${item.activityName || '-'}第${item.periodNo || '-'}期）`.trim(),
            value: item.id,
            activityId: item.activityId,
          }));
        },
      },
    },
    {
      fieldName: 'title',
      label: '申请事由',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入申请事由',
        maxlength: 200,
      },
    },
    {
      fieldName: 'currency',
      label: '币种',
      component: 'Select',
      componentProps: {
        disabled: true,
        options: getDictOptions(DICT_TYPE.EDU_FEE_CURRENCY),
        placeholder: '由明细带出（同单须同币种）',
      },
    },
    {
      fieldName: 'totalAmount',
      label: '合计金额',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '按所选明细实际金额汇总',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '选填',
        rows: 3,
        maxlength: 500,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

export function formatFeeAmount(amount?: null | number) {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '-';
  }
  return Number(amount).toFixed(2);
}

export { z };

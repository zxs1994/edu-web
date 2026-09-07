import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RewardPoolApi } from '#/api/edu/reward-pool';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';
import dayjs from 'dayjs';

/** 流水搜索表单 */
export function useTxnGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'txnType',
      label: '流水类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.EDU_REWARD_POOL_TXN_TYPE).filter(
          (item) => item.value === 'RECHARGE' || item.value === 'ADJUST_DOWN',
        ),
        placeholder: '请选择流水类型',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 流水表格列 */
export function useTxnGridColumns(): VxeTableGridOptions<RewardPoolApi.RewardPoolTxn>['columns'] {
  return [
    {
      field: 'createTime',
      title: '时间',
      minWidth: 170,
      formatter: ({ cellValue }) => dayjs(cellValue as Date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'txnType',
      title: '类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_REWARD_POOL_TXN_TYPE },
      },
    },
    {
      field: 'amount',
      title: '变动金额',
      minWidth: 120,
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'totalAfter',
      title: '变动后总预算',
      minWidth: 130,
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'frozenAfter',
      title: '变动后已冻结',
      minWidth: 130,
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'paidAfter',
      title: '变动后已实发',
      minWidth: 130,
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'remark',
      title: '说明',
      minWidth: 200,
      showOverflow: true,
    },
    {
      field: 'creatorName',
      title: '操作人',
      minWidth: 120,
      formatter: ({ cellValue }) => cellValue || '-',
    },
  ];
}

/** 改名表单 */
export function useUpdateFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '池名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        maxlength: 100,
        placeholder: '请输入池名称',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        rows: 3,
        placeholder: '可选备注',
      },
    },
  ];
}

/** 调账表单 */
export function useAdjustFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'amount',
      label: '金额',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        min: 0.01,
        precision: 2,
        class: 'w-full',
        placeholder: '请输入金额',
      },
    },
    {
      fieldName: 'remark',
      label: '说明',
      component: 'Textarea',
      rules: 'required',
      componentProps: {
        maxlength: 500,
        rows: 3,
        placeholder: '请填写调账说明',
      },
    },
  ];
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

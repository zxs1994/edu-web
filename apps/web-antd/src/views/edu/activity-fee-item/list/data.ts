import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ActivityFeeItemApi } from '#/api/edu/activity-fee-item';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'feeCode',
      label: '明细编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入明细编号',
      },
    },
    {
      fieldName: 'activityName',
      label: '活动名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入活动名称',
      },
    },
    {
      fieldName: 'instanceCode',
      label: '实例编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入实例编号',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.EDU_FEE_ITEM_STATUS),
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'feeSide',
      label: '费用侧',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.EDU_FEE_SIDE),
        placeholder: '请选择费用侧',
      },
    },
    {
      fieldName: 'feeType',
      label: '费用类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.EDU_FEE_TYPE),
        placeholder: '请选择费用类型',
      },
    },
    {
      fieldName: 'currency',
      label: '币种',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.EDU_FEE_CURRENCY),
        placeholder: '请选择币种',
      },
    },
    {
      fieldName: 'generateTime',
      label: '生成时间',
      component: 'RangePicker',
      componentProps: getRangePickerDefaultProps(),
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions<ActivityFeeItemApi.FeeItem>['columns'] {
  return [
    {
      field: 'feeCode',
      title: '明细编号',
      minWidth: 170,
    },
    {
      field: 'activityName',
      title: '活动名称',
      minWidth: 150,
    },
    createRouterLinkColumn({
      field: 'instanceCode',
      title: '实例编号',
      path: '/edu/activity/instance/info',
      idField: 'instanceId',
      queryParam: 'id',
    }),
    {
      field: 'feeType',
      title: '费用类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_FEE_TYPE },
      },
    },
    {
      field: 'feeSide',
      title: '费用侧',
      minWidth: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_FEE_SIDE },
      },
    },
    {
      field: 'payeeUserName',
      title: '收款人',
      minWidth: 140,
    },
    {
      field: 'currency',
      title: '币种',
      minWidth: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_FEE_CURRENCY },
      },
    },
    {
      field: 'amount',
      title: '预算金额',
      minWidth: 100,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EDU_FEE_ITEM_STATUS },
      },
    },
    createRouterLinkColumn({
      field: 'paymentBillCode',
      title: '付款申请',
      path: '/edu/activity/payment/info',
      idField: 'paymentRequestId',
      queryParam: 'id',
    }),
    {
      field: 'generateTime',
      title: '生成时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      field: 'payTime',
      title: '付款时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      field: 'remark',
      title: '说明',
      minWidth: 140,
    },
  ];
}

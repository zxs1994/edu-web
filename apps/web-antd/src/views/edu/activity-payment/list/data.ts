import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ActivityPaymentApi } from '#/api/edu/activity-payment';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';
import { resolveOaDetailRoute } from '#/utils/oa-route-resolver';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'billCode',
      label: '申请单号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入申请单号',
      },
    },
    {
      fieldName: 'title',
      label: '申请事由',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入申请事由',
      },
    },
    {
      fieldName: 'processStatus',
      label: '审批状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
          'number',
        ),
        placeholder: '请选择审批状态',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: getRangePickerDefaultProps(),
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions<ActivityPaymentApi.PaymentRequest>['columns'] {
  return [
    createRouterLinkColumn({
      field: 'billCode',
      title: '申请单号',
      path: '/edu/activity/payment/info',
      idField: 'id',
      queryParam: 'id',
      resolveRoute: resolveOaDetailRoute('/edu/activity/payment/info'),
    }),
    {
      field: 'processStatus',
      title: '审批状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS },
      },
    },
    {
      field: 'activityName',
      title: '活动名称',
      minWidth: 160,
    },
    {
      field: 'title',
      title: '申请事由',
      minWidth: 180,
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
      field: 'totalAmount',
      title: '合计金额',
      minWidth: 110,
    },
    {
      field: 'applicantUserName',
      title: '申请人',
      minWidth: 100,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      field: 'actions',
      fixed: 'right',
      width: 140,
      slots: { default: 'actions' },
    },
  ];
}

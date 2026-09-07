import type { ColumnType } from 'ant-design-vue/es/table';

import { DICT_TYPE } from '@vben/constants';

import { formatFeeAmount } from '#/views/edu/activity/info/data';

/** 费用明细表格列（只读，与活动计划费用标准字段对齐：统一包干，不展示计费模式/单价/数量） */
export function useFeeItemColumns(): ColumnType[] {
  return [
    {
      title: '明细编号',
      dataIndex: 'feeCode',
      key: 'feeCode',
      width: 180,
    },
    {
      title: '费用类型',
      dataIndex: 'feeType',
      key: 'feeType',
      width: 100,
    },
    {
      title: '费用侧',
      dataIndex: 'feeSide',
      key: 'feeSide',
      width: 90,
    },
    {
      title: '收款人',
      dataIndex: 'payeeUserName',
      key: 'payeeUserName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
    },
    {
      title: '预算金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      align: 'right',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
    },
    {
      title: '生成时间',
      dataIndex: 'generateTime',
      key: 'generateTime',
      width: 170,
    },
    {
      title: '说明',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
  ];
}

export { DICT_TYPE, formatFeeAmount };

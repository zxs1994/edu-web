import type { TravelApplyBillApi } from '#/api/oa/travel';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

/**
 * 交通方式选项
 */
export const TRANSPORT_TYPE_OPTIONS = getDictOptions(
  DICT_TYPE.OA_TRANSPORT_TYPE,
  'number',
);

/**
 * 统一展示行程日期，兼容后端完整时间字符串和历史时间戳值
 */
export function formatItineraryDate(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.substring(0, 10) : value;
  }
  if (typeof value === 'number') {
    if (value === 0) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toISOString().substring(0, 10);
  }
  return '';
}

/**
 * 创建新的行程明细行
 */
export function createItineraryDetail(
  sortOrder: number,
): TravelApplyBillApi.TravelItinerary {
  return {
    id: undefined,
    billId: undefined,
    departureCity: '',
    destinationCity: '',
    startDate: '',
    endDate: '',
    transportType: undefined as unknown as number,
    remark: '',
    sortOrder,
    rowKey: `new_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
}

/**
 * 行程明细表格列配置
 */
export function useItineraryDetailColumns(readonly: boolean = false): any[] {
  return [
    {
      type: 'seq',
      width: 60,
      title: '序号',
    },
    {
      field: 'departureCity',
      title: '出发城市',
      minWidth: 130,
      slots: { default: 'departureCity' },
    },
    {
      field: 'destinationCity',
      title: '到达城市',
      minWidth: 130,
      slots: { default: 'destinationCity' },
    },
    {
      field: 'startDate',
      title: '开始日期',
      minWidth: 150,
      slots: { default: 'startDate' },
    },
    {
      field: 'endDate',
      title: '结束日期',
      minWidth: 150,
      slots: { default: 'endDate' },
    },
    {
      field: 'transportType',
      title: '交通方式',
      minWidth: 140,
      slots: { default: 'transportType' },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 150,
      slots: { default: 'remark' },
    },
    ...(readonly
      ? []
      : [
          {
            title: '操作',
            width: 80,
            fixed: 'right',
            slots: { default: 'actions' },
          },
        ]),
  ];
}

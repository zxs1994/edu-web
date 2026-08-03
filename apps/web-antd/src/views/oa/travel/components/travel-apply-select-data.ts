import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TravelApplyBillApi } from '#/api/oa/travel';

/** 差旅申请单选择-搜索表单 */
export function useTravelApplySelectFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'billCode',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入单据编号',
        allowClear: true,
      },
    },
    {
      fieldName: 'deptName',
      label: '申请部门',
      component: 'Input',
      componentProps: {
        placeholder: '请输入申请部门',
        allowClear: true,
      },
    },
  ];
}

/** 差旅申请单选择-表格列 */
export function useTravelApplySelectColumns(): VxeTableGridOptions<TravelApplyBillApi.TravelApplyBill>['columns'] {
  return [
    { type: 'checkbox', width: 60, align: 'center' },
    { field: 'billCode', title: '单据编号', width: 180 },
    { field: 'cause', title: '出差事由', minWidth: 140 },
    { field: 'travelStartDate', title: '开始日期', width: 120, formatter: ({ cellValue }: { cellValue: any }) => cellValue ? String(cellValue).substring(0, 10) : '' },
    { field: 'travelEndDate', title: '结束日期', width: 120, formatter: ({ cellValue }: { cellValue: any }) => cellValue ? String(cellValue).substring(0, 10) : '' },
    { field: 'travelDays', title: '出差天数', width: 100 },
    { field: 'creatorName', title: '申请人', width: 100 },
    { field: 'deptName', title: '部门', width: 140 },
    { field: 'createTime', title: '创建时间', width: 160, formatter: 'formatDateTime' },
  ];
}

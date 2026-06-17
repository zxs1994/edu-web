import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ContractBillApi } from '#/api/oa/contract';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { createRouterLinkColumn } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'billCode',
      label: '单据编号',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入单据编号' },
    },
    {
      fieldName: 'processStatus',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
    },
    {
      fieldName: 'contractType',
      label: '合同类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('oa_contract_type', 'number'),
        placeholder: '请选择合同类型',
      },
    },
    {
      fieldName: 'isMajor',
      label: '是否重大',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('COMMON_STATUS', 'number'),
        placeholder: '请选择是否重大',
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

export function useGridColumns(): VxeTableGridOptions<ContractBillApi.ContractBill>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: '/oa/contract/contract-bill-info',
      idField: 'id',
      queryParam: 'id',
    }),
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'contractTitle', title: '合同名称', minWidth: 150 },
    { field: 'contractCode', title: '合同编号', minWidth: 130 },
    {
      field: 'contractType',
      title: '合同类型',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: 'oa_contract_type' } },
    },
    { field: 'contractParty', title: '对方单位', minWidth: 150 },
    { field: 'contractAmount', title: '合同金额', minWidth: 120 },
    { field: 'signDate', title: '签订日期', minWidth: 120, formatter: 'formatDate' },
    { field: 'expiryDate', title: '截止日期', minWidth: 120, formatter: 'formatDate' },
    { field: 'responsiblePerson', title: '负责人', minWidth: 100 },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 150, fixed: 'right', slots: { default: 'actions' } },
  ];
}

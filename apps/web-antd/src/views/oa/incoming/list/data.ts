import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IncomingDocumentBillApi } from '#/api/oa/incoming';

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
      fieldName: 'docType',
      label: '来文类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('oa_incoming_doc_type', 'number'),
        placeholder: '请选择来文类型',
      },
    },
    {
      fieldName: 'handlingStatus',
      label: '办理状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('oa_handling_status', 'number'),
        placeholder: '请选择办理状态',
      },
    },
    {
      fieldName: 'isImportant',
      label: '是否重要',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions('COMMON_STATUS', 'number'),
        placeholder: '请选择是否重要',
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

export function useGridColumns(): VxeTableGridOptions<IncomingDocumentBillApi.IncomingDocumentBill>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: '/oa/incoming-document-info',
      idField: 'id',
      queryParam: 'id',
    }),
    {
      field: 'processStatus',
      title: '单据状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'docTitle', title: '来文标题', minWidth: 150 },
    { field: 'docNumber', title: '来文字号', minWidth: 130 },
    { field: 'sender', title: '发文单位', minWidth: 150 },
    {
      field: 'docType',
      title: '来文类型',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: 'oa_incoming_doc_type' } },
    },
    { field: 'receiveDate', title: '收文日期', minWidth: 120 },
    {
      field: 'handlingStatus',
      title: '办理状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: 'oa_handling_status' } },
    },
    {
      field: 'isImportant',
      title: '是否重要',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'COMMON_STATUS' } },
    },
    { field: 'creatorName', title: '申请人', minWidth: 100 },
    { field: 'deptName', title: '申请部门', minWidth: 120 },
    { field: 'createTime', title: '创建时间', minWidth: 140, formatter: 'formatDateTime' },
    { title: '操作', width: 100, fixed: 'right', slots: { default: 'actions' } },
  ];
}

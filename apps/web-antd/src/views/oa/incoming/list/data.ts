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
      fieldName: 'docTitle',
      label: '公文标题',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入公文标题' },
    },
    {
      fieldName: 'docNumber',
      label: '来文字号',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入来文字号' },
    },
    {
      fieldName: 'processStatus',
      label: '流程状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, 'number'),
        placeholder: '请选择流程状态',
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
    { field: 'docTitle', title: '公文标题', minWidth: 180 },
    { field: 'docNumber', title: '来文字号', minWidth: 130 },
    {
      field: 'secrecyLevel',
      title: '密级',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'oa_secrecy_level' } },
    },
    {
      field: 'urgencyLevel',
      title: '紧急程度',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'oa_urgency_level' } },
    },
    {
      field: 'docType',
      title: '收文类型',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'oa_incoming_doc_type' } },
    },
    { field: 'handlingDeptName', title: '收文部门', minWidth: 120 },
    { field: 'hostPerson', title: '主办人', minWidth: 100 },
    {
      field: 'handlingStatus',
      title: '办理状态',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: 'oa_handling_status' } },
    },
    {
      field: 'processStatus',
      title: '流程状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'createTime', title: '创建时间', minWidth: 160, formatter: 'formatDateTime' },
    { title: '操作', width: 100, fixed: 'right', slots: { default: 'actions' } },
  ];
}

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DocumentDispatchBillApi } from '#/api/oa/document';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { resolveOaDetailRoute } from '#/utils/oa-route-resolver';

import { createRouterLinkColumn } from '#/adapter/vxe-table';

/** 缓存部门列表，供 mainRecipients ID→名称映射 */
export let cachedDeptList: Array<{ id: number; name: string }> = [];

/** 将逗号分隔的部门 ID 字符串转为部门名称 */
function resolveDeptNames(idsStr: string): string {
  if (!idsStr || cachedDeptList.length === 0) return idsStr || '';
  return idsStr
    .split(',')
    .map((id) => {
      const dept = cachedDeptList.find((d) => d.id === Number(id));
      return dept ? dept.name : id;
    })
    .join('、');
}

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
      label: '发文字号',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入发文字号' },
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
  ];
}

export function useGridColumns(): VxeTableGridOptions<DocumentDispatchBillApi.DocumentDispatchBill>['columns'] {
  return [
    createRouterLinkColumn({
      field: 'billCode',
      title: '单据编号',
      path: '/oa/document/document-dispatch-info',
      idField: 'id',
      queryParam: 'id',
      resolveRoute: resolveOaDetailRoute('/oa/document/document-dispatch-info'),
    }),
    { field: 'docTitle', title: '公文标题', minWidth: 150 },
    {
      field: 'docNumber',
      title: '发文字号',
      minWidth: 180,
      formatter: ({ row }) => {
        const { docNumberPrefix, docNumberYear, docNumberSerial } = row;
        if (docNumberPrefix || docNumberYear || docNumberSerial) {
          return `${docNumberPrefix || ''}〔${docNumberYear || ''}〕${docNumberSerial || ''}号`;
        }
        return row.docNumber || '';
      },
    },
    {
      field: 'secrecyLevel',
      title: '密级',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.OA_SECRECY_LEVEL } },
    },
    {
      field: 'urgencyLevel',
      title: '紧急程度',
      minWidth: 100,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.OA_URGENCY_LEVEL } },
    },
    { field: 'deptName', title: '发文部门', minWidth: 120 },
    {
      field: 'mainRecipients',
      title: '主送部门',
      minWidth: 180,
      formatter: ({ row }) => resolveDeptNames(row.mainRecipients),
    },
    {
      field: 'processStatus',
      title: '流程状态',
      minWidth: 120,
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS } },
    },
    { field: 'createTime', title: '创建时间', minWidth: 160, formatter: 'formatDateTime' },
    { title: '操作', width: 150, fixed: 'right', slots: { default: 'actions' } },
  ];
}

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getSimpleProcessDefinitionList } from '#/api/bpm/definition';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';

/** BPM 流程分类：协同办公 */
export const OA_CATEGORY_CODE = 'OA';

/** 已完整接入纠错发起的流程定义 Key（发起纠错仍依赖后端 BillCorrectionSourceService） */
export const CORRECTABLE_PROCESS_KEYS = [
  'oa_contract_bill',
  'oa_expense_reimburse_bill',
  'oa_seal_apply_bill',
  'oa_project_initiation_bill',
  'oa_document_dispatch_bill',
];

/** 已提交流程状态（排除未提交） */
export const SUBMITTED_PROCESS_STATUSES = [
  BpmProcessInstanceStatus.RUNNING,
  BpmProcessInstanceStatus.APPROVE,
  BpmProcessInstanceStatus.REJECT,
  BpmProcessInstanceStatus.CANCEL,
];

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'billCode',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        placeholder: '流程变量中的单据编号',
        allowClear: true,
      },
    },
    {
      fieldName: 'name',
      label: '流程名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入流程名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'processDefinitionKey',
      label: '单据类型',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择单据类型',
        allowClear: true,
        api: () => getSimpleProcessDefinitionList(OA_CATEGORY_CODE),
        labelField: 'name',
        valueField: 'key',
      },
    },
    {
      fieldName: 'startUserId',
      label: '发起人',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择发起人',
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
      },
    },
    {
      fieldName: 'status',
      label: '流程状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
          'number',
        ).filter((item) =>
          SUBMITTED_PROCESS_STATUSES.includes(item.value as number),
        ),
        placeholder: '请选择流程状态',
        allowClear: true,
      },
    },
    {
      fieldName: 'endTime',
      label: '办结时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'billCode',
      title: '单据编号',
      minWidth: 160,
      formatter: ({ row }: { row: any }) =>
        row.summary?.find((s: any) => s.key === 'billCode')?.value ||
        row.formVariables?.billCode ||
        '',
    },
    {
      field: 'name',
      title: '流程名称',
      minWidth: 180,
      fixed: 'left',
    },
    {
      field: 'startUser.nickname',
      title: '发起人',
      minWidth: 100,
    },
    {
      field: 'startUser.deptName',
      title: '发起部门',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '流程状态',
      minWidth: 100,
      cellRender: {
        name: 'CellBillProcessStatus',
        props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS },
      },
    },
    {
      field: 'endTime',
      title: '办结时间',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

export function useInitiateFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'correctionType',
      label: '纠错类型',
      component: 'Select',
      rules: 'required',
      defaultValue: 1,
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PRESIDENT_CORRECTION_TYPE, 'number'),
        placeholder: '请选择纠错类型',
      },
    },
    {
      fieldName: 'correctionReason',
      label: '撤销/纠错理由',
      component: 'Textarea',
      rules: 'required',
      componentProps: {
        rows: 4,
        placeholder: '请输入撤销/纠错理由',
      },
    },
    {
      fieldName: 'correctionResult',
      label: '处理结果',
      component: 'Textarea',
      dependencies: {
        triggerFields: ['correctionType'],
        show: (values) => values.correctionType === 2,
        rules: (values) => (values.correctionType === 2 ? 'required' : ''),
      },
      componentProps: {
        rows: 3,
        placeholder: '请输入理事会决议处理结果',
      },
    },
  ];
}

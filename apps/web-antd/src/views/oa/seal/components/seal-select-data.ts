import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SealApi } from '#/api/oa/seal/sealinfo';

import { handleTree } from '@vben/utils';

import { getCompanyList } from '#/api/system/dept';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

/** 印章选择的搜索表单 */
export function useSealSelectFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'sealNo',
      label: '印章编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入印章编号',
      },
    },
    {
      fieldName: 'sealName',
      label: '印章名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入印章名称',
      },
    },
    {
      fieldName: 'sealType',
      label: '印章类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.OA_SEAL_TYPE, 'number'),
        placeholder: '请选择印章类型',
      },
    },
  ];
}

/** 印章选择的表格列 */
export function useSealSelectColumns(): VxeGridProps['columns'] {
  return [
    {
      type: 'radio',
      width: 60,
      align: 'center',
    },
    {
      title: '印章编号',
      field: 'sealNo',
      width: 120,
    },
    {
      title: '印章名称',
      field: 'sealName',
      width: 150,
    },
    {
      title: '印章类型',
      field: 'sealType',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: {
          dictType: DICT_TYPE.OA_SEAL_TYPE,
        },
      },
    },
    {
      title: '所属部门',
      field: 'keeperDeptName',
      width: 200,
    },
    {
      title: '保管人',
      field: 'keeperName',
      width: 100,
    },
    {
      title: '状态',
      field: 'status',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: {
          dictType: DICT_TYPE.OA_SEAL_STATUS,
        },
      },
    },
  ];
}

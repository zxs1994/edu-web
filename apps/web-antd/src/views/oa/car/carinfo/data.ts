import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CarApi } from '#/api/oa/car/carinfo';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'carNo',
      label: '车牌号',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入车牌号',
      },
    },
    {
      fieldName: 'carName',
      label: '车辆名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入车辆名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_CAR_USE_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'carType',
      label: '车型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_CAR_TYPE, 'number'),
        placeholder: '请选择车型',
      },
    },
    {
      fieldName: 'carCls',
      label: '分类',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_CAR_CLS, 'number'),
        placeholder: '请选择分类',
      },
    },

    {
      fieldName: 'brand',
      label: '品牌型号',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入品牌型号',
      },
    },
    {
      fieldName: 'seatNum',
      label: '车座',
      component: 'Input',
      componentProps: {
        placeholder: '请输入车座',
      },
    },
    {
      fieldName: 'forceInsuranceDate',
      label: '交强险到期日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'businessInsuranceDate',
      label: '商业险到期日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'yearCheckDate',
      label: '年检日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'Input',
      componentProps: {
        placeholder: '请输入显示顺序',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      // 备注字段占据整行
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'carNo',
      label: '车牌号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入车牌号',
      },
    },
    {
      fieldName: 'carName',
      label: '车辆名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入车辆名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.OA_CAR_USE_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'carType',
      label: '车型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.OA_CAR_TYPE, 'number'),
        placeholder: '请选择车型',
      },
    },

    {
      fieldName: 'brand',
      label: '品牌型号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入品牌型号',
      },
    },
    {
      fieldName: 'forceInsuranceDate',
      label: '交强险到期日期',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'businessInsuranceDate',
      label: '商业险到期日期',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'yearCheckDate',
      label: '年检日期',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<CarApi.Car>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'carNo',
      title: '车牌号',
      minWidth: 120,
    },
    {
      field: 'carName',
      title: '车辆名称',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_CAR_USE_STATUS },
      },
    },
    {
      field: 'carType',
      title: '车型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_CAR_TYPE },
      },
    },
    {
      field: 'carCls',
      title: '分类',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_CAR_CLS },
      },
    },
    {
      field: 'brand',
      title: '品牌型号',
      minWidth: 120,
    },
    {
      field: 'seatNum',
      title: '车座',
      minWidth: 120,
    },
    {
      field: 'forceInsuranceDate',
      title: '交强险到期日期',
      minWidth: 120,
      formatter: 'formatDate',
    },
    {
      field: 'businessInsuranceDate',
      title: '商业险到期日期',
      minWidth: 120,
      formatter: 'formatDate',
    },
    {
      field: 'yearCheckDate',
      title: '年检日期',
      minWidth: 120,
      formatter: 'formatDate',
    },

    {
      field: 'sort',
      title: '显示顺序',
      minWidth: 120,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 120,
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

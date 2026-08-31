import type { Ref } from 'vue';

import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button, Input, InputNumber, Select } from 'ant-design-vue';

import { getSimpleUserList } from '#/api/system/user';

/** 负责人候选用户（排除 student 角色） */
async function getOwnerUserSimpleList() {
  return getSimpleUserList({ excludeRoleCode: 'student' });
}

/** 表单 schema */
export function useFormSchema(
  readonly?: Ref<boolean>,
  openParticipantSelect?: () => void,
): VbenFormSchema[] {
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
      fieldName: 'billCode',
      label: '单据编号',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '活动名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入活动名称',
        maxlength: 200,
      },
    },
    {
      fieldName: 'activityType',
      label: '活动类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.EDU_ACTIVITY_TYPE),
        placeholder: '请选择活动类型',
        allowClear: true,
      },
      dependencies: {
        triggerFields: ['id'],
        disabled: (values) => !!values.id,
      },
    },
    {
      fieldName: 'activitySubtype',
      label: '活动子类型',
      component: 'Input',
      componentProps: {
        placeholder: '请输入活动子类型',
        maxlength: 100,
      },
    },
    {
      fieldName: 'cycleType',
      label: '周期类型',
      rules: 'required',
      component: 'Select',
      defaultValue: 'ONCE',
      componentProps: {
        options: getDictOptions(DICT_TYPE.EDU_ACTIVITY_CYCLE),
        placeholder: '请选择周期类型',
      },
    },
    {
      fieldName: 'startDate',
      label: '开始日期',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择开始日期',
        class: 'w-full',
      },
    },
    {
      fieldName: 'enrollStartTime',
      label: '报名开始',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '可选',
        class: 'w-full',
      },
    },
    {
      fieldName: 'enrollEndTime',
      label: '报名结束',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '可选',
        class: 'w-full',
      },
    },
    {
      fieldName: 'budgetAmount',
      label: '预算总额',
      rules: 'required',
      component: 'InputNumber',
      componentProps: {
        min: 0.01,
        precision: 2,
        placeholder: '请输入预算总额',
        class: 'w-full',
      },
    },
    {
      fieldName: 'ownerUserIds',
      label: '负责人',
      rules: 'required',
      component: 'ApiSelect',
      componentProps: {
        api: getOwnerUserSimpleList,
        labelField: 'nickname',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择负责人',
        allowClear: true,
      },
    },
    {
      fieldName: 'participantNames',
      label: '参与人',
      component: 'HelpInput',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请选择参与人（学生/教培）',
        bind: {
          readonly,
          onClick: () => {
            if (!readonly?.value) {
              openParticipantSelect?.();
            }
          },
        },
        onClick: () => {
          if (!readonly?.value) {
            openParticipantSelect?.();
          }
        },
      },
    },
    {
      fieldName: 'content',
      label: '活动内容',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入活动内容',
        rows: 4,
        maxlength: 2000,
        showCount: true,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
        rows: 4,
        maxlength: 500,
        showCount: true,
      },
    },
  ];
}

function dictLabel(type: string, value: unknown) {
  const options = getDictOptions(type);
  const hit = options.find((item) => String(item.value) === String(value));
  return hit?.label ?? value ?? '-';
}

/** 费用标准可编辑列 */
export function useFeeStandardColumns(
  readonly: Ref<boolean>,
  handleDelete: (index: number) => void,
  payeeUserOptions: Ref<{ label: string; value: number }[]>,
) {
  return [
    {
      title: '费用类型',
      dataIndex: 'feeType',
      width: 120,
      customRender: ({ text, record }: any) => {
        if (readonly.value) return dictLabel(DICT_TYPE.EDU_FEE_TYPE, text);
        return h(Select, {
          value: text,
          options: getDictOptions(DICT_TYPE.EDU_FEE_TYPE),
          placeholder: '费用类型',
          style: { width: '100%' },
          onChange: (val: any) => {
            if (record) record.feeType = val;
          },
        } as any);
      },
    },
    {
      title: '计费模式',
      dataIndex: 'feeMode',
      width: 120,
      customRender: ({ text, record }: any) => {
        if (readonly.value) return dictLabel(DICT_TYPE.EDU_FEE_MODE, text);
        return h(Select, {
          value: text,
          options: getDictOptions(DICT_TYPE.EDU_FEE_MODE),
          placeholder: '计费模式',
          style: { width: '100%' },
          onChange: (val: any) => {
            if (record) record.feeMode = val;
          },
        } as any);
      },
    },
    {
      title: '币种',
      dataIndex: 'currency',
      width: 100,
      customRender: ({ text, record }: any) => {
        if (readonly.value) return dictLabel(DICT_TYPE.EDU_FEE_CURRENCY, text);
        return h(Select, {
          value: text,
          options: getDictOptions(DICT_TYPE.EDU_FEE_CURRENCY),
          placeholder: '币种',
          style: { width: '100%' },
          onChange: (val: any) => {
            if (record) record.currency = val;
          },
        } as any);
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      customRender: ({ text, record }: any) => {
        if (readonly.value) return text ?? '-';
        return h(InputNumber, {
          value: text,
          min: 0,
          precision: 2,
          placeholder: '金额',
          style: { width: '100%' },
          onChange: (val: any) => {
            if (record) record.amount = val;
          },
        } as any);
      },
    },
    {
      title: '收款人',
      dataIndex: 'payeeUserId',
      width: 180,
      customRender: ({ text, record }: any) => {
        if (readonly.value) {
          const hit = payeeUserOptions.value.find(
            (item) => item.value === Number(text),
          );
          return hit?.label || record.payeeUserName || '-';
        }
        return h(Select, {
          value: text,
          options: payeeUserOptions.value,
          placeholder: '请选择收款人',
          allowClear: true,
          showSearch: true,
          optionFilterProp: 'label',
          style: { width: '100%' },
          onChange: (val: any) => {
            if (record) {
              record.payeeUserId = val;
              const hit = payeeUserOptions.value.find(
                (item) => item.value === Number(val),
              );
              record.payeeUserName = hit?.label;
            }
          },
        } as any);
      },
    },
    {
      title: '费用侧',
      dataIndex: 'feeSide',
      width: 120,
      customRender: ({ text, record }: any) => {
        if (readonly.value) return dictLabel(DICT_TYPE.EDU_FEE_SIDE, text);
        return h(Select, {
          value: text,
          options: getDictOptions(DICT_TYPE.EDU_FEE_SIDE),
          placeholder: '费用侧',
          style: { width: '100%' },
          onChange: (val: any) => {
            if (record) record.feeSide = val;
          },
        } as any);
      },
    },
    {
      title: '费用项说明',
      dataIndex: 'remark',
      width: 150,
      customRender: ({ text, record }: any) => {
        if (readonly.value) return text || '-';
        return h(Input, {
          value: text,
          placeholder: '费用项说明',
          onChange: (e: any) => {
            if (record) record.remark = e.target.value;
          },
        } as any);
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      customRender: ({ index }: any) => {
        if (readonly.value) return '-';
        return h(
          Button,
          {
            type: 'link',
            size: 'small',
            danger: true,
            onClick: () => handleDelete(index),
          },
          () => '删除',
        );
      },
    },
  ];
}

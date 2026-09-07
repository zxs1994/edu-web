import type { Ref } from 'vue';

import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { Button, Input, InputNumber, Select } from 'ant-design-vue';

import dayjs from 'dayjs';

import type { ActivityApi } from '#/api/edu/activity';
import type { SystemUserApi } from '#/api/system/user';

import { getTeacherByUserId } from '#/api/edu/teacher';
import { getSimpleUserList } from '#/api/system/user';
import { z } from '#/adapter/form';
import { getRangePickerDefaultProps } from '#/utils';

/** 培训费费用类型（字典 edu_fee_type） */
export const FEE_TYPE_TRAINING = 'TRAINING';

/** 其他费用类型（字典 edu_fee_type）：收款人非必填 */
export const FEE_TYPE_OTHER = 'OTHER';

/** 选中教培收款人后，自动带出档案报酬金额（币种人民币） */
export async function fillAmountFromTeacherReward(
  record: Record<string, any>,
  payeeUserId: null | number | undefined,
) {
  if (record?.feeSide !== 'teacher' || payeeUserId == null || record.feeType !== FEE_TYPE_TRAINING) {
    return;
  }
  try {
    const teacher = await getTeacherByUserId(Number(payeeUserId));
    record.amount = teacher.rewardStandard;
    record.currency = 'CNY';
  } catch (error) {
    console.warn('加载教培报酬/奖励标准失败', error);
  }
}

function createFeeStandardClientKey() {
  return `fee_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isTrainingFeeType(feeType?: null | string) {
  return String(feeType || '').toUpperCase() === FEE_TYPE_TRAINING;
}

/**
 * 选择参与人后：按所选教培同步 TRAINING 费用标准
 * - 删除收款人已不在参与教培中的培训费行
 * - 每位参与教培若尚无「培训费 + 该教培收款人」行，则自动新增一条包干费用
 * - 金额优先取教培档案报酬/奖励标准，币种人民币
 */
export async function ensureTrainingFeeStandardsForTeachers(
  feeStandards: ActivityApi.FeeStandard[],
  teachers: SystemUserApi.User[],
): Promise<ActivityApi.FeeStandard[]> {
  const teacherUserIds = new Set(
    teachers
      .map((teacher) => teacher.id)
      .filter((id): id is number => id != null)
      .map((id) => Number(id)),
  );

  // 先清理：TRAINING 且收款人不是当前参与教培
  const next = feeStandards.filter((fee) => {
    if (!isTrainingFeeType(fee.feeType)) {
      return true;
    }
    if (fee.payeeUserId == null) {
      // 无收款人的培训费：没有参与教培时一并去掉
      return teacherUserIds.size > 0;
    }
    return teacherUserIds.has(Number(fee.payeeUserId));
  });

  for (const teacher of teachers) {
    const teacherUserId = teacher.id;
    if (teacherUserId == null) {
      continue;
    }
    const exists = next.some(
      (fee) =>
        isTrainingFeeType(fee.feeType) &&
        Number(fee.payeeUserId) === Number(teacherUserId),
    );
    if (exists) {
      continue;
    }

    const row: ActivityApi.FeeStandard = {
      _clientRowKey: createFeeStandardClientKey(),
      feeType: FEE_TYPE_TRAINING,
      feeMode: 'fixed',
      currency: 'CNY',
      amount: undefined,
      feeSide: 'teacher',
      payeeUserId: teacherUserId,
      payeeUserName: teacher.nickname || teacher.username || undefined,
      remark: '',
    };
    await fillAmountFromTeacherReward(row, teacherUserId);
    next.push(row);
  }
  return next;
}

/** 负责人候选用户（排除 student 角色） */
async function getOwnerUserSimpleList() {
  return getSimpleUserList({ excludeRoleCode: 'student' });
}

/** 报名时间范围 → 后端字段 */
export function splitEnrollTimeRange(
  range?: [string, string] | null | string[],
) {
  if (!range || !Array.isArray(range) || range.length < 2) {
    return { enrollStartTime: undefined, enrollEndTime: undefined };
  }
  const [start, end] = range;
  return {
    enrollStartTime: start || undefined,
    enrollEndTime: end || undefined,
  };
}

/** 统一后端日期时间为 RangePicker 可识别的字符串 */
export function normalizeDateTimeValue(value?: unknown) {
  if (value == null || value === '') {
    return undefined;
  }
  const formatted = formatDateTime(value as Parameters<typeof formatDateTime>[0]);
  return formatted || undefined;
}

/** 后端字段 → 报名时间范围 */
export function buildEnrollTimeRange(
  enrollStartTime?: unknown,
  enrollEndTime?: unknown,
): [string, string] | undefined {
  const normalizedStart = normalizeDateTimeValue(enrollStartTime);
  const normalizedEnd = normalizeDateTimeValue(enrollEndTime);
  if (normalizedStart && normalizedEnd) {
    return [normalizedStart, normalizedEnd];
  }
  return undefined;
}

/** 校验报名结束时间须早于活动开始时间 */
export function validateEnrollEndBeforeStartDate(
  startDate?: null | string,
  enrollTimeRange?: null | string[],
): { message?: string; valid: boolean } {
  if (!startDate || !enrollTimeRange?.[1]) {
    return { valid: true };
  }
  const enrollEnd = dayjs(enrollTimeRange[1]);
  const activityStart = dayjs(startDate);
  if (!enrollEnd.isBefore(activityStart)) {
    return { valid: false, message: '报名结束时间须早于活动开始时间' };
  }
  return { valid: true };
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
      fieldName: 'ownerUserIds',
      label: '活动负责人',
      rules: 'required',
      component: 'ApiSelect',
      componentProps: {
        api: getOwnerUserSimpleList,
        labelField: 'nickname',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择活动负责人',
        allowClear: true,
      },
    },
    {
      fieldName: 'enrollTimeRange',
      label: '报名时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        format: 'MM-DD HH:mm:ss',
        class: 'w-full',
        placeholder: ['报名开始', '报名结束'],
      },
      dependencies: {
        triggerFields: ['startDate', 'enrollTimeRange'],
        rules(values) {
          return z
            .array(z.string(), {
              required_error: '请选择报名时间',
              invalid_type_error: '请选择报名时间',
            })
            .min(2, '请选择报名时间')
            .refine(
              (range) =>
                validateEnrollEndBeforeStartDate(
                  values.startDate as string | undefined,
                  range,
                ).valid,
              '报名结束时间须早于活动开始时间',
            );
        },
      },
    },
    {
      fieldName: 'startDate',
      label: '活动开始时间',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择活动开始时间',
        class: 'w-full',
      },
    },
    {
      fieldName: 'budgetAmount',
      label: '预算总额',
      help: '根据下方费用标准自动汇总，无需填写',
      component: 'Input',
      componentProps: {
        class: 'w-full',
        disabled: true,
      },
      dependencies: {
        triggerFields: ['id'],
        // 新建无 id 时不展示，保存后/编辑时再显示
        show: (values) => !!values.id,
      },
    },
    {
      fieldName: 'participantNames',
      label: '参与人',
      rules: 'required',
      component: 'ParticipantSelectField',
      formItemClass: 'col-span-4',
      componentProps: {
        readonly,
        onSelect: () => openParticipantSelect?.(),
      },
    },
    {
      fieldName: 'content',
      label: '活动内容',
      rules: 'required',
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
    {
      fieldName: 'attachments',
      label: '附件',
      component: 'ActivityAttachmentField',
      formItemClass: 'col-span-2',
      defaultValue: [],
      componentProps: {
        disabled: readonly,
        maxCount: 10,
      },
    },
  ];
}

function dictLabel(type: string, value: unknown) {
  const options = getDictOptions(type);
  const hit = options.find((item) => String(item.value) === String(value));
  return hit?.label ?? value ?? '-';
}

/** 表头必填标识 */
function requiredColumnTitle(label: string) {
  return () =>
    h('span', [
      h('span', { style: { color: '#ff4d4f', marginRight: '4px' } }, '*'),
      label,
    ]);
}

/** 教培侧/学生侧须指定收款人；费用类型为「其他」时不必填 */
export function isFeePayeeRequired(record?: {
  feeMode?: string;
  feeSide?: string;
  feeType?: string;
}) {
  if (String(record?.feeType || '').toUpperCase() === FEE_TYPE_OTHER) {
    return false;
  }
  return record?.feeSide === 'teacher' || record?.feeSide === 'student';
}

function clearFeePayee(record: Record<string, any>) {
  record.payeeUserId = undefined;
  record.payeeUserName = undefined;
  record.amount = undefined;
}

function resolveFeeAmountPlaceholder(_record?: {
  feeMode?: string;
  feeSide?: string;
}) {
  return '预算金额';
}

export function mapUserPayeeOptions(users: {
  id?: number;
  nickname?: string;
  username?: string;
}[]) {
  return (users ?? []).map((user) => ({
    label: user.username
      ? `${user.nickname}(${user.username})`
      : user.nickname || String(user.id),
    value: user.id as number,
  }));
}

function resolvePayeeUserOptions(
  record: { feeSide?: string } | undefined,
  teacherPayeeUserOptions: { label: string; value: number }[],
  studentPayeeUserOptions: { label: string; value: number }[],
) {
  if (record?.feeSide === 'student') {
    return studentPayeeUserOptions;
  }
  if (record?.feeSide === 'teacher') {
    return teacherPayeeUserOptions;
  }
  return [];
}

function resolvePayeePlaceholder(record?: {
  feeSide?: string;
  feeType?: string;
}) {
  if (String(record?.feeType || '').toUpperCase() === FEE_TYPE_OTHER) {
    return '选填';
  }
  if (record?.feeSide === 'student') {
    return '请选择学生';
  }
  if (record?.feeSide === 'teacher') {
    return '请选择教培';
  }
  return '请先选择费用侧';
}

export interface FeeStandardSummaryRow {
  currency: string;
  currencyLabel: string;
  teacherTotal: number;
  studentTotal: number;
  total: number;
}

export interface FeeStandardSummaryResult {
  rowCount: number;
  validRowCount: number;
  rows: FeeStandardSummaryRow[];
  cnyTotal: number;
}

function formatFeeAmount(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 回显：未填/0 视为空，避免 InputNumber 显示 0.00 */
export function normalizeFeeAmountDisplay(
  amount?: null | number | string,
): number | undefined {
  if (amount == null || amount === '') {
    return undefined;
  }
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) {
    return undefined;
  }
  return n;
}

function resolveFeeCurrencyLabel(currency: string) {
  const options = getDictOptions(DICT_TYPE.EDU_FEE_CURRENCY);
  const hit = options.find((item) => String(item.value) === currency);
  return hit?.label ?? currency;
}

/** 费用标准预估合计：教培侧 + 学生侧均按金额汇总（无积分） */
export function calcFeeStandardSummary(
  feeStandards: Array<{
    amount?: number | string;
    currency?: string;
    feeMode?: string;
    feeSide?: string;
    feeType?: string;
  }>,
): FeeStandardSummaryResult {
  const bucket = new Map<
    string,
    {
      studentTotal: number;
      teacherTotal: number;
      total: number;
    }
  >();
  let validRowCount = 0;
  let cnyTotal = 0;

  for (const fee of feeStandards) {
    const lineTotal = normalizeFeeAmountDisplay(fee.amount);
    if (lineTotal == null) {
      continue;
    }
    validRowCount += 1;
    const currency = String(fee.currency || 'CNY').toUpperCase();
    const current = bucket.get(currency) ?? {
      teacherTotal: 0,
      studentTotal: 0,
      total: 0,
    };
    current.total += lineTotal;
    if (fee.feeSide === 'teacher') {
      current.teacherTotal += lineTotal;
    } else if (fee.feeSide === 'student') {
      current.studentTotal += lineTotal;
    }
    bucket.set(currency, current);
    // 预算总额（人民币预估）：CNY 行教培侧、学生侧金额一并计入
    if (currency === 'CNY') {
      cnyTotal += lineTotal;
    }
  }

  const rows = [...bucket.entries()]
    .map(([currency, item]) => ({
      currency,
      currencyLabel: resolveFeeCurrencyLabel(currency),
      teacherTotal: item.teacherTotal,
      studentTotal: item.studentTotal,
      total: item.total,
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));

  return {
    rowCount: feeStandards.length,
    validRowCount,
    rows,
    cnyTotal,
  };
}

export { formatFeeAmount };

/** 提交前校验费用标准 */
export function validateFeeStandards(
  feeStandards: Array<Record<string, any>>,
): { valid: boolean; message?: string } {
  if (!feeStandards.length) {
    return { valid: false, message: '请至少配置一条费用标准' };
  }
  for (let i = 0; i < feeStandards.length; i++) {
    const fee = feeStandards[i]!;
    const rowNo = i + 1;
    if (!fee.feeType) {
      return { valid: false, message: `费用标准第 ${rowNo} 行：请选择费用类型` };
    }
    fee.feeMode = 'fixed';
    if (!fee.currency) {
      return { valid: false, message: `费用标准第 ${rowNo} 行：请选择币种` };
    }
    if (fee.amount == null || fee.amount === '') {
      return { valid: false, message: `费用标准第 ${rowNo} 行：请填写预算金额` };
    }
    if (!fee.feeSide) {
      return { valid: false, message: `费用标准第 ${rowNo} 行：请选择费用侧` };
    }
    if (isFeePayeeRequired(fee) && !fee.payeeUserId) {
      const payeeLabel = fee.feeSide === 'student' ? '学生' : '教培';
      return {
        valid: false,
        message: `费用标准第 ${rowNo} 行：须选择${payeeLabel}收款人`,
      };
    }
  }
  return { valid: true };
}

/** 费用标准可编辑列 */
export function useFeeStandardColumns(
  readonly: Ref<boolean>,
  handleDelete: (index: number) => void,
  payeeUserOptions: {
    student: Ref<{ label: string; value: number }[]>;
    teacher: Ref<{ label: string; value: number }[]>;
  },
) {
  return [
    {
      title: requiredColumnTitle('费用类型'),
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
      title: requiredColumnTitle('费用侧'),
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
            if (!record) return;
            record.feeSide = val;
            record.feeMode = 'fixed';
            clearFeePayee(record);
          },
        } as any);
      },
    },
    {
      title: () =>
        h('span', [
          h('span', { style: { color: '#ff4d4f', marginRight: '4px' } }, '*'),
          '收款人',
        ]),
      dataIndex: 'payeeUserId',
      width: 200,
      customRender: ({ text, record }: any) => {
        const rowPayeeOptions = resolvePayeeUserOptions(
          record,
          payeeUserOptions.teacher.value,
          payeeUserOptions.student.value,
        );
        const allPayeeOptions = [
          ...payeeUserOptions.teacher.value,
          ...payeeUserOptions.student.value,
        ];
        if (readonly.value) {
          const hit = allPayeeOptions.find(
            (item) => item.value === Number(text),
          );
          return hit?.label || record.payeeUserName || '-';
        }
        return h(Select, {
          value: text,
          options: rowPayeeOptions,
          placeholder: resolvePayeePlaceholder(record),
          allowClear: true,
          showSearch: true,
          optionFilterProp: 'label',
          disabled: !record?.feeSide,
          style: { width: '100%' },
          onChange: async (val: any) => {
            if (record) {
              record.payeeUserId = val;
              record.feeMode = 'fixed';
              const hit = rowPayeeOptions.find(
                (item) => item.value === Number(val),
              );
              record.payeeUserName = hit?.label;
              await fillAmountFromTeacherReward(record, val);
            }
          },
        } as any);
      },
    },
    {
      title: requiredColumnTitle('币种'),
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
      title: requiredColumnTitle('预算金额'),
      dataIndex: 'amount',
      width: 120,
      customRender: ({ text, record }: any) => {
        const displayAmount = normalizeFeeAmountDisplay(text);
        if (readonly.value) {
          return displayAmount == null ? '-' : formatFeeAmount(displayAmount);
        }
        const amountPlaceholder = resolveFeeAmountPlaceholder(record);
        return h(InputNumber, {
          value: displayAmount ?? null,
          min: 0,
          precision: 2,
          placeholder: amountPlaceholder,
          style: { width: '100%' },
          onChange: (val: any) => {
            if (record) {
              record.amount = normalizeFeeAmountDisplay(val);
            }
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

<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { ActivityPaymentApi } from '#/api/edu/activity-payment';

import { computed, onMounted, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';

import { Loading } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
  DICT_TYPE,
} from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Button, InputNumber, message, Table } from 'ant-design-vue';

import { withdrawProcessToStart } from '#/api/bpm/task';
import { getActivityInstance } from '#/api/edu/activity-instance';
import {
  deleteActivityPayment,
  getActivityPayment,
  getSelectablePaymentFeeItems,
  saveActivityPayment,
  submitActivityPayment,
} from '#/api/edu/activity-payment';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { formatFeeAmount, useFormSchema } from './data';

defineOptions({ name: 'EduActivityPaymentInfo' });

const props = defineProps<{
  activityNodes?: any[];
  id?: number | string;
  isApproval?: boolean;
  nodeKey?: string;
  nodeKeyName?: string;
  processDefinition?: any;
  processInstance?: any;
}>();

const route = useRoute();
const userStore = useUserStore();
const { closeCurrentTab } = useTabs();

const formData = ref<Partial<ActivityPaymentApi.PaymentRequest>>({});
const readonly = ref(false);
const loading = ref(false);
const feeLoading = ref(false);
const basicFormRef = ref();
const formSchema = shallowRef<VbenFormSchema[]>([]);
const selectableFees = ref<ActivityPaymentApi.FeeItem[]>([]);
const selectedFeeIds = ref<number[]>([]);

const id = computed(() => {
  const raw = props.id ?? route.query.id;
  if (raw == null || raw === '') return undefined;
  const num = Number(raw);
  return Number.isNaN(num) ? undefined : num;
});

const queryActivityId = computed(() => {
  const raw = route.query.activityId;
  if (raw == null || raw === '') return undefined;
  const num = Number(raw);
  return Number.isNaN(num) ? undefined : num;
});

const queryInstanceId = computed(() => {
  const raw = route.query.instanceId;
  if (raw == null || raw === '') return undefined;
  const num = Number(raw);
  return Number.isNaN(num) ? undefined : num;
});

const canEdit = computed(() => {
  if (props.isApproval || readonly.value) return false;
  const status = formData.value.processStatus;
  if (status == null) return true;
  // 未提交 / 审批拒绝 / 已取消：可改明细并重新提交
  return BpmProcessInstanceStatusEditValue.includes(status as number);
});

/** 表头字段与 BasicForm HeaderForm 对齐（申请人用 creatorName） */
const headerData = computed(() => {
  const data = formData.value;
  const isSelf =
    data.applicantUserId != null
    && String(data.applicantUserId) === String(userStore.userInfo?.id);
  return {
    ...data,
    billName: '专项活动付款申请',
    creatorName:
      data.applicantUserName
      || data.creatorName
      || (isSelf ? userStore.userInfo?.nickname : '')
      || '',
    creator: data.applicantUserId ?? data.creator ?? userStore.userInfo?.id,
    companyName:
      data.companyName
      || (isSelf ? userStore.userInfo?.companyName : '')
      || '',
    deptName:
      data.deptName || (isSelf ? userStore.userInfo?.deptName : '') || '',
  };
});

const feeColumns = [
  { title: '明细编号', dataIndex: 'feeCode', key: 'feeCode', width: 180 },
  { title: '实例编号', dataIndex: 'instanceCode', key: 'instanceCode', width: 180 },
  { title: '费用类型', dataIndex: 'feeType', key: 'feeType', width: 110 },
  { title: '收款人', dataIndex: 'payeeUserName', key: 'payeeUserName', width: 120 },
  { title: '币种', dataIndex: 'currency', key: 'currency', width: 90 },
  { title: '预算金额', dataIndex: 'amount', key: 'amount', width: 100 },
  { title: '实际金额', dataIndex: 'actualAmount', key: 'actualAmount', width: 130 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '生成时间', dataIndex: 'generateTime', key: 'generateTime', width: 170 },
];

const selectedFeeRows = computed(() =>
  selectableFees.value.filter(
    (item) => item.id != null && selectedFeeIds.value.includes(item.id),
  ),
);

const displayFees = computed(() => {
  const snapshot = formData.value.feeItems || [];
  // 只读/非草稿：必须用单据快照，避免可选列表为空导致历史明细丢失
  if (!canEdit.value) {
    return snapshot;
  }
  if (selectableFees.value.length === 0 && snapshot.length > 0) {
    return snapshot;
  }
  return selectableFees.value;
});

const rowSelection = computed(() => {
  if (!canEdit.value) {
    return undefined;
  }
  return {
    selectedRowKeys: selectedFeeIds.value,
    onChange: (keys: (string | number)[]) => {
      applyFeeSelection(keys.map((k) => Number(k)));
    },
  };
});

/** 同一付款申请只允许一种币种；混选时保留优先币种并提示分单 */
function applyFeeSelection(nextIds: number[]) {
  const rows = selectableFees.value.filter(
    (item) => item.id != null && nextIds.includes(item.id),
  );
  if (rows.length === 0) {
    selectedFeeIds.value = [];
    syncAmountFromSelection();
    return;
  }
  const currencies = [
    ...new Set(rows.map((row) => row.currency || 'CNY')),
  ];
  if (currencies.length > 1) {
    const prefer =
      formData.value.currency
      && rows.some((row) => (row.currency || 'CNY') === formData.value.currency)
        ? formData.value.currency
        : (rows[0]?.currency || 'CNY');
    selectedFeeIds.value = rows
      .filter((row) => (row.currency || 'CNY') === prefer)
      .map((row) => row.id)
      .filter((feeId): feeId is number => feeId != null);
    message.warning('同一付款申请只能选择同一币种，不同币种请分开申请');
  } else {
    selectedFeeIds.value = nextIds;
  }
  ensureActualAmountDefaults(selectedFeeIds.value);
  syncAmountFromSelection();
}

/** 勾选后默认带出预算金额，可改；已填实际金额则保留 */
function ensureActualAmountDefaults(feeIds: number[]) {
  const idSet = new Set(feeIds);
  for (const row of selectableFees.value) {
    if (row.id == null || !idSet.has(row.id)) {
      continue;
    }
    if (row.actualAmount == null || Number.isNaN(Number(row.actualAmount))) {
      row.actualAmount =
        row.amount == null || Number.isNaN(Number(row.amount))
          ? undefined
          : Number(row.amount);
    }
  }
}

function syncAmountFromSelection() {
  const rows = selectedFeeRows.value;
  if (rows.length === 0) {
    formData.value.totalAmount = 0;
    formData.value.currency = undefined;
    basicFormRef.value?.setFormValues({
      totalAmount: '',
      currency: undefined,
    });
    return;
  }
  const currency = rows[0]?.currency || 'CNY';
  const total = rows.reduce(
    (sum, row) => sum + Number(row.actualAmount ?? 0),
    0,
  );
  formData.value.totalAmount = total;
  formData.value.currency = currency;
  basicFormRef.value?.setFormValues({
    totalAmount: formatFeeAmount(total),
    currency,
  });
}

async function resolveActivityIdByInstance(instanceId: number) {
  const detail = await getActivityInstance(instanceId);
  return {
    activityId: detail?.activityId as number | undefined,
    instanceCode: detail?.instanceCode,
    activityName: detail?.activityName,
  };
}

function normalizeInstanceIds(value?: number | number[] | null) {
  if (value == null) return [] as number[];
  const list = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      list
        .map((item) => Number(item))
        .filter((item) => !Number.isNaN(item)),
    ),
  ];
}

async function loadSelectableFees(
  activityId?: number,
  instanceIds?: number[],
) {
  const ids = normalizeInstanceIds(instanceIds);
  if (ids.length === 0) {
    selectableFees.value = [];
    return;
  }
  feeLoading.value = true;
  try {
    const list = await getSelectablePaymentFeeItems({
      instanceIds: ids,
      activityId,
      paymentRequestId: id.value,
    });
    const snapshotById = new Map(
      (formData.value.feeItems || [])
        .filter((item) => item.id != null)
        .map((item) => [item.id as number, item]),
    );
    selectableFees.value = list.map((item) => {
      const snap = item.id != null ? snapshotById.get(item.id) : undefined;
      const actual =
        snap?.actualAmount ?? item.actualAmount ?? undefined;
      return {
        ...item,
        actualAmount:
          actual == null || Number.isNaN(Number(actual))
            ? undefined
            : Number(actual),
      };
    });
    const validIds = new Set(
      selectableFees.value.map((item) => item.id).filter(Boolean) as number[],
    );
    selectedFeeIds.value = selectedFeeIds.value.filter((feeId) =>
      validIds.has(feeId),
    );
    if (selectedFeeIds.value.length === 0 && formData.value.feeItemIds?.length) {
      selectedFeeIds.value = formData.value.feeItemIds.filter((feeId) =>
        validIds.has(feeId),
      );
    }
    ensureActualAmountDefaults(selectedFeeIds.value);
    syncAmountFromSelection();
  } finally {
    feeLoading.value = false;
  }
}

async function applyInstances(
  instanceIds?: number | number[],
  clearSelection = true,
) {
  const ids = normalizeInstanceIds(instanceIds);
  formData.value.instanceIds = ids;
  formData.value.instanceId = ids[0];
  if (ids.length === 0) {
    formData.value.activityId = undefined;
    formData.value.instanceCode = undefined;
    formData.value.activityName = undefined;
    selectableFees.value = [];
    selectedFeeIds.value = [];
    syncAmountFromSelection();
    return;
  }
  const briefs = await Promise.all(ids.map((item) => resolveActivityIdByInstance(item)));
  // 单据头 activityId 仅取首个实例，展示兼容；可选明细按全部实例加载（可跨活动）
  formData.value.activityId = briefs[0]?.activityId;
  formData.value.instanceCode = briefs
    .map((item) => item.instanceCode)
    .filter(Boolean)
    .join('、');
  formData.value.activityName = [
    ...new Set(briefs.map((item) => item.activityName).filter(Boolean)),
  ].join('、');
  if (clearSelection) {
    selectedFeeIds.value = [];
  }
  await loadSelectableFees(undefined, formData.value.instanceIds);
}

function handleClose() {
  closeCurrentTab();
}

async function handleSaveAndSubmit(isSubmit: boolean) {
  if (!canEdit.value) {
    message.warning('当前单据不可编辑');
    return;
  }
  loading.value = true;
  try {
    const formValues = isSubmit
      ? await basicFormRef.value.getFormValues()
      : await basicFormRef.value.getFormValues(false);

    const instanceIds = normalizeInstanceIds(
      formValues.instanceIds ?? formData.value.instanceIds ?? formData.value.instanceId,
    );
    if (instanceIds.length === 0) {
      message.warning('请选择活动实例');
      return;
    }
    if (!formData.value.activityId && instanceIds[0] != null) {
      const brief = await resolveActivityIdByInstance(instanceIds[0]);
      formData.value.activityId = brief.activityId;
    }
    if (selectedFeeIds.value.length === 0) {
      message.warning('请至少选择一条费用明细');
      return;
    }
    const missingActual = selectedFeeRows.value.find(
      (row) =>
        row.actualAmount == null
        || Number.isNaN(Number(row.actualAmount))
        || Number(row.actualAmount) < 0,
    );
    if (missingActual) {
      message.warning(
        Number(missingActual.actualAmount) < 0
          ? '实际金额不能为负数'
          : '请填写所选费用明细的实际金额',
      );
      return;
    }
    const selectedCurrencies = [
      ...new Set(selectedFeeRows.value.map((row) => row.currency || 'CNY')),
    ];
    if (selectedCurrencies.length > 1) {
      message.warning('同一付款申请只能选择同一币种，不同币种请分开申请');
      return;
    }
    if (isSubmit && !String(formValues.title || '').trim()) {
      message.warning('请填写申请事由');
      return;
    }

    syncAmountFromSelection();
    const feeActualAmounts = selectedFeeRows.value
      .filter((row): row is ActivityPaymentApi.FeeItem & { id: number } =>
        row.id != null,
      )
      .map((row) => ({
        feeItemId: row.id,
        actualAmount: Number(row.actualAmount),
      }));

    const payload: ActivityPaymentApi.PaymentRequest = {
      ...formData.value,
      ...formValues,
      id: id.value ?? formData.value.id,
      activityId: formData.value.activityId,
      instanceIds,
      instanceId: instanceIds[0],
      feeItemIds: selectedFeeIds.value,
      feeActualAmounts,
      totalAmount: formData.value.totalAmount,
      currency: formData.value.currency,
    };

    const savedId = await (isSubmit
      ? submitActivityPayment(payload)
      : saveActivityPayment(payload));

    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });
    if (!id.value && savedId) {
      formData.value.id = savedId;
    }
    closeCurrentTab();
  } catch (error) {
    console.error('保存付款申请失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleRevoke(reason: string) {
  if (!formData.value.processInstanceId) return;
  loading.value = true;
  try {
    await withdrawProcessToStart({
      processInstanceId: formData.value.processInstanceId,
      reason: reason || '制单人撤回',
    });
    message.success('撤回成功');
    await loadData();
  } catch (error) {
    console.error('撤回失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleDelete() {
  if (!id.value) return;
  loading.value = true;
  try {
    await deleteActivityPayment(id.value);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [
        formData.value.title || formData.value.billCode || '',
      ]),
      key: 'action_key_msg',
    });
    closeCurrentTab();
  } catch (error) {
    console.error('删除失败:', error);
  } finally {
    loading.value = false;
  }
}

function resolveInstanceIdsFromFees(feeItems?: ActivityPaymentApi.FeeItem[]) {
  if (!feeItems?.length) return [] as number[];
  return [
    ...new Set(
      feeItems
        .map((item) => item.instanceId)
        .filter((item): item is number => item != null),
    ),
  ];
}

async function loadData() {
  if (id.value == null) {
    const initialIds = queryInstanceId.value ? [queryInstanceId.value] : [];
    formData.value = {
      applicantUserId: userStore.userInfo?.id as number,
      applicantUserName: userStore.userInfo?.nickname,
      creator: userStore.userInfo?.id,
      creatorName: userStore.userInfo?.nickname,
      companyName: userStore.userInfo?.companyName || '',
      deptName: userStore.userInfo?.deptName || '',
      processStatus: BpmProcessInstanceStatus.NOT_START,
      activityId: queryActivityId.value,
      instanceIds: initialIds,
      instanceId: initialIds[0],
      feeItemIds: [],
    };
    selectedFeeIds.value = [];
    readonly.value = false;
    if (initialIds.length > 0) {
      await applyInstances(initialIds, false);
      await basicFormRef.value?.setFormValues({
        instanceIds: initialIds,
      });
    }
    return;
  }

  loading.value = true;
  try {
    const data = await getActivityPayment(id.value);
    if (!data) {
      message.error('获取付款申请详情失败');
      return;
    }
    const instanceIds = normalizeInstanceIds(
      data.instanceIds?.length
        ? data.instanceIds
        : resolveInstanceIdsFromFees(data.feeItems).length
          ? resolveInstanceIdsFromFees(data.feeItems)
          : data.instanceId,
    );
    formData.value = {
      ...data,
      instanceIds,
      instanceId: instanceIds[0] ?? data.instanceId,
    };
    selectedFeeIds.value = data.feeItemIds || [];
    readonly.value =
      props.isApproval === true
      || !BpmProcessInstanceStatusEditValue.includes(
          (data.processStatus ?? BpmProcessInstanceStatus.NOT_START) as number,
        );
    if (canEdit.value && instanceIds.length > 0) {
      await loadSelectableFees(undefined, instanceIds);
    } else {
      selectableFees.value = data.feeItems || [];
    }
    if (
      (data.feeItems?.length || 0) > 0
      && selectableFees.value.length === 0
    ) {
      selectableFees.value = data.feeItems || [];
    }
    const amount =
      canEdit.value && selectedFeeRows.value.length > 0
        ? formData.value.totalAmount
        : data.totalAmount;
    await basicFormRef.value?.setFormValues({
      instanceIds,
      title: data.title,
      remark: data.remark,
      currency:
        canEdit.value && selectedFeeRows.value.length > 0
          ? formData.value.currency
          : data.currency,
      totalAmount: formatFeeAmount(amount),
    });
  } finally {
    loading.value = false;
  }
}

defineExpose({
  loadData,
  handleSaveAndSubmit,
});

onMounted(async () => {
  const schema = useFormSchema();
  const instanceField = schema.find((item) => item.fieldName === 'instanceIds');
  if (instanceField) {
    const baseProps =
      typeof instanceField.componentProps === 'object'
        ? instanceField.componentProps
        : {};
    instanceField.componentProps = {
      ...baseProps,
      onChange: async (value: number | number[]) => {
        await applyInstances(value, true);
      },
    };
  }
  formSchema.value = schema;
  await loadData();
});
</script>

<template>
  <Loading :spinning="loading">
    <BasicForm
      ref="basicFormRef"
      :header-data="headerData"
      :form-data="formData"
      :form-schema="formSchema"
      :disabled="!canEdit"
      :hide-footer="props.isApproval"
      :activity-nodes="props.activityNodes"
      @close="handleClose"
      @save="handleSaveAndSubmit(false)"
      @submit="handleSaveAndSubmit(true)"
      @revoke="handleRevoke"
      @delete="handleDelete"
    >
      <template #form-extension>
        <CardContainer title="费用明细">
          <template v-if="canEdit" #extra>
            <Button
              type="link"
              :disabled="
                !(formData.instanceIds?.length || formData.instanceId)
              "
              @click="
                loadSelectableFees(
                  undefined,
                  formData.instanceIds?.length
                    ? formData.instanceIds
                    : formData.instanceId
                      ? [formData.instanceId]
                      : [],
                )
              "
            >
              刷新可选明细
            </Button>
          </template>
          <Table
            :columns="feeColumns"
            :data-source="displayFees"
            :loading="feeLoading"
            :pagination="false"
            :row-selection="rowSelection"
            row-key="id"
            size="small"
            bordered
          >
            <template #bodyCell="{ column, text, record }">
              <template v-if="column.key === 'feeType'">
                <DictTag
                  v-if="text"
                  :type="DICT_TYPE.EDU_FEE_TYPE"
                  :value="text"
                />
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'currency'">
                <DictTag
                  v-if="text"
                  :type="DICT_TYPE.EDU_FEE_CURRENCY"
                  :value="text"
                />
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <DictTag
                  v-if="text"
                  :type="DICT_TYPE.EDU_FEE_ITEM_STATUS"
                  :value="text"
                />
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'amount'">
                {{ formatFeeAmount(Number(text)) }}
              </template>
              <template v-else-if="column.key === 'actualAmount'">
                <InputNumber
                  v-if="canEdit && selectedFeeIds.includes(record.id)"
                  :value="record.actualAmount"
                  :min="0"
                  :precision="2"
                  placeholder="必填"
                  class="w-full"
                  @update:value="
                    (val) => {
                      record.actualAmount =
                        val == null || Number.isNaN(Number(val))
                          ? undefined
                          : Number(val);
                      syncAmountFromSelection();
                    }
                  "
                />
                <span v-else>
                  {{
                    formatFeeAmount(
                      record.actualAmount == null
                        ? null
                        : Number(record.actualAmount),
                    )
                  }}
                </span>
              </template>
              <template v-else-if="column.key === 'generateTime'">
                {{
                  text ? formatDateTime(text as string | number[]) : '-'
                }}
              </template>
              <template v-else-if="column.key === 'payeeUserName'">
                {{ text || record.payeeUserId || '-' }}
              </template>
            </template>
          </Table>
          <div
            v-if="!feeLoading && displayFees.length === 0"
            class="py-4 text-center text-gray-400"
          >
            {{
              !canEdit
                ? '暂无费用明细'
                : formData.instanceIds?.length || formData.instanceId
                  ? '暂无可申请的费用明细'
                  : '请先选择活动实例'
            }}
          </div>
          <div
            v-else-if="canEdit && displayFees.length > 0"
            class="mt-3 text-sm text-gray-500"
          >
            提示：同一付款申请只能勾选同一币种；合计金额按所选明细的实际金额汇总。
          </div>
        </CardContainer>
      </template>
    </BasicForm>
  </Loading>
</template>

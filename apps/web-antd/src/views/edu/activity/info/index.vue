<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { ActivityApi } from '#/api/edu/activity';

import type { SystemUserApi } from '#/api/system/user';

import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Loading } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
} from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { useUserStore } from '@vben/stores';

import { Button, message, Table } from 'ant-design-vue';

import { withdrawProcessToStart } from '#/api/bpm/task';
import {
  deleteActivity,
  getActivity,
  saveActivity,
  submitActivity,
} from '#/api/edu/activity';
import { getSimpleUserList } from '#/api/system/user';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { $t } from '#/locales';

import {
  buildEnrollTimeRange,
  calcFeeStandardSummary,
  ensureTrainingFeeStandardsForTeachers,
  formatFeeAmount,
  mapUserPayeeOptions,
  normalizeDateTimeValue,
  normalizeFeeAmountDisplay,
  splitEnrollTimeRange,
  useFeeStandardColumns,
  useFormSchema,
  validateFeeStandards,
} from './data';
import { ParticipantUserSelectModal } from '../components';
import {
  fetchParticipantUsersByIds,
  formatParticipantNameList,
  splitParticipantUsersByAccount,
  validateParticipantTeacherAndStudent,
} from '../components/participant-user-select-data';

defineOptions({ name: 'EduActivityInfo' });

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

const formData = ref<Partial<ActivityApi.Activity>>({});
const readonly = ref(false);
const loading = ref(false);
const basicFormRef = ref();
const formSchema = shallowRef<VbenFormSchema[]>([]);
const feeStandards = ref<ActivityApi.FeeStandard[]>([]);
const teacherPayeeUserOptions = ref<{ label: string; value: number }[]>([]);
const studentPayeeUserOptions = ref<{ label: string; value: number }[]>([]);
const participantSelectModalRef = ref<InstanceType<
  typeof ParticipantUserSelectModal
> | null>(null);

const isCreator = computed(() => {
  const creator = formData.value?.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});

function initFormSchema() {
  formSchema.value = useFormSchema(readonly, handleOpenParticipantSelect);
}

function handleOpenParticipantSelect() {
  if (readonly.value) {
    return;
  }
  const rawIds = formData.value.participantUserIds ?? [];
  const participantUserIds = (Array.isArray(rawIds) ? rawIds : [])
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));
  participantSelectModalRef.value?.openSelect(participantUserIds);
}

async function handleParticipantSelect(users: SystemUserApi.User[]) {
  const { teachers, students } = splitParticipantUsersByAccount(users);
  const sortedUsers = [...teachers, ...students];
  const participantUserIds = sortedUsers
    .map((user) => user.id)
    .filter((id): id is number => id != null);
  const participantNames = formatParticipantNameList(sortedUsers);
  formData.value.participantUserIds = participantUserIds;
  formData.value.participantNames = participantNames;
  if (basicFormRef.value) {
    await basicFormRef.value.setFormValues({
      participantNames,
      participantUserIds,
    });
  }
  // 按所选教培同步 TRAINING（培训费）：补齐参与教培、删除非参与教培
  if (!readonly.value) {
    feeStandards.value = await ensureTrainingFeeStandardsForTeachers(
      feeStandards.value,
      teachers,
    );
  }
}

let id: number | undefined = (() => {
  if (props.id) {
    return typeof props.id === 'string' ? Number(props.id) : props.id;
  }
  return route.query.id ? Number(route.query.id) : undefined;
})();

function handleClose() {
  closeCurrentTab();
}

async function handleSaveAndSubmit(isSubmit: boolean) {
  if (!basicFormRef.value) return;
  loading.value = true;

  if (isSubmit) {
    const { valid } = await basicFormRef.value.validateForm();
    if (!valid) {
      loading.value = false;
      return;
    }
    const feeCheck = validateFeeStandards(feeStandards.value);
    if (!feeCheck.valid) {
      message.warning(feeCheck.message ?? '费用标准存在未填完整的行');
      loading.value = false;
      return;
    }
    const participantUserIds = (formData.value.participantUserIds ?? [])
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
    if (participantUserIds.length === 0) {
      message.warning('请至少选择一名活动参与人');
      loading.value = false;
      return;
    }
    const participantUsers = await fetchParticipantUsersByIds(participantUserIds);
    const participantCheck = validateParticipantTeacherAndStudent(participantUsers);
    if (!participantCheck.valid) {
      message.warning(participantCheck.message ?? '参与人须同时包含教培与学生');
      loading.value = false;
      return;
    }
  }

  try {
    const formValues = isSubmit
      ? ((await basicFormRef.value.getFormValues()) as ActivityApi.Activity & {
          enrollTimeRange?: string[];
        })
      : ((await basicFormRef.value.getFormValues(
          false,
        )) as ActivityApi.Activity & { enrollTimeRange?: string[] });

    const { enrollTimeRange, attachments, ...restFormValues } = formValues;
    const { enrollStartTime, enrollEndTime } =
      splitEnrollTimeRange(enrollTimeRange);
    const attachmentList = (Array.isArray(attachments) ? attachments : [])
      .map((item) => ({
        fileName: item?.fileName || '附件',
        fileUrl: item?.fileUrl || '',
      }))
      .filter((item) => item.fileUrl);

    // 草稿也必填名称、类型
    if (!isSubmit) {
      if (!String(formValues.name || '').trim()) {
        message.warning('请填写活动名称');
        loading.value = false;
        return;
      }
      if (!formValues.activityType) {
        message.warning('请选择活动类型');
        loading.value = false;
        return;
      }
    }

    const budgetAmount = Number(feeStandardSummary.value.cnyTotal.toFixed(2));
    const data = {
      ...formData.value,
      ...restFormValues,
      enrollStartTime,
      enrollEndTime,
      feeStandards: feeStandards.value.map((fee) => ({
        ...fee,
        feeMode: 'fixed',
      })),
      attachments: attachmentList,
      // 预算总额由费用标准汇总，前端传 CNY 预估；提交时后端按汇率重算覆盖
      budgetAmount,
    };
    // 避免空日期/空串导致后端反序列化或落库失败
    for (const key of [
      'startDate',
      'enrollStartTime',
      'enrollEndTime',
      'name',
      'activityType',
      'content',
      'remark',
    ] as const) {
      const val = (data as Record<string, unknown>)[key];
      if (val === '' || val === undefined) {
        (data as Record<string, unknown>)[key] = null;
      }
    }

    id = await (isSubmit ? submitActivity(data) : saveActivity(data));

    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });
    closeCurrentTab();
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleRevoke(reason: string) {
  if (
    formData.value.processInstanceId !== undefined &&
    formData.value.processInstanceId !== null
  ) {
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
}

async function handleDelete() {
  if (!id) return;
  loading.value = true;
  try {
    await deleteActivity(id);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [
        formData.value.name || formData.value.billCode || '',
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

async function loadPayeeUserOptions() {
  const [teachers, students] = await Promise.all([
    getSimpleUserList({ includeRoleCodes: 'teacher' }),
    getSimpleUserList({ includeRoleCodes: 'student' }),
  ]);
  teacherPayeeUserOptions.value = mapUserPayeeOptions(teachers ?? []);
  studentPayeeUserOptions.value = mapUserPayeeOptions(students ?? []);
}

async function loadData() {
  if (id === undefined || id === null) {
    formData.value = {
      creator: userStore.userInfo?.id,
      creatorName: userStore.userInfo?.nickname,
      companyId: userStore.userInfo?.companyId || 0,
      companyName: userStore.userInfo?.companyName || '',
      deptId: userStore.userInfo?.deptId || 0,
      deptName: userStore.userInfo?.deptName || '',
      processStatus: BpmProcessInstanceStatus.NOT_START,
      cycleType: 'ONCE',
      createTime: new Date(),
      ownerUserIds: [],
      participantUserIds: [],
      participantNames: '',
      feeStandards: [],
      attachments: [],
    };
    feeStandards.value = [];
    persistedBudgetAmount.value = null;
    return;
  }

  loading.value = true;
  try {
    const data = await getActivity(id);
    if (data === null) {
      return message.error('获取专项活动详情失败');
    }
    formData.value = {
      ...data,
      attachments: data.attachments ?? [],
    };
    feeStandards.value = (data.feeStandards || []).map((fee) => ({
      ...fee,
      feeMode: 'fixed',
      amount: normalizeFeeAmountDisplay(fee.amount),
    }));
    persistedBudgetAmount.value =
      data.budgetAmount == null ? null : Number(data.budgetAmount);

    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(
            formData.value.processStatus as number,
          ) || !isCreator.value;

    initFormSchema();

    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues({
        ...data,
        attachments: data.attachments ?? [],
        startDate: normalizeDateTimeValue(data.startDate),
        budgetAmount: formatBudgetAmountDisplay(Number(data.budgetAmount) || 0),
        enrollTimeRange: buildEnrollTimeRange(
          data.enrollStartTime,
          data.enrollEndTime,
        ),
      });
    }
  } catch (error) {
    // const errorMessage =
    //   error instanceof Error ? error.message : '获取专项活动详情失败';
    console.error('获取专项活动详情失败:', error);
  } finally {
    loading.value = false;
    nextTick(() => {
      basicFormRef.value?.refreshAllData();
    });
  }
}

function handleAddFeeStandard() {
  feeStandards.value.push({
    _clientRowKey: `fee_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    feeType: undefined,
    feeMode: 'fixed',
    currency: 'CNY',
    amount: undefined,
    feeSide: '',
    remark: '',
  });
}

function getFeeStandardRowKey(record: ActivityApi.FeeStandard) {
  return String(record.id ?? record._clientRowKey ?? '');
}

function handleDeleteFeeStandard(index: number) {
  feeStandards.value.splice(index, 1);
}

const feeColumns = computed(() =>
  useFeeStandardColumns(readonly, handleDeleteFeeStandard, {
    teacher: teacherPayeeUserOptions,
    student: studentPayeeUserOptions,
  }),
);

const feeStandardSummary = computed(() =>
  calcFeeStandardSummary(feeStandards.value),
);

/** 后端已保存的预算总额（含外币折算后金额），用于回显 */
const persistedBudgetAmount = ref<null | number>(null);

/** 页面展示用预算：回显优先后端值，编辑中无外币时用费用标准实时汇总 */
const displayBudgetAmount = computed(() => {
  const persisted = persistedBudgetAmount.value;
  const hasForeign = feeStandardSummary.value.rows.some(
    (row) => row.currency !== 'CNY',
  );
  // 回显 / 含外币：用后端已折算预算
  if (
    (readonly.value || hasForeign) &&
    persisted != null &&
    Number.isFinite(persisted) &&
    persisted > 0
  ) {
    return persisted;
  }
  if (feeStandardSummary.value.cnyTotal > 0) {
    return feeStandardSummary.value.cnyTotal;
  }
  if (persisted != null && Number.isFinite(persisted) && persisted > 0) {
    return persisted;
  }
  return null;
});

/** 预算展示文案：有汇总显示金额，否则显示说明（禁用态 placeholder 不生效） */
function formatBudgetAmountDisplay(cnyTotal: number) {
  return cnyTotal > 0
    ? `¥ ${Number(cnyTotal.toFixed(2)).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '由费用标准自动汇总';
}

/** 预算总额随费用标准变化自动同步（含外币回显时不覆盖后端已折算值） */
watch(
  feeStandardSummary,
  async (summary) => {
    if (readonly.value) {
      return;
    }
    const hasForeign = summary.rows.some((row) => row.currency !== 'CNY');
    const amount =
      hasForeign &&
      persistedBudgetAmount.value != null &&
      persistedBudgetAmount.value > 0
        ? persistedBudgetAmount.value
        : summary.cnyTotal;
    const budgetAmount = formatBudgetAmountDisplay(amount);
    formData.value.budgetAmount = budgetAmount as unknown as number;
    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues({ budgetAmount });
    }
  },
  { flush: 'post', immediate: true },
);

defineExpose({
  loadData,
  handleSaveAndSubmit,
});

onMounted(async () => {
  initFormSchema();
  await loadPayeeUserOptions();
  await loadData();
});
</script>

<template>
  <Loading :spinning="loading">
    <BasicForm
      ref="basicFormRef"
      :header-data="{
        ...formData,
        billName: '专项活动',
      }"
      :form-data="formData"
      :form-schema="formSchema"
      :disabled="readonly"
      :hide-footer="props.isApproval"
      :activity-nodes="props.activityNodes"
      @close="handleClose"
      @save="handleSaveAndSubmit(false)"
      @submit="handleSaveAndSubmit(true)"
      @revoke="handleRevoke"
      @delete="handleDelete"
    >
      <template #form-extension>
        <CardContainer title="费用标准">
          <template #extra>
            <Button
              v-if="!readonly"
              type="primary"
              @click="handleAddFeeStandard"
            >
              {{ $t('ui.actionTitle.create') }}
            </Button>
          </template>
          <Table
            :columns="feeColumns"
            :data-source="feeStandards"
            :pagination="false"
            size="small"
            bordered
            :row-key="getFeeStandardRowKey"
          />
          <div
            v-if="feeStandards.length > 0"
            class="mt-3 rounded border border-solid border-[#f0f0f0] bg-[#fafafa] px-4 py-3 text-sm leading-7"
          >
            <div class="font-medium text-[#333]">费用标准统计</div>
            <div class="text-[#666]">
              共 {{ feeStandardSummary.rowCount }} 条，有效预算金额
              {{ feeStandardSummary.validRowCount }} 条
            </div>
            <div
              v-for="row in feeStandardSummary.rows"
              :key="row.currency"
              class="text-[#333]"
            >
              <span class="font-medium">{{ row.currencyLabel }}：</span>
              合计 {{ formatFeeAmount(row.total) }}（教培侧
              {{ formatFeeAmount(row.teacherTotal) }}，学生侧
              {{ formatFeeAmount(row.studentTotal) }}）
            </div>
            <div
              v-if="feeStandardSummary.rows.length === 0"
              class="text-[#999]"
            >
              请完善费用标准预算金额后查看统计
            </div>
            <div v-if="displayBudgetAmount != null">
              <span>预算总额：</span>
              <span class="font-medium text-[#1677ff]">
                ¥ {{ formatFeeAmount(displayBudgetAmount) }}
              </span>
            </div>
            <div
              v-if="feeStandardSummary.rows.some((r) => r.currency !== 'CNY')"
              class="text-[#999]"
            >
              含外币时，提交审核将以系统汇率折算为人民币后写入预算总额
            </div>
          </div>
        </CardContainer>
      </template>
    </BasicForm>
    <ParticipantUserSelectModal
      ref="participantSelectModalRef"
      @select="handleParticipantSelect"
    />
  </Loading>
</template>

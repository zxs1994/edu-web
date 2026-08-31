<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { ActivityApi } from '#/api/edu/activity';

import type { SystemUserApi } from '#/api/system/user';

import { computed, nextTick, onMounted, ref, shallowRef } from 'vue';
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

import { useFeeStandardColumns, useFormSchema } from './data';
import { ParticipantUserSelectModal } from '../components';

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
const payeeUserOptions = ref<{ label: string; value: number }[]>([]);
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

function formatParticipantDisplayName(user: SystemUserApi.User) {
  const nickname = user.nickname?.trim();
  const username = user.username?.trim();
  if (nickname && username) {
    return `${nickname}(${username})`;
  }
  return nickname || username || '';
}

async function handleParticipantSelect(users: SystemUserApi.User[]) {
  const participantUserIds = users
    .map((user) => user.id)
    .filter((id): id is number => id != null);
  const participantNames = users
    .map((user) => formatParticipantDisplayName(user))
    .filter(Boolean)
    .join('、');
  formData.value.participantUserIds = participantUserIds;
  formData.value.participantNames = participantNames;
  if (basicFormRef.value) {
    await basicFormRef.value.setFormValues({
      participantNames,
    });
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
    if (!feeStandards.value.length) {
      message.warning('请至少配置一条费用标准');
      loading.value = false;
      return;
    }
  }

  try {
    const formValues = isSubmit
      ? ((await basicFormRef.value.getFormValues()) as ActivityApi.Activity)
      : ((await basicFormRef.value.getFormValues(
          false,
        )) as ActivityApi.Activity);

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

    const data = {
      ...formData.value,
      ...formValues,
      feeStandards: feeStandards.value,
    };
    // 避免空日期/空串导致后端反序列化或落库失败
    for (const key of [
      'startDate',
      'enrollStartTime',
      'enrollEndTime',
      'name',
      'activityType',
      'activitySubtype',
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
  const users = await getSimpleUserList();
  payeeUserOptions.value = (users ?? []).map((user) => ({
    label: user.username
      ? `${user.nickname}(${user.username})`
      : user.nickname || String(user.id),
    value: user.id as number,
  }));
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
    };
    feeStandards.value = [];
    return;
  }

  loading.value = true;
  try {
    const data = await getActivity(id);
    formData.value = { ...data };
    feeStandards.value = data.feeStandards || [];

    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(
            formData.value.processStatus as number,
          ) || !isCreator.value;

    initFormSchema();

    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues(data);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '获取专项活动详情失败';
    message.error(errorMessage);
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
    feeMode: 'FIXED',
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
  useFeeStandardColumns(readonly, handleDeleteFeeStandard, payeeUserOptions),
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
        </CardContainer>
      </template>
    </BasicForm>
    <ParticipantUserSelectModal
      ref="participantSelectModalRef"
      @select="handleParticipantSelect"
    />
  </Loading>
</template>

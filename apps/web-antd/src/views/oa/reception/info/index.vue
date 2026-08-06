<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { ReceptionApplyBillApi } from '#/api/oa/reception';

import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';

import { Loading } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
} from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { preferences, updatePreferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { Button, message } from 'ant-design-vue';

import { withdrawProcessToStart } from '#/api/bpm/task';
import {
  deleteReceptionApplyBill,
  getReceptionApplyBill,
  saveReceptionApplyBill,
  submitReceptionApplyBill,
} from '#/api/oa/reception';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer, finishBillFormAfterSaveSubmit, handleBillNotFoundAfterLoad } from '#/components/basic-form';
import { $t } from '#/locales';

import { useFormSchema } from './data';

defineOptions({ name: 'OaReceptionApplyBillInfo' });

const props = defineProps<{
  activityNodes?: any[];
  copyReason?: string;
  id?: number | string;
  isApproval?: boolean;
  isCopy?: boolean;
  nodeKey?: string;
  nodeKeyName?: string;
  processDefinition?: any;
  processInstance?: any;
}>();

const route = useRoute();
const userStore = useUserStore();
const isCreator = computed(() => {
  const creator = formData.value?.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});
const { closeCurrentTab } = useTabs();

const formData = ref<Partial<ReceptionApplyBillApi.ReceptionApplyBill>>({});
const readonly = ref(false);
const loading = ref(false);
const basicFormRef = ref();
const attachmentListRef = ref();
const formSchema = shallowRef<VbenFormSchema[]>([]);

function initFormSchema() {
  formSchema.value = useFormSchema();
}

function getCurrentId(): number | undefined {
  if (props.id) {
    return typeof props.id === 'string' ? Number(props.id) : props.id;
  }
  return route.query.id ? Number(route.query.id) : undefined;
}

let id: number | undefined = getCurrentId();

function handleClose() {
  closeCurrentTab();
}

function handleUploadAttachment() {
  attachmentListRef.value?.handleTriggerUpload();
}

async function handleSaveAndSubmit(isSubmit: boolean) {
  loading.value = true;
  if (!basicFormRef.value) return;

  if (isSubmit) {
    const { valid } = await basicFormRef.value.validateForm();
    if (!valid) {
      loading.value = false;
      return;
    }
  }

  try {
    const formValues = isSubmit
      ? ((await basicFormRef.value.getFormValues()) as ReceptionApplyBillApi.ReceptionApplyBill)
      : ((await basicFormRef.value.getFormValues(false)) as ReceptionApplyBillApi.ReceptionApplyBill);

    const data = { ...formData.value, ...formValues };
    id = await (isSubmit
      ? submitReceptionApplyBill(data)
      : saveReceptionApplyBill(data));
    formData.value.id = id;

    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });

    await finishBillFormAfterSaveSubmit({
      isSubmit,
      presidentCorrectionDisplay: formData.value.presidentCorrectionDisplay,
      reload: loadData,
      closeTab: closeCurrentTab,
      onReloaded: () => basicFormRef.value?.refreshAllData(),
    });
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleDelete() {
  if (!id) return;
  loading.value = true;
  try {
    await deleteReceptionApplyBill(id);
    message.success('删除成功');
    closeCurrentTab();
  } catch (error) {
    console.error('删除失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleRevoke(reason: string) {
  if (formData.value.processInstanceId) {
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

async function loadData() {
  id = getCurrentId() ?? id;

  if (id === undefined || id === null) {
    formData.value = {
      creator: userStore.userInfo?.id,
      creatorName: userStore.userInfo?.nickname,
      companyId: userStore.userInfo?.companyId || 0,
      companyName: userStore.userInfo?.companyName || '中国引航协会',
      deptId: userStore.userInfo?.deptId || 0,
      deptName: userStore.userInfo?.deptName || '',
      processStatus: BpmProcessInstanceStatus.NOT_START,
      createTime: new Date(),
      billCode: '',
      guestCount: 1,
      accompanyCount: 0,
      estimatedCost: 0,
      attachments: [],
    };
    return;
  }

  loading.value = true;
  try {
    const data = await getReceptionApplyBill(id);
    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(data.processStatus as number)
          || !isCreator.value;

    formData.value = { ...data };
    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues(data);
    }
  } catch (error) {
    if (handleBillNotFoundAfterLoad(error, closeCurrentTab)) return;
    console.error('获取接待申请单详情失败:', error);
  } finally {
    loading.value = false;
    nextTick(() => {
      basicFormRef.value?.refreshAllData();
    });
  }
}

async function beforeApproval(): Promise<boolean> {
  return true;
}

defineExpose({
  beforeApproval,
  loadData,
  handleSaveAndSubmit,
});

onMounted(() => {
  if (route.query.from === 'startProcess') {
    updatePreferences({ sidebar: { hidden: true } });
  }
  initFormSchema();
  loadData();
});

onBeforeUnmount(() => {
  if (preferences.sidebar.hidden) {
    updatePreferences({ sidebar: { hidden: false } });
  }
});

onBeforeRouteLeave(() => {
  if (preferences.sidebar.hidden) {
    updatePreferences({ sidebar: { hidden: false } });
  }
});
</script>

<template>
  <Loading :spinning="loading">
    <BasicForm
      ref="basicFormRef"
      source-bill-type="oa_reception_apply_bill"
      :header-data="{
        ...formData,
        billName: '接待申请单',
      }"
      :form-data="formData"
      :form-schema="formSchema"
      :disabled="props.isCopy || readonly"
      @close="handleClose"
      @save="handleSaveAndSubmit(false)"
      @submit="handleSaveAndSubmit(true)"
      @revoke="handleRevoke"
      @delete="handleDelete"
      :hide-footer="props.isApproval && !props.isCopy"
      :hide-submit="props.isCopy"
      :hide-save="props.isCopy"
      :hide-delete="props.isCopy"
      :activity-nodes="props.activityNodes"
    >
      <template v-if="props.isCopy && props.copyReason" #footer-extra>
        <div class="copy-reason-text">抄送意见：{{ props.copyReason }}</div>
      </template>
      <template #form-extension>
        <CardContainer :title="$t('common.attachmentInfo')">
          <template #extra>
            <Button
              v-if="!readonly"
              type="primary"
              @click="handleUploadAttachment"
            >
              上传附件
            </Button>
          </template>
          <AttachmentList
            ref="attachmentListRef"
            v-model="formData.attachments"
            :readonly="readonly"
            :max-count="20"
            :max-size="20"
            :hide-upload-button="true"
          />
        </CardContainer>
      </template>
    </BasicForm>
  </Loading>
</template>

<style scoped>
.copy-reason-text {
  width: 100%;
  padding: 8px 16px;
  font-size: 13px;
  color: rgb(0 0 0 / 65%);
  text-align: center;
  background-color: rgb(0 0 0 / 4%);
  border-bottom: 1px solid #f0f0f0;
}
</style>

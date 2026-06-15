<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { ProjectInitiationBillApi } from '#/api/oa/project';

import { nextTick, onMounted, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';

import { Loading } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
} from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { useUserStore } from '@vben/stores';

import { Button, message } from 'ant-design-vue';

import { withdrawProcessToStart } from '#/api/bpm/task';
import {
  deleteProjectInitiationBill,
  getProjectInitiationBill,
  saveProjectInitiationBill,
  submitProjectInitiationBill,
} from '#/api/oa/project';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { $t } from '#/locales';

import { useFormSchema } from './data';

defineOptions({ name: 'OaProjectInitiationBillInfo' });

// 定义组件 props
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
const { closeCurrentTab } = useTabs();

const formData = ref<Partial<ProjectInitiationBillApi.ProjectInitiationBill>>({});
const readonly = ref(false);
const loading = ref(false);
const basicFormRef = ref();
const attachmentListRef = ref();
const formSchema = shallowRef<VbenFormSchema[]>([]);

function initFormSchema() {
  formSchema.value = useFormSchema();
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
      ? ((await basicFormRef.value.getFormValues()) as ProjectInitiationBillApi.ProjectInitiationBill)
      : ((await basicFormRef.value.getFormValues(
          false,
        )) as ProjectInitiationBillApi.ProjectInitiationBill);

    const data = {
      ...formData.value,
      ...formValues,
    };

    id = await (isSubmit
      ? submitProjectInitiationBill(data)
      : saveProjectInitiationBill(data));

    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });

    await loadData();
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
    await deleteProjectInitiationBill(id);
    message.success('删除成功');
    closeCurrentTab();
  } catch (error) {
    console.error('删除失败:', error);
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
      createTime: new Date(),
      billCode: '',
      attachments: [],
    };
    return;
  }

  loading.value = true;
  try {
    const data = await getProjectInitiationBill(id);
    formData.value = { ...data };
    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(
            formData.value.processStatus as number,
          );

    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues(data);
    }
  } catch (error) {
    console.error('获取项目立项单详情失败:', error);
  } finally {
    loading.value = false;
    nextTick(() => {
      basicFormRef.value?.refreshAllData();
    });
  }
}

function handleUploadAttachment() {
  if (attachmentListRef.value) {
    attachmentListRef.value.handleTriggerUpload();
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
  initFormSchema();
  loadData();
});
</script>

<template>
  <Loading :spinning="loading">
    <BasicForm
      ref="basicFormRef"
      :header-data="{
        ...formData,
        billName: '项目立项',
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
            :max-count="10"
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

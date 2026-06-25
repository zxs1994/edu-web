<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { LeaveCancelBillApi } from '#/api/hrm/leave-cancel';

import { computed, nextTick, onMounted, ref, shallowRef } from 'vue';
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
  getLeaveCancelBill,
  saveLeaveCancelBill,
  submitLeaveCancelBill,
} from '#/api/hrm/leave-cancel';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { $t } from '#/locales';

import { useFormSchema } from './data';

defineOptions({ name: 'HrmLeaveCancelBillInfo' });

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
/** 当前用户是否为单据创建人 */
const isCreator = computed(() => {
  const creator = formData.value?.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});
const canCancelEdit = ref(false);

const { closeCurrentTab } = useTabs();

const formData = ref<Partial<LeaveCancelBillApi.LeaveCancelBill>>({});

const readonly = ref(false);
const loading = ref(false);

const basicFormRef = ref();
const attachmentListRef = ref();

const formSchema = shallowRef<VbenFormSchema[]>([]);

function initFormSchema() {
  const nodeKeyName = ref(props.nodeKeyName || '');
  formSchema.value = useFormSchema(readonly, nodeKeyName, canCancelEdit);
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

async function handleSaveAndSubmit(isSubmit: boolean): Promise<boolean> {
  loading.value = true;

  if (!basicFormRef.value) {
    loading.value = false;
    return false;
  }

  if (isSubmit) {
    const { valid } = await basicFormRef.value.validateForm();
    if (!valid) {
      loading.value = false;
      return false;
    }
  }

  try {
    const formValues = isSubmit
      ? ((await basicFormRef.value.getFormValues()) as LeaveCancelBillApi.LeaveCancelBill)
      : ((await basicFormRef.value.getFormValues(
          false,
        )) as LeaveCancelBillApi.LeaveCancelBill);

    const data = {
      ...formData.value,
      ...formValues,
    };

    id = await (isSubmit
      ? submitLeaveCancelBill(data)
      : saveLeaveCancelBill(data));

    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });

    return true;
  } catch (error) {
    console.error('保存失败:', error);
    return false;
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
      attachments: [],
    };
    return;
  }

  loading.value = true;
  try {
    const data = await getLeaveCancelBill(id);
    formData.value = {
      ...data,
    };

    if (
      route.query.isTodo === 'true' &&
      props.nodeKeyName === '发起人销假'
    ) {
      canCancelEdit.value = true;
      // 自动带出请假预计信息到销假信息
      if (!data.actualStartTime && data.expectedStartTime) {
        formData.value.actualStartTime = data.expectedStartTime;
      }
      if (!data.actualEndTime && data.expectedEndTime) {
        formData.value.actualEndTime = data.expectedEndTime;
      }
      if (
        (data.actualDays === null || data.actualDays === undefined) &&
        data.expectedDays
      ) {
        formData.value.actualDays = data.expectedDays;
      }
    }

    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(
            formData.value.processStatus as number,
          ) || !isCreator.value;

    initFormSchema();

    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues(formData.value);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '获取请假销假申请单详情失败';
    message.error(errorMessage);
    console.error('获取请假销假申请单详情失败:', error);
  } finally {
    loading.value = false;

    nextTick(() => {
      basicFormRef.value?.refreshAllData();
    });
  }
}

async function beforeApproval(): Promise<boolean> {
  try {
    if (
      props.isApproval &&
      props.nodeKeyName === '发起人销假' &&
      basicFormRef.value
    ) {
      const { valid } = await basicFormRef.value.validateForm();
      if (!valid) {
        message.error('表单校验不通过，请先完善表单信息');
        return false;
      }

      const formValues = await basicFormRef.value.getFormValues();
      const data = {
        ...formData.value,
        ...formValues,
      };
      await saveLeaveCancelBill(data);
    }
    return true;
  } catch {
    message.error($t('ui.actionMessage.operationFailed'));
    return false;
  }
}

function handleUploadAttachment() {
  if (attachmentListRef.value) {
    attachmentListRef.value.handleTriggerUpload();
  }
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
        billName: '请假销假申请单',
      }"
      :form-data="formData"
      :form-schema="formSchema"
      :disabled="readonly"
      @close="handleClose"
      :on-save-submit="handleSaveAndSubmit"
      @revoke="handleRevoke"
      :hide-footer="props.isApproval"
      :activity-nodes="props.activityNodes"
    >
      <template #form-extension>
        <!-- 附件列表 -->
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
/* 业务页面样式已封装到BasicForm组件中，无需重复定义 */
</style>

<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { ContractBillApi } from '#/api/oa/contract';

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

import { Alert, Button, message } from 'ant-design-vue';

import { withdrawProcessToStart } from '#/api/bpm/task';
import {
  deleteContractBill,
  getContractBill,
  saveContractBill,
  submitContractBill,
} from '#/api/oa/contract';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { ContractDetailList } from '#/components/contract-detail-list';
import { PaymentPlanList } from '#/components/payment-plan-list';
import { $t } from '#/locales';

import { useFormSchema } from './data';

defineOptions({ name: 'OaContractBillInfo' });

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
/** 当前用户是否为单据创建人 */
const isCreator = computed(() => {
  const creator = formData.value?.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});
const { closeCurrentTab } = useTabs();

const formData = ref<Partial<ContractBillApi.ContractBill>>({});
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
      ? ((await basicFormRef.value.getFormValues()) as ContractBillApi.ContractBill)
      : ((await basicFormRef.value.getFormValues(
          false,
        )) as ContractBillApi.ContractBill);

    const data = {
      ...formData.value,
      ...formValues,
    };

    id = await (isSubmit ? submitContractBill(data) : saveContractBill(data));

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

async function handleDelete() {
  if (!id) return;
  loading.value = true;
  try {
    await deleteContractBill(id);
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
      companyName: userStore.userInfo?.companyName || '中国引航协会',
      deptId: userStore.userInfo?.deptId || 0,
      deptName: userStore.userInfo?.deptName || '',
      processStatus: BpmProcessInstanceStatus.NOT_START,
      createTime: new Date(),
      isMajor: 0,
      ourRole: 1,
      counterpartyType: 1,
      currency: 'CNY',
      ourParty: userStore.userInfo?.companyName || '',
      responsiblePerson: userStore.userInfo?.nickname || '',
      billCode: '',
      attachments: [],
      contractDetails: [],
      paymentPlans: [],
    };
    return;
  }

  loading.value = true;
  try {
    const data = await getContractBill(id);
    formData.value = { ...data };
    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(
            formData.value.processStatus as number,
          ) || !isCreator.value;

    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues(data);
    }
  } catch (error) {
    console.error('获取合同审批单详情失败:', error);
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
  // 从发起流程进入时，隐藏侧边栏
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
      :header-data="{
        ...formData,
        billName: '合同详情',
      }"
      :form-data="formData"
      :form-schema="formSchema"
      :disabled="props.isCopy || readonly"
      @close="handleClose"
      :on-save-submit="handleSaveAndSubmit"
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
        <Alert
          v-if="route.query.from === 'startProcess'"
          type="info"
          show-icon
          :closable="false"
          message="提示：重大合作经会长办公会/常务理事会审议，附纪要再审批。"
          style="margin-bottom: 16px;"
        />
        <CardContainer title="合同文件">
          <template #extra>
            <Button
              v-if="!readonly"
              type="primary"
              @click="handleUploadAttachment"
            >
              上传文件
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

        <CardContainer title="合同明细">
          <ContractDetailList
            v-model="formData.contractDetails"
            :readonly="readonly"
          />
        </CardContainer>

        <CardContainer title="收付款计划">
          <PaymentPlanList
            v-model="formData.paymentPlans"
            :readonly="readonly"
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

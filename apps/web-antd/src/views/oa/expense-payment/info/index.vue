<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { ExpensePaymentBillApi } from '#/api/oa/expense-payment';

import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

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
  deleteExpensePaymentBill,
  getExpensePaymentBill,
  saveExpensePaymentBill,
  submitExpensePaymentBill,
} from '#/api/oa/expense-payment';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer, finishBillFormAfterSaveSubmit, handleBillNotFoundAfterLoad } from '#/components/basic-form';
import {
  filterEmptyPaymentDetails,
  normalizePaymentDetail,
  normalizeTotalAmount,
} from '#/components/payment-detail-list/data';
import { PaymentDetailList } from '#/components/payment-detail-list';
import { $t } from '#/locales';

import { useFormSchema } from './data';

defineOptions({ name: 'OaExpensePaymentBillInfo' });

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
const router = useRouter();
const userStore = useUserStore();
const isCreator = computed(() => {
  const creator = formData.value?.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});
const { closeCurrentTab } = useTabs();

const formData = ref<Partial<ExpensePaymentBillApi.ExpensePaymentBill>>({});
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

async function handleSaveAndSubmit(isSubmit: boolean) {
  loading.value = true;
  if (!basicFormRef.value) return;

  if (isSubmit) {
    const { valid } = await basicFormRef.value.validateForm();
    if (!valid) {
      loading.value = false;
      return;
    }
    const validDetails = filterEmptyPaymentDetails(formData.value.details);
    if (validDetails.length === 0) {
      message.warning('请至少添加一条费用明细');
      loading.value = false;
      return;
    }
  }

  try {
    const formValues = isSubmit
      ? ((await basicFormRef.value.getFormValues()) as ExpensePaymentBillApi.ExpensePaymentBill)
      : ((await basicFormRef.value.getFormValues(false)) as ExpensePaymentBillApi.ExpensePaymentBill);

    const validDetails = filterEmptyPaymentDetails(formData.value.details);
    formData.value.details = validDetails;
    const totalAmount = normalizeTotalAmount(formValues.totalAmount, validDetails);

    const data = {
      ...formData.value,
      ...formValues,
      totalAmount,
      details: validDetails,
    };

    id = await (isSubmit
      ? submitExpensePaymentBill(data)
      : saveExpensePaymentBill(data));
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
    await deleteExpensePaymentBill(id);
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
      paymentStatus: 0,
      paymentType: 1,
      totalAmount: 0,
      billCode: '',
      details: [],
      attachments: [],
      applyDate: new Date().toISOString().substring(0, 10),
    };
    return;
  }

  loading.value = true;
  try {
    const data = await getExpensePaymentBill(id);
    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(data.processStatus as number) ||
          !isCreator.value;

    const details = (data.details || []).map((item, index) =>
      normalizePaymentDetail(item, index),
    );
    const totalAmount = normalizeTotalAmount(undefined, details);
    formData.value = { ...data, details, totalAmount };

    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues({ ...data, totalAmount });
    }
  } catch (error) {
    if (handleBillNotFoundAfterLoad(error, closeCurrentTab)) return;
    console.error('获取费用支出申请详情失败:', error);
  } finally {
    loading.value = false;
    nextTick(() => basicFormRef.value?.refreshAllData());
  }
}

function handleUploadAttachment() {
  attachmentListRef.value?.handleTriggerUpload();
}

async function handleTotalAmountChange(total: number) {
  if (!basicFormRef.value) return;
  await basicFormRef.value.setFormValues({ totalAmount: total }, false);
}

async function beforeApproval(): Promise<boolean> {
  return true;
}

defineExpose({ beforeApproval, loadData, handleSaveAndSubmit });

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
      source-bill-type="oa_expense_payment_bill"
      :header-data="{ ...formData, billName: '费用支出申请' }"
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
        <CardContainer title="费用明细">
          <PaymentDetailList
            v-model="formData.details"
            :readonly="readonly"
            @update:total="handleTotalAmountChange"
          />
        </CardContainer>

        <CardContainer :title="$t('common.attachmentInfo')">
          <template #extra>
            <Button v-if="!readonly" type="primary" @click="handleUploadAttachment">
              上传附件
            </Button>
          </template>
          <Alert type="warning" :closable="false" class="attachment-tips">
            <template #description>
              <div class="attachment-tips-content">
                <p>附件要求：支持 PDF / JPG / PNG / Excel 格式，单个文件 ≤ 20MB，最多上传 10 个文件。</p>
                <p>对公必传：发票（PDF）、合同扫描件、报价单/比价单 | 对私必传：发票照片、消费明细（行程单/订单截图）</p>
                <p>会议/培训类必传：通知、议程、签到表</p>
              </div>
            </template>
          </Alert>
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

.attachment-tips {
  margin-bottom: 16px;
}

.attachment-tips-content {
  line-height: 1.8;
  font-size: 13px;
  color: rgb(0 0 0 / 75%);
}

.attachment-tips-content p {
  margin: 0;
}
</style>

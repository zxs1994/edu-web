<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { ExpenseReimburseBillApi } from '#/api/oa/expense';

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
  deleteExpenseReimburseBill,
  getExpenseReimburseBill,
  saveExpenseReimburseBill,
  submitExpenseReimburseBill,
} from '#/api/oa/expense';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { ExpenseDetailList } from '#/components/expense-detail-list';
import {
  filterEmptyExpenseDetails,
  normalizeExpenseDetail,
} from '#/components/expense-detail-list/data';
import { $t } from '#/locales';

import { useFormSchema } from './data';

defineOptions({ name: 'OaDailyExpenseBillInfo' });

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

const formData = ref<Partial<ExpenseReimburseBillApi.ExpenseReimburseBill>>(
  {},
);
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
      ? ((await basicFormRef.value.getFormValues()) as ExpenseReimburseBillApi.ExpenseReimburseBill)
      : ((await basicFormRef.value.getFormValues(
          false,
        )) as ExpenseReimburseBillApi.ExpenseReimburseBill);

    const validDetails = filterEmptyExpenseDetails(formData.value.details);
    formData.value.details = validDetails;

    const data = {
      ...formData.value,
      ...formValues,
      billType: 1,
      details: validDetails,
    };

    id = await (isSubmit
      ? submitExpenseReimburseBill(data)
      : saveExpenseReimburseBill(data));

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
    await deleteExpenseReimburseBill(id);
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
      paymentStatus: 0,
      billType: 1,
      billCode: '',
      details: [],
      attachments: [],
    };
    return;
  }

  loading.value = true;
  try {
    const data = await getExpenseReimburseBill(id);
    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(
            data.processStatus as number,
          ) || !isCreator.value;

    const details = (data.details || []).map((item, index) =>
      normalizeExpenseDetail(item, index),
    );

    formData.value = {
      ...data,
      details,
    };

    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues({
        ...data,
      });
    }
  } catch (error) {
    console.error('获取日常报销单详情失败:', error);
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

/**
 * 费用明细合计金额变化 → 更新表单中的报销总金额
 */
async function handleTotalAmountChange(total: number) {
  if (!basicFormRef.value) return;
  await basicFormRef.value.setFormValues({ totalAmount: total }, false);
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
        billName: '日常报销单',
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
        <CardContainer title="费用明细">
          <ExpenseDetailList
            v-model="formData.details"
            :readonly="readonly"
            @update:total="handleTotalAmountChange"
          />
        </CardContainer>

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

        <CardContainer title="报销规范">
          <Alert
            type="warning"
            show-icon
            :closable="false"
            message="报销规范提示"
          >
            <template #description>
              <div class="reimbursement-rules">
                <p>
                  1. 每笔费用需对应相应的发票或收据，附件中需包含发票金额。
                </p>
                <p>2. 发票抬头需与公司名称及报销主体一致。</p>
                <p>
                  3.
                  发票日期需在报销期间内（前后不超过3个工作日）。
                </p>
                <p>
                  4. 发票金额与报销金额需一致，如有差异需在备注中说明原因。
                </p>
              </div>
            </template>
          </Alert>
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

.reimbursement-rules {
  line-height: 2;
  font-size: 13px;
  color: rgb(0 0 0 / 75%);
}

.reimbursement-rules p {
  margin: 0;
}
</style>

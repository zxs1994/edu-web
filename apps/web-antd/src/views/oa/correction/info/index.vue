<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { CorrectionBillApi } from '#/api/oa/correction';

import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';

import { Loading } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { preferences, updatePreferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { Button, message } from 'ant-design-vue';

import {
  deleteCorrectionBill,
  freezeCorrectionBill,
  getCorrectionBill,
  saveCorrectionBill,
  submitCorrectionBill,
  unfreezeCorrectionBill,
} from '#/api/oa/correction';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { $t } from '#/locales';

import { useFormSchema } from './data';

defineOptions({ name: 'OaCorrectionBillInfo' });

// 定义组件 props
const props = defineProps<{
  id?: number | string;
  isCopy?: boolean;
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

const formData = ref<Partial<CorrectionBillApi.CorrectionBill>>({});
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
      ? ((await basicFormRef.value.getFormValues()) as CorrectionBillApi.CorrectionBill)
      : ((await basicFormRef.value.getFormValues(
          false,
        )) as CorrectionBillApi.CorrectionBill);

    const data = {
      ...formData.value,
      ...formValues,
    };

    id = await (isSubmit
      ? submitCorrectionBill(data)
      : saveCorrectionBill(data));

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
    await deleteCorrectionBill(id);
    message.success('删除成功');
    closeCurrentTab();
  } catch (error) {
    console.error('删除失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleFreeze() {
  if (!id) return;
  loading.value = true;
  try {
    if (formData.value.freezeStatus === 1) {
      await unfreezeCorrectionBill(id);
      message.success('解冻成功');
    } else {
      await freezeCorrectionBill(id);
      message.success('冻结成功');
    }
    await loadData();
  } catch (error) {
    console.error('冻结/解冻操作失败:', error);
  } finally {
    loading.value = false;
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
      createTime: new Date(),
      councilDecision: 0,
      freezeStatus: 0,
      billCode: '',
      attachments: [],
    };
    return;
  }

  loading.value = true;
  try {
    const data = await getCorrectionBill(id);
    formData.value = { ...data };
    readonly.value = !isCreator.value;

    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues(data);
    }
  } catch (error) {
    console.error('获取纠错申请单详情失败:', error);
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
        billName: '纠错申请单',
      }"
      :form-data="formData"
      :form-schema="formSchema"
      :disabled="props.isCopy || readonly"
      @close="handleClose"
      @save="handleSaveAndSubmit(false)"
      @submit="handleSaveAndSubmit(true)"
      @delete="handleDelete"
      :hide-submit="props.isCopy"
      :hide-save="props.isCopy"
      :hide-delete="props.isCopy"
    >
      <template #header-extra>
        <Button
          v-if="id && !readonly && !props.isCopy"
          :type="formData.freezeStatus === 1 ? 'default' : 'primary'"
          :danger="formData.freezeStatus !== 1"
          @click="handleFreeze"
        >
          {{ formData.freezeStatus === 1 ? '解冻' : '冻结' }}
        </Button>
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

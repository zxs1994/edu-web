<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { SealApplyBillApi } from '#/api/oa/seal/sealapply';

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
  deleteSealApplyBill,
  getSealApplyBill,
  saveSealApplyBill,
  submitSealApplyBill,
} from '#/api/oa/seal/sealapply';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { $t } from '#/locales';

import { SealSelectModal } from '../../components';
import { useFormSchema } from './data';

defineOptions({ name: 'OaSealApplyBillInfo' });

// 定义组件 props
const props = defineProps<{
  activityNodes?: any[];
  copyReason?: string; // 抄送意见
  id?: number | string; // 从 BusinessFormComponent 传递的 id
  isApproval?: boolean; // 是否审批态
  isCopy?: boolean; // 是否抄送查看模式
  nodeKey?: string; // 节点key
  nodeKeyName?: string; // 节点名称
  processDefinition?: any; // 流程定义信息
  processInstance?: any; // 流程实例信息
}>();

const route = useRoute();
const userStore = useUserStore();
/** 当前用户是否为单据创建人 */
const isCreator = computed(() => {
  const creator = formData.value?.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});
const canReturnEdit = ref(false);

const { closeCurrentTab } = useTabs();

const formData = ref<Partial<SealApplyBillApi.SealApplyBill>>({});

const readonly = ref(false);
const loading = ref(false);

// BasicForm组件引用
const basicFormRef = ref();

// 印章选择弹窗引用
const modalRef = ref<InstanceType<typeof SealSelectModal>>();

// 附件列表引用
const attachmentListRef = ref();

// 表单schema - 使用shallowRef避免深度响应式
const formSchema = shallowRef<VbenFormSchema[]>([]);

// 初始化表单schema
function initFormSchema() {
  const nodeKeyName = ref(props.nodeKeyName || '');
  formSchema.value = useFormSchema(
    modalRef,
    readonly,
    nodeKeyName,
    canReturnEdit,
  );
}

// 优先使用 props 传递的 id，如果没有则使用路由参数
let id: number | undefined = (() => {
  if (props.id) {
    return typeof props.id === 'string' ? Number(props.id) : props.id;
  }
  return route.query.id ? Number(route.query.id) : undefined;
})();

// 关闭按钮处理
function handleClose() {
  closeCurrentTab();
}

// 保存及提交
async function handleSaveAndSubmit(isSubmit: boolean) {
  loading.value = true;

  if (!basicFormRef.value) return;

  // 提交前校验 - 只有提交时才进行校验，保存时不校验
  if (isSubmit) {
    const { valid } = await basicFormRef.value.validateForm();
    // 如果校验不通过，则不允许提交
    if (!valid) {
      loading.value = false;
      return;
    }
  }

  try {
    // 获取表单值 - 保存时不进行校验
    const formValues = isSubmit
      ? ((await basicFormRef.value.getFormValues()) as SealApplyBillApi.SealApplyBill)
      : ((await basicFormRef.value.getFormValues(
          false,
        )) as SealApplyBillApi.SealApplyBill);

    // 合并表单值和其他数据
    const data = {
      ...formData.value,
      ...formValues,
    };

    id = await (isSubmit ? submitSealApplyBill(data) : saveSealApplyBill(data));

    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });

    // 保存后重新加载数据
    await loadData();
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    loading.value = false;
  }
}

// 删除
async function handleDelete() {
  if (!id) return;
  loading.value = true;
  try {
    await deleteSealApplyBill(id);
    message.success('删除成功');
    closeCurrentTab();
  } catch (error) {
    console.error('删除失败:', error);
  } finally {
    loading.value = false;
  }
}

// 撤回
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

// 加载数据
async function loadData() {
  // 新建默认数据
  if (id === undefined || id === null) {
    // 新建时设置默认值
    formData.value = {
      creator: userStore.userInfo?.id,
      creatorName: userStore.userInfo?.nickname,
      deptId: userStore.userInfo?.deptId || 0,
      deptName: userStore.userInfo?.deptName || '',
      processStatus: BpmProcessInstanceStatus.NOT_START, // 草稿状态
      createTime: new Date(),
      documentCount: 1,
      isUrgent: 0,
      useMode: 1, // 默认现场用章
      sealId: 0,
      sealNo: '',
      cause: '',
      useType: 1,
      billCode: '',
      attachments: [],
    };
    return;
  }

  // 加载数据
  loading.value = true;
  try {
    const data = await getSealApplyBill(id);
    // 扩展数据，添加显示需要的字段
    formData.value = {
      ...data,
    };
    if (
      route.query.isTodo === 'true' &&
      props.nodeKeyName === '申请人归还印章'
    ) {
      canReturnEdit.value = true;
    }
    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(
            formData.value.processStatus as number,
          ) || !isCreator.value;

    // 设置表单值
    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues(data);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '获取用印申请单详情失败';
    message.error(errorMessage);
    console.error('获取用印申请单详情失败:', error);
  } finally {
    loading.value = false;

    // 数据加载完成后，刷新BasicForm组件数据
    nextTick(() => {
      basicFormRef.value?.refreshAllData();
    });
  }
}

// 处理印章选择
// 处理附件上传
function handleUploadAttachment() {
  if (attachmentListRef.value) {
    attachmentListRef.value.handleTriggerUpload();
  }
}

async function handleSealSelect(val: any) {
  if (basicFormRef.value && val) {
    const sealData = {
      sealId: val.id,
      sealNo: val.sealNo,
      sealName: val.sealName,
      sealType: val.sealType,
      keeperId: val.keeperId,
      keeperName: val.keeperName,
      keeperDeptId: val.keeperDeptId,
      keeperDeptName: val.keeperDeptName,
    };
    // 设置表单值，不触发验证（shouldValidate = false）
    await basicFormRef.value.setFormValues(sealData, false);
    // 只清除当前字段的验证错误，不影响其他字段
    await basicFormRef.value.clearFieldError('sealName');

    // 同时更新formData
    Object.assign(formData.value, sealData);
  }
}

// 审批前的业务表单处理方法
async function beforeApproval(): Promise<boolean> {
  try {
    // 只有在审批状态且流程节点为"申请人归还印章"时才执行保存
    if (
      props.isApproval &&
      props.nodeKeyName === '申请人归还印章' &&
      basicFormRef.value
    ) {
      // 校验表单
      const { valid } = await basicFormRef.value.validateForm();
      if (!valid) {
        message.error('表单校验不通过，请先完善表单信息');
        return false;
      }

      // 获取表单值并保存
      const formValues = await basicFormRef.value.getFormValues();
      const data = {
        ...formData.value,
        ...formValues,
      };
      // 保存表单数据
      await saveSealApplyBill(data);
    }
    return true;
  } catch {
    message.error($t('ui.actionMessage.operationFailed'));
    return false;
  }
}

// 暴露方法给父组件调用
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
        billName: '用印申请单',
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
      <!-- 抄送意见展示 -->
      <template v-if="props.isCopy && props.copyReason" #footer-extra>
        <div class="copy-reason-text">抄送意见：{{ props.copyReason }}</div>
      </template>
      <!-- 扩展插槽，用于明细表格等 -->
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

    <!-- 印章选择弹窗 -->
    <SealSelectModal ref="modalRef" @select="handleSealSelect" />
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

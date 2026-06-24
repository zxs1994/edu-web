<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { CarApplyBillApi } from '#/api/oa/car/carapply';

import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import { Loading } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
} from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { useUserStore } from '@vben/stores';
import { preferences, updatePreferences } from '@vben/preferences';

import { Button, message } from 'ant-design-vue';

import { withdrawProcessToStart } from '#/api/bpm/task';
import {
  getCarApplyBill,
  saveCarApplyBill,
  submitCarApplyBill,
} from '#/api/oa/car/carapply';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { $t } from '#/locales';

import { CarSelectModal } from '../../components';
import { useFormSchema } from './data';

// 定义组件 props
const props = defineProps<{
  activityNodes?: any[];
  id?: number | string; // 从 BusinessFormComponent 传递的 id
  isApproval?: boolean; // 是否审批态
  processDefinition?: any; // 流程定义信息
  processInstance?: any; // 流程实例信息
}>();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
/** 当前用户是否为单据创建人 */
const isCreator = computed(() => {
  const creator = formData.value?.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});

const { closeCurrentTab } = useTabs();

const formData = ref<Partial<CarApplyBillApi.CarApplyBill>>({});

const readonly = ref(false);
const loading = ref(false);

// BasicForm组件引用
const basicFormRef = ref();

// 车辆选择弹窗引用
const modalRef = ref<InstanceType<typeof CarSelectModal>>();

// 附件列表引用
const attachmentListRef = ref();

// 表单schema - 使用shallowRef避免深度响应式
const formSchema = shallowRef<VbenFormSchema[]>([]);

// 初始化表单schema
function initFormSchema() {
  formSchema.value = useFormSchema(modalRef, readonly);
}

// 获取当前单据ID（每次调用都重新计算，避免缓存问题）
function getCurrentId(): number | undefined {
  if (props.id) {
    return typeof props.id === 'string' ? Number(props.id) : props.id;
  }
  return route.query.id ? Number(route.query.id) : undefined;
}

// 优先使用 props 传递的 id，如果没有则使用路由参数
let id: number | undefined = getCurrentId();

// 关闭按钮处理
function handleClose() {
  closeCurrentTab();
}

// 保存及提交
async function handleSaveAndSubmit(isSubmit: boolean) {
  loading.value = true;

  if (!basicFormRef.value) return;

  // 提交前校验
  if (isSubmit) {
    const { valid } = await basicFormRef.value.validateForm();
    // 如果校验不通过，则不允许提交
    if (!valid) {
      loading.value = false;
      return;
    }
  }

  try {
    // 获取表单值
    const formValues =
      (await basicFormRef.value.getFormValues()) as CarApplyBillApi.CarApplyBill;
    // 合并表单值和其他数据
    const data = {
      ...formData.value,
      ...formValues,
    };

    id = await (isSubmit ? submitCarApplyBill(data) : saveCarApplyBill(data));
    formData.value.id = id;

    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });

    if (!route.query.id && id) {
      await router.replace({
        path: route.path,
        query: { ...route.query, id: String(id) },
      });
    }

    // 保存后重新加载数据
    await loadData();
  } catch (error) {
    console.error('保存失败:', error);
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
  // 每次加载前重新计算id，确保从路由或props获取最新值
  id = getCurrentId() ?? id;

  // 新建默认数据
  if (id === undefined || id === null) {
    // 新建时设置默认值
    formData.value = {
      creator: userStore.userInfo?.id,
      creatorName: userStore.userInfo?.nickname,
      companyId: userStore.userInfo?.companyId,
      companyName: userStore.userInfo?.companyName || '中国引航协会',
      deptId: userStore.userInfo?.deptId,
      deptName: userStore.userInfo?.deptName,
      processStatus: BpmProcessInstanceStatus.NOT_START, // 草稿状态
      createTime: new Date(),
      attachments: [],
    };
    return;
  }

  // 加载数据
  loading.value = true;
  try {
    const data = await getCarApplyBill(id);
    // 扩展数据，添加显示需要的字段
    formData.value = {
      ...data,
    };
    // 如果有 isApproval prop，则以 prop 为准；否则根据流程状态判断
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
      error instanceof Error ? error.message : '获取用车申请单详情失败';
    message.error(errorMessage);
    console.error('获取用车申请单详情失败:', error);
  } finally {
    loading.value = false;

    // 数据加载完成后，刷新BasicForm组件数据
    nextTick(() => {
      basicFormRef.value?.refreshAllData();
    });
  }
}

// 处理车辆选择（支持多选，接收车辆数组）
async function handleCarSelect(cars: any[]) {
  if (basicFormRef.value && Array.isArray(cars) && cars.length > 0) {
    const carIds = cars.map((c) => c.id).join(',');
    const carNos = cars.map((c) => c.carNo).join(',');
    // 设置表单值，不触发验证（shouldValidate = false）
    await basicFormRef.value.setFormValues(
      {
        carNo: carNos,
        carId: carIds,
      },
      false,
    );
    // 只清除当前字段的验证错误，不影响其他字段
    await basicFormRef.value.clearFieldError('carNo');
  }
}

// 处理附件上传
function handleUploadAttachment() {
  if (attachmentListRef.value) {
    attachmentListRef.value.handleTriggerUpload();
  }
}

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
        billName: '用车申请单',
      }"
      :form-data="formData"
      :form-schema="formSchema"
      :disabled="readonly"
      @close="handleClose"
      @save="handleSaveAndSubmit(false)"
      @submit="handleSaveAndSubmit(true)"
      @revoke="handleRevoke"
      :hide-footer="props.isApproval"
      :activity-nodes="props.activityNodes"
    >
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

    <!-- 车辆选择弹窗 -->
    <CarSelectModal ref="modalRef" @select="handleCarSelect" />
  </Loading>
</template>

<style scoped>
/* 业务页面样式已封装到BasicForm组件中，无需重复定义 */
</style>

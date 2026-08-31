<!--
 * @Author: zhanghui
 * @Date: 2025-07-26 16:10:54
 * @LastEditTime: 2025-08-10 21:34:05
 * @LastEditors: zhanghui
 * @Description:
-->

<script lang="ts" setup>
import type { CSSProperties } from 'vue';

import type { headerDataProps } from './typing';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { useUserStore } from '@vben/stores';

import { Spin } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getApprovalDetail,
  getProcessInstanceBpmnModelView,
} from '#/api/bpm/processInstance';
import { useFooterLeft } from '#/utils/useFooterLeft';
import ProcessInstanceSimpleViewer from '#/views/bpm/processInstance/detail/modules/simple-bpm-viewer.vue';
import BpmProcessInstanceTaskList from '#/views/bpm/processInstance/detail/modules/task-list.vue';
import BpmProcessInstanceTimeline from '#/views/bpm/processInstance/detail/modules/time-line.vue';

import CardContainer from './card-container.vue';
import BillCorrectionApprovalHistory from './bill-correction-approval-history.vue';
import FooterForm from './footer-form.vue';
import HeaderForm from './header-form.vue';
import {
  isOnlyParentManagedFormDataChange,
  mergeFormDataProp,
} from './form-data-merge';
import { mergeSchemaDisabled } from './merge-schema-disabled';
import { useBillCorrectionDisplay } from './use-bill-correction-display';

interface Props {
  headerData?: headerDataProps;
  timelineDirection?: 'horizontal' | 'vertical'; // 时间轴方向
  activityNodes?: any[]; // 审批节点信息
  hideFooter?: boolean; // 是否隐藏底部
  hideSubmit?: boolean; // 是否隐藏提交按钮
  hideSave?: boolean; // 是否隐藏保存按钮
  hideDelete?: boolean; // 是否隐藏删除按钮
  showReCreate?: boolean; // 是否显示再次提交按钮
  // 表单相关props
  formData?: Record<string, any>; // 表单数据
  formSchema?: VbenFormSchema[]; // 表单schema
  disabled?: boolean; // 是否禁用表单
  /** 保存/提交回调，返回 false 时不关闭标签页 */
  onSaveSubmit?: (isSubmit: boolean) => Promise<boolean | void>;
  /** 保存/提交成功后是否关闭标签页 */
  closeTabOnSaveSubmit?: boolean;
  /** 会长纠错：原单据流程定义 Key，与 headerData.id 配合查询纠错历史 */
  sourceBillType?: string;
}
const props = withDefaults(defineProps<Props>(), {
  headerData: () => ({
    billName: '',
    creatorName: '',
    billCode: '',
    createDate: '',
    companyName: '',
    deptName: '',
    processStatus: BpmProcessInstanceStatus.NOT_START,
  }),
  timelineDirection: 'horizontal',
  activityNodes: () => [],
  hideFooter: false,
  hideSubmit: false,
  hideSave: false,
  hideDelete: false,
  showReCreate: false,
  formData: () => ({}),
  formSchema: () => [],
  disabled: false,
  closeTabOnSaveSubmit: true,
  sourceBillType: undefined,
});

const emit = defineEmits([
  'close',
  'save',
  'submit',
  'revoke',
  'reCreate',
  'delete',
]);

const processInstanceLoading = ref(false); // 流程实例的加载中
const processModelView = ref<any>({}); // 流程模型视图
const approvalDetailLoading = ref(false); // 审批详情的加载中
// activityNodes 已在 props 中定义，不需要重复声明
const taskListRef = ref<any>(null); // 任务列表引用
const correctionHistoryRef = ref<InstanceType<typeof BillCorrectionApprovalHistory> | null>(null);
const activityNodes = ref<any[]>(props.activityNodes || []);

const headerId = computed(() => props.headerData.id);
const headerProcessInstanceId = computed(() => props.headerData.processInstanceId);
const headerPresidentCorrectionDisplay = computed(
  () => props.headerData.presidentCorrectionDisplay,
);
const headerSourceBillType = computed(() => props.sourceBillType);

const {
  isReApprovalFlow,
  isPresidentCorrectionOverlay,
  loadCorrectionMeta,
  mergePresidentCorrectionHeader,
  onCorrectionHistoryLoaded,
  shouldShowApprovalTabs,
} = useBillCorrectionDisplay({
  billId: headerId,
  processInstanceId: headerProcessInstanceId,
  presidentCorrectionDisplay: headerPresidentCorrectionDisplay,
  sourceBillType: headerSourceBillType,
});

const displayHeaderData = computed(() => mergePresidentCorrectionHeader(props.headerData));

/** 会长异议/纠错：仅展示单据信息 Tab，审批信息/流程图移至顶部纠错历史区 */
const showApprovalTabs = computed(() => shouldShowApprovalTabs(props.headerData));

// 使用公共的 footerLeft composable
const { footerLeft } = useFooterLeft();
const { closeCurrentTab } = useTabs();

// 当前用户是否为单据创建人（新建未保存的单据 creator 为空，默认允许操作）
const userStore = useUserStore();
const isCreator = computed(() => {
  const creator = props.headerData?.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});

// 表单是否禁用（综合 props.disabled 和创建人校验）
const formDisabled = computed(() => props.disabled || !isCreator.value);

// 表单实例
let formApi: null | ReturnType<typeof useVbenForm>[1] = null;
let FormComponent: null | ReturnType<typeof useVbenForm>[0] = null;
const formRef = ref<InstanceType<ReturnType<typeof useVbenForm>[0]>>();

// 创建表单实例（当有formSchema时）
function initForm() {
  if (props.formSchema && props.formSchema.length > 0 && !formApi) {
    const [Form, api] = useVbenForm({
      commonConfig: {
        componentProps: {
          class: 'w-full',
        },
        formItemClass: 'col-span-1', // 每行四列，所以每个表单项占1/4
        labelWidth: 120,
        disabled: formDisabled.value,
      },
      layout: 'horizontal',
      schema: props.formSchema,
      showDefaultActions: false,
      wrapperClass: 'grid-cols-4', // 设置为4列布局
    });

    FormComponent = Form;
    formApi = api;
  }
}

// 监听schema变化，重新初始化表单
watch(
  () => props.formSchema,
  (newSchema) => {
    if (newSchema && newSchema.length > 0 && formApi) {
      // 更新现有表单的schema
      formApi.updateSchema(newSchema);
    } else if (newSchema && newSchema.length > 0 && !formApi) {
      // 初始化表单
      initForm();
    }
  },
  { immediate: false, deep: true },
);

// 表头样式
const headerStyle: CSSProperties = {
  textAlign: 'center',
  height: 'auto',
  lineHeight: '20px',
  backgroundColor: '#fff',
  padding: '20px 20px 0px',
};

const contentStyle: CSSProperties = {
  textAlign: 'center',
  minHeight: 'auto', // 改为自动高度，不限制最小高度
  padding: '0px 20px 80px', // 预留底部空间，避免被固定按钮遮挡
  overflow: 'visible', // 改为可见，让内容自然溢出到页面滚动
};

// 当前tab标签
const activeKey = ref('1');
/** 获取流程模型视图*/
async function getProcessModelView() {
  // 如果没有流程实例ID，则不获取流程模型视图
  if (!props.headerData.processInstanceId) {
    return;
  }

  try {
    processInstanceLoading.value = true;
    // 重置，解决 BPMN 流程图刷新不会重新渲染问题
    processModelView.value = {
      bpmnXml: '',
    };

    const data = await getProcessInstanceBpmnModelView(
      props.headerData.processInstanceId,
    );
    if (data) {
      processModelView.value = data;
    }
  } catch (error) {
    console.error('获取流程模型视图失败:', error);
  } finally {
    processInstanceLoading.value = false;
  }
}

/** 获取审批详情 */
async function getApprovalDetailData() {
  // 如果没有流程实例ID，则不获取审批详情
  if (!props.headerData.processInstanceId) {
    return;
  }

  try {
    approvalDetailLoading.value = true;
    // 重置审批节点数据
    // activityNodes 来自 props，不需要重置

    const data = await getApprovalDetail({
      processInstanceId: props.headerData.processInstanceId,
    });
    activityNodes.value = data.activityNodes;
  } catch (error) {
    console.error('获取审批详情失败:', error);
  } finally {
    approvalDetailLoading.value = false;
  }
}
// 关闭
const closeForm = () => {
  emit('close');
};

async function runSaveSubmit(isSubmit: boolean) {
  if (props.onSaveSubmit) {
    const ok = await props.onSaveSubmit(isSubmit);
    if (ok === true && props.closeTabOnSaveSubmit) {
      await closeCurrentTab();
    }
    return;
  }
  emit(isSubmit ? 'submit' : 'save');
}

// 保存
const saveForm = () => runSaveSubmit(false);
// 提交
const submitForm = () => runSaveSubmit(true);
// 撤回
const revokeForm = (reason?: string) => {
  emit('revoke', reason);
};
// 再次提交
const reCreateForm = () => {
  emit('reCreate');
};
// 删除
const deleteForm = () => {
  emit('delete');
};

/** 手动刷新所有数据 */
function refreshAllData() {
  if (props.sourceBillType && props.headerData.id) {
    correctionHistoryRef.value?.refresh();
    loadCorrectionMeta();
  }
  if (props.headerData.processInstanceId && showApprovalTabs.value) {
    getProcessModelView();
    getApprovalDetailData();
    setTimeout(() => {
      taskListRef.value?.refresh();
    }, 500);
  }
}

// 监听 formData 变化：插槽内附件/子表更新时不触碰表单字段；其余情况安全合并
watch(
  () => props.formData,
  async (newData, oldData) => {
    if (!formApi || !newData || Object.keys(newData).length === 0) {
      return;
    }
    if (newData === oldData) {
      return;
    }
    if (isOnlyParentManagedFormDataChange(newData, oldData)) {
      return;
    }
    const currentValues = (await formApi.getValues()) || {};
    await formApi.setValues(mergeFormDataProp(newData, currentValues));
  },
  { immediate: true, deep: true },
);

// 监听disabled状态变化（包含 props.disabled 和创建人校验）
watch(
  formDisabled,
  (disabled) => {
    if (formApi && props.formSchema) {
      formApi.updateSchema(mergeSchemaDisabled(props.formSchema, disabled));
    }
  },
  { immediate: true },
);

/** 初始化 */
onMounted(async () => {
  // 初始化表单
  initForm();
  await loadCorrectionMeta();

  if (showApprovalTabs.value && props.headerData.processInstanceId) {
    getProcessModelView();
    getApprovalDetailData();
  }
});

watch(
  () => props.headerData.processInstanceId,
  (processInstanceId) => {
    if (processInstanceId && showApprovalTabs.value) {
      getProcessModelView();
      getApprovalDetailData();
    }
  },
);

watch(
  () => [props.headerData.id, props.headerData.processInstanceId, props.sourceBillType] as const,
  () => {
    loadCorrectionMeta();
  },
);

watch(showApprovalTabs, (show) => {
  if (!show && activeKey.value !== '1') {
    activeKey.value = '1';
  }
  if (show && props.headerData.processInstanceId) {
    getProcessModelView();
    getApprovalDetailData();
  }
});

// 暴露方法给父组件使用
defineExpose({
  refreshAllData,
  // 表单相关方法
  async getFormValues() {
    return formApi ? await formApi.getValues() : {};
  },
  async validateForm() {
    return formApi ? await formApi.validate() : { valid: true };
  },
  async setFormValues(values: any, shouldValidate = false) {
    return formApi
      ? await formApi.setValues(values, true, shouldValidate)
      : undefined;
  },
  resetForm() {
    if (formApi) {
      formApi.setValues({});
    }
  },
  // 清除单个字段的验证错误
  async clearFieldError(fieldName: string) {
    if (formApi && formApi.form && formApi.form.setFieldError) {
      formApi.form.setFieldError(fieldName, undefined);
    }
  },
});
</script>
<template>
  <Page class="min-h-screen bg-gray-50">
    <a-layout class="min-h-full bg-white">
      <a-layout-header :style="headerStyle">
        <!-- 表头：标题 → 纠错历史 → 单据编号等信息 -->
        <HeaderForm :header-data="displayHeaderData">
          <template #after-title>
            <BillCorrectionApprovalHistory
              v-if="props.sourceBillType && props.headerData.id"
              ref="correctionHistoryRef"
              class="correction-history-banner"
              :source-bill-type="props.sourceBillType"
              :source-bill-id="props.headerData.id"
              :current-process-instance-id="props.headerData.processInstanceId"
              :overlay-active="isPresidentCorrectionOverlay"
              @loaded="onCorrectionHistoryLoaded"
            />
          </template>
        </HeaderForm>
      </a-layout-header>
      <a-layout-content :style="contentStyle">
        <!-- 主体部分 -->
        <a-tabs v-model:active-key="activeKey" class="custom-tabs">
          <a-tab-pane key="1" :tab="$t('common.billInfo')">
            <div class="form-content flex flex-col bg-white">
              <!-- 基本信息 -->
              <CardContainer :title="$t('common.baseInfo')">
                <!-- 如果有formSchema则渲染内置表单 -->
                <component v-if="formApi" :is="FormComponent" ref="formRef" />
                <!-- 否则使用插槽 -->
                <slot v-else name="base-form"></slot>
              </CardContainer>

              <!-- 扩展插槽，用于明细表格等 -->
              <slot name="form-extension"></slot>
            </div>
          </a-tab-pane>
          <a-tab-pane
            key="2"
            :tab="$t('common.approvalInfo')"
            v-if="showApprovalTabs"
          >
            <div
              v-if="approvalDetailLoading"
              class="flex items-center justify-center py-20"
            >
              <Spin size="large" />
            </div>
            <div v-else>
              <CardContainer
                :title="
                  isReApprovalFlow ? '重审审批进度' : $t('common.approvalProgress')
                "
              >
                <BpmProcessInstanceTimeline
                  :activity-nodes="
                    activityNodes && activityNodes.length > 0
                      ? activityNodes
                      : []
                  "
                  :direction="props.timelineDirection"
                  :show-status-icon="true"
                  :enable-approve-user-select="false"
                />
              </CardContainer>
            </div>

            <CardContainer
              :title="
                isReApprovalFlow ? '重审审批记录' : $t('common.approvalRecord')
              "
            >
              <BpmProcessInstanceTaskList
                v-if="props.headerData.processInstanceId"
                ref="taskListRef"
                :loading="processInstanceLoading"
                :id="props.headerData.processInstanceId"
              />
            </CardContainer>
          </a-tab-pane>
          <a-tab-pane
            key="3"
            :tab="$t('common.processFlow')"
            :force-render="true"
            v-if="showApprovalTabs"
          >
            <div class="h-full">
              <ProcessInstanceSimpleViewer
                :loading="processInstanceLoading"
                :model-view="processModelView"
              />
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-layout-content>
      <!-- 固定底部操作栏 -->
      <a-layout-footer
        v-if="!props.hideFooter"
        :style="{ left: `${footerLeft}px` }"
        class="fixed-footer-form"
      >
        <!-- 底部按钮上方的扩展区域（如抄送意见） -->
        <slot name="footer-extra"></slot>
        <!-- 底部按钮 -->
        <div class="footer-buttons">
          <FooterForm
            @submit="submitForm"
            @close="closeForm"
            @save="saveForm"
            @revoke="revokeForm"
            @re-create="reCreateForm"
            @delete="deleteForm"
            :process-status="props.headerData.processStatus"
            :process-instance-id="props.headerData.processInstanceId"
            :bill-code="props.headerData.billCode"
            :creator="props.headerData.creator"
            :hide-submit="props.hideSubmit"
            :hide-save="props.hideSave"
            :hide-delete="props.hideDelete"
            :show-re-create="props.showReCreate"
          />
        </div>
      </a-layout-footer>
    </a-layout>
  </Page>
</template>
<style lang="scss" scoped>
@use '#/styles/fixed-footer.scss' as *;

/* 移除固定高度限制，让内容自然延展 */
:deep(.ant-tabs-content) {
  min-height: 300px;
  overflow: visible;
}

/* 确保整个布局能够自适应内容高度 */
:deep(.ant-layout) {
  min-height: auto;
}

:deep(.ant-layout-content) {
  flex: none;
}

.correction-history-banner {
  padding: 0 20px 12px;
  text-align: left;
}

/* 自定义 tabs 样式 - 使用CSS变量支持主题切换 */
:deep(.custom-tabs) {
  .ant-tabs-tab {
    margin-bottom: 0 !important;
  }

  /* 导航栏 - 覆盖默认的 margin-bottom */
  &.ant-tabs-top > .ant-tabs-nav,
  &.ant-tabs-bottom > .ant-tabs-nav,
  &.ant-tabs-top > div > .ant-tabs-nav,
  &.ant-tabs-bottom > div > .ant-tabs-nav {
    margin-bottom: 0 !important;
  }

  /* 导航栏底部边框 - 使用边框色 */
  .ant-tabs-nav::before {
    border-bottom: 1px solid hsl(var(--primary) / 65%) !important;
  }

  /* Tabs 激活指示线（蓝色横线）- 使用主题色，确保优先级最高 */
  .ant-tabs-ink-bar {
    height: 2px !important;
    background: hsl(var(--primary)) !important;
  }

  /* Tabs 激活状态文字 - 使用主题色 */
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    font-weight: 500 !important;
    color: hsl(var(--primary)) !important;
  }

  /* Tabs 悬停状态 */
  .ant-tabs-tab:hover .ant-tabs-tab-btn {
    color: hsl(var(--primary)) !important;
  }

  /* Tabs 默认文字颜色 */
  .ant-tabs-tab .ant-tabs-tab-btn {
    color: hsl(var(--foreground) / 65%) !important;
  }
}

/* 全局样式封装 - 业务页面不需要再定义这些样式 */

/* 确保页面内容能够自适应高度，允许页面滚动 */
:deep(.ant-spin-nested-loading) {
  height: auto;
  min-height: auto; /* 改为自动，不强制最小高度 */
}

:deep(.ant-spin-container) {
  height: auto;
}

/* 通用flex布局样式 */
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.flex-1 {
  flex: 1;
}

.h-full {
  height: 100%;
}

/* 表单内容样式 */
.form-content {
  height: auto;
  min-height: 400px;
}

/* 表单布局优化 */
:deep(.vben-form) {
  .grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

/* 表单项样式调整 */
:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
  text-align: left;
}

.footer-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 16px;
}
</style>

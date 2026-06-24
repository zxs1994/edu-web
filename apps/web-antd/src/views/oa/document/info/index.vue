<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { DocumentDispatchBillApi } from '#/api/oa/document';
import type { RedTemplateApi } from '#/api/oa/red-template';

import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';

import { Loading, Page } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
} from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { useUserStore } from '@vben/stores';
import { preferences, updatePreferences } from '@vben/preferences';

import { Button, message, Spin } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getApprovalDetail,
  getProcessInstanceBpmnModelView,
} from '#/api/bpm/processInstance';
import { withdrawProcessToStart } from '#/api/bpm/task';
import {
  deleteDocumentDispatchBill,
  getDocumentDispatchBill,
  saveDocumentDispatchBill,
  submitDocumentDispatchBill,
} from '#/api/oa/document';
import { getRedTemplate } from '#/api/oa/red-template';
import { AttachmentList } from '#/components/attachment-list';
import { CardContainer, FooterForm, HeaderForm, mergeSchemaDisabled } from '#/components/basic-form';
import { $t } from '#/locales';
import { useFooterLeft } from '#/utils/useFooterLeft';
import ProcessInstanceSimpleViewer from '#/views/bpm/processInstance/detail/modules/simple-bpm-viewer.vue';
import BpmProcessInstanceTaskList from '#/views/bpm/processInstance/detail/modules/task-list.vue';
import BpmProcessInstanceTimeline from '#/views/bpm/processInstance/detail/modules/time-line.vue';

import { cachedDeptList, useFormSchema } from './data';
import RedPreview from './RedPreview.vue';

defineOptions({ name: 'OaDocumentDispatchBillInfo' });

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
const { footerLeft } = useFooterLeft();

const formData = ref<Partial<DocumentDispatchBillApi.DocumentDispatchBill>>({});
const readonly = ref(false);
const loading = ref(false);
const attachmentListRef = ref();
const formSchema = shallowRef<VbenFormSchema[]>([]);
const templateData = ref<Partial<RedTemplateApi.RedTemplate>>({});
const processInstanceLoading = ref(false);
const processModelView = ref<any>({});
const approvalDetailLoading = ref(false);
const activityNodes = ref<any[]>(props.activityNodes || []);
const activeKey = ref('1');
const taskListRef = ref<any>(null);

// 表单实例
let formApi: null | ReturnType<typeof useVbenForm>[1] = null;
let FormComponent: null | ReturnType<typeof useVbenForm>[0] = null;
const formRef = ref();

/** 当前用户是否为单据创建人（新建未保存的单据 creator 为空，默认允许操作） */
const isCreator = computed(() => {
  const creator = formData.value.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});

/** 是否禁用表单 */
const isDisabled = computed(() => props.isCopy || readonly.value || !isCreator.value);

/** 是否隐藏底部操作栏 */
const hideFooter = computed(() => props.isApproval && !props.isCopy);

/**
 * 根据部门ID向上查找所属公司（orgType=1）
 * @returns { companyId, companyName, deptName }
 */
function findCompanyForDept(deptId: number) {
  if (!deptId || cachedDeptList.length === 0) return null;
  const dept = cachedDeptList.find((d: any) => d.id === deptId);
  if (!dept) return null;

  let company: any = null;
  let current: any = dept;
  for (let i = 0; i < 100 && current; i++) {
    if (current.orgType === '1' || current.orgType === 1) {
      company = current;
      break;
    }
    if (!current.parentId) break;
    current = cachedDeptList.find((d: any) => d.id === current.parentId);
  }

  return {
    companyId: company?.id ?? 0,
    companyName: company?.name ?? '中国引航协会',
    deptName: dept.name ?? '',
  };
}

/** 初始化表单 schema */
function initFormSchema() {
  formSchema.value = useFormSchema();
}

/** 创建表单实例 */
function initForm() {
  if (formSchema.value.length > 0 && !formApi) {
    const [Form, api] = useVbenForm({
      commonConfig: {
        componentProps: { class: 'w-full' },
        formItemClass: 'col-span-1',
        labelWidth: 110,
        disabled: isDisabled.value,
      },
      layout: 'horizontal',
      schema: formSchema.value,
      showDefaultActions: false,
      wrapperClass: 'grid-cols-2',
      handleValuesChange: (values, fieldsChanged) => {
        formData.value = { ...formData.value, ...values };

        // 当发文部门变化时，自动解析所属公司和部门名称
        if (fieldsChanged.includes('deptId') && values.deptId && formApi) {
          const info = findCompanyForDept(values.deptId);
          if (info) {
            formApi.setFieldValue('companyId', info.companyId);
            formApi.setFieldValue('companyName', info.companyName);
            formApi.setFieldValue('deptName', info.deptName);
          }
        }
      },
    });
    FormComponent = Form;
    formApi = api;
  }
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
  if (!formApi) return;

  if (isSubmit) {
    const { valid } = await formApi.validate();
    if (!valid) {
      loading.value = false;
      return;
    }
  }

  try {
    const formValues = (await formApi.getValues()) as DocumentDispatchBillApi.DocumentDispatchBill;
    const data = { ...formData.value, ...formValues };

    // 安全兜底：如果 companyName 或 deptName 仍为空，从缓存的部门列表反查公司信息
    if (data.deptId && (!data.companyName || !data.deptName)) {
      const info = findCompanyForDept(data.deptId);
      if (info) {
        data.companyId = info.companyId;
        data.companyName = info.companyName;
        data.deptName = info.deptName;
      }
    }

    // 多选 TreeSelect 字段：数组 → 逗号分隔字符串
    if (Array.isArray(data.mainRecipients)) {
      data.mainRecipients = data.mainRecipients.join(',');
    }
    if (Array.isArray(data.ccDepartments)) {
      data.ccDepartments = data.ccDepartments.join(',');
    }

    id = await (isSubmit
      ? submitDocumentDispatchBill(data)
      : saveDocumentDispatchBill(data));

    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });

    closeCurrentTab();
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
    await deleteDocumentDispatchBill(id);
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
      creator: String(userStore.userInfo?.id ?? ''),
      creatorName: userStore.userInfo?.nickname,
      companyId: userStore.userInfo?.companyId || 0,
      companyName: userStore.userInfo?.companyName || '中国引航协会',
      deptId: userStore.userInfo?.deptId || 0,
      deptName: userStore.userInfo?.deptName || '',
      processStatus: BpmProcessInstanceStatus.NOT_START,
      createTime: new Date(),
      urgencyLevel: 0,
      isImportant: 0,
      attachments: [],
    };
    return;
  }

  loading.value = true;
  try {
    const data = await getDocumentDispatchBill(id);
    formData.value = { ...data };

    // 逗号分隔字符串 → 数组（供多选 TreeSelect 回显）
    const formValues = { ...data } as Record<string, any>;
    if (typeof formValues.mainRecipients === 'string' && formValues.mainRecipients) {
      formValues.mainRecipients = formValues.mainRecipients.split(',').map(Number);
    }
    if (typeof formValues.ccDepartments === 'string' && formValues.ccDepartments) {
      formValues.ccDepartments = formValues.ccDepartments.split(',').map(Number);
    }

    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(
            formData.value.processStatus as number,
          );

    if (formApi) {
      await formApi.setValues(formValues, true, false);
    }

    // 如果已有模板 ID，加载模板数据用于预览
    if (data.templateId) {
      await loadTemplateData(data.templateId);
    }

    if (formData.value.processInstanceId) {
      await getProcessModelView();
      await getApprovalDetailData();
    }
  } catch (error) {
    console.error('获取公文发文单详情失败:', error);
  } finally {
    loading.value = false;
  }
}

/** 加载套红模板数据（用于右侧预览） */
async function loadTemplateData(templateId: number) {
  try {
    const tpl = await getRedTemplate(templateId);
    templateData.value = tpl || {};
  } catch (error) {
    console.error('获取套红模板失败:', error);
  }
}

/** 获取流程模型视图 */
async function getProcessModelView() {
  if (!formData.value.processInstanceId) return;
  try {
    processInstanceLoading.value = true;
    processModelView.value = { bpmnXml: '' };
    const data = await getProcessInstanceBpmnModelView(
      formData.value.processInstanceId,
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
  if (!formData.value.processInstanceId) return;
  try {
    approvalDetailLoading.value = true;
    const data = await getApprovalDetail({
      processInstanceId: formData.value.processInstanceId,
    });
    activityNodes.value = data.activityNodes;
  } catch (error) {
    console.error('获取审批详情失败:', error);
  } finally {
    approvalDetailLoading.value = false;
  }
}

function handleUploadAttachment() {
  if (attachmentListRef.value) {
    attachmentListRef.value.handleTriggerUpload();
  }
}

// ===== Watchers =====

// 表单值变化 → 更新 formData（驱动右侧预览）
// 已通过 useVbenForm 的 handleValuesChange 回调实现，无需额外 watch

// 监听 templateId 变化 → 加载对应模板数据
watch(
  () => formData.value.templateId,
  (newId) => {
    if (newId) {
      loadTemplateData(newId);
    } else {
      templateData.value = {};
    }
  },
);

// 监听 disabled 状态变化
watch(isDisabled, (disabled) => {
  if (formApi && formSchema.value) {
    formApi.updateSchema(mergeSchemaDisabled(formSchema.value, disabled));
  }
});

// 监听 schema 变化 → 更新表单
watch(
  () => formSchema.value,
  (newSchema) => {
    if (newSchema && newSchema.length > 0 && formApi) {
      formApi.updateSchema(newSchema);
    } else if (newSchema && newSchema.length > 0 && !formApi) {
      initForm();
    }
  },
  { deep: true },
);

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
  initForm();
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
  <Page class="min-h-screen bg-gray-50">
    <Loading :spinning="loading">
      <a-layout class="min-h-full bg-white">
        <!-- 表头 -->
        <a-layout-header class="page-header">
          <HeaderForm
            :header-data="{
              ...formData,
              billName: '公文发文单',
            }"
          />
        </a-layout-header>

        <!-- 主体内容 -->
        <a-layout-content class="page-content">
          <a-tabs v-model:active-key="activeKey" class="custom-tabs">
            <!-- Tab 1: 单据信息（左表单 + 右预览） -->
            <a-tab-pane key="1" :tab="$t('common.billInfo')">
              <Alert
                v-if="route.query.from === 'startProcess'"
                type="info"
                show-icon
                :closable="false"
                message="提示：重要公文会前会商研讨。"
                style="margin-bottom: 16px;"
              />
              <div class="split-layout">
                <!-- 左侧：表单 -->
                <div class="split-left">
                  <CardContainer :title="$t('common.baseInfo')">
                    <component
                      v-if="formApi"
                      :is="FormComponent"
                      ref="formRef"
                    />
                  </CardContainer>

                  <CardContainer :title="$t('common.attachmentInfo')">
                    <template #extra>
                      <Button
                        v-if="!isDisabled"
                        type="primary"
                        size="small"
                        @click="handleUploadAttachment"
                      >
                        上传附件
                      </Button>
                    </template>
                    <AttachmentList
                      ref="attachmentListRef"
                      v-model="formData.attachments"
                      :readonly="isDisabled"
                      :max-count="10"
                      :max-size="20"
                      :hide-upload-button="true"
                    />
                  </CardContainer>
                </div>

                <!-- 右侧：套红预览 -->
                <div class="split-right">
                  <RedPreview
                    :form-data="formData"
                    :template-data="templateData"
                  />
                </div>
              </div>
            </a-tab-pane>

            <!-- Tab 2: 审批信息 -->
            <a-tab-pane
              v-if="
                formData.processInstanceId && formData.processStatus
              "
              key="2"
              :tab="$t('common.approvalInfo')"
            >
              <div
                v-if="approvalDetailLoading"
                class="flex items-center justify-center py-20"
              >
                <Spin size="large" />
              </div>
              <div v-else>
                <CardContainer :title="$t('common.approvalProgress')">
                  <BpmProcessInstanceTimeline
                    :activity-nodes="
                      activityNodes && activityNodes.length > 0
                        ? activityNodes
                        : []
                    "
                    :direction="'horizontal'"
                    :show-status-icon="true"
                    :enable-approve-user-select="false"
                  />
                </CardContainer>
              </div>
              <CardContainer :title="$t('common.approvalRecord')">
                <BpmProcessInstanceTaskList
                  v-if="formData.processInstanceId"
                  ref="taskListRef"
                  :loading="processInstanceLoading"
                  :id="formData.processInstanceId"
                />
              </CardContainer>
            </a-tab-pane>

            <!-- Tab 3: 流程图 -->
            <a-tab-pane
              v-if="
                formData.processInstanceId && formData.processStatus
              "
              key="3"
              :tab="$t('common.processFlow')"
              :force-render="true"
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
          v-if="!hideFooter"
          :style="{ left: `${footerLeft}px` }"
          class="fixed-footer-form"
        >
          <template v-if="props.isCopy && props.copyReason">
            <div class="copy-reason-text">
              抄送意见：{{ props.copyReason }}
            </div>
          </template>
          <div class="footer-buttons">
            <FooterForm
              :process-status="formData.processStatus"
              :bill-code="formData.billCode"
              :creator="formData.creator"
              :hide-submit="props.isCopy"
              :hide-save="props.isCopy"
              :hide-delete="props.isCopy"
              @submit="handleSaveAndSubmit(true)"
              @close="handleClose"
              @save="handleSaveAndSubmit(false)"
              @revoke="handleRevoke"
              @delete="handleDelete"
            />
          </div>
        </a-layout-footer>
      </a-layout>
    </Loading>
  </Page>
</template>

<style lang="scss" scoped>
@use '#/styles/fixed-footer.scss' as *;

/* 页头样式 */
.page-header {
  text-align: center;
  height: auto;
  line-height: 20px;
  background-color: #fff;
  padding: 20px 20px 0;
}

/* 主体内容样式 */
.page-content {
  text-align: center;
  min-height: auto;
  padding: 0 20px 80px;
  overflow: visible;
}

/* 左右分栏布局 */
.split-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.split-left {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.split-right {
  flex-shrink: 0;
  width: 420px;
  position: sticky;
  top: 16px;
  align-self: flex-start;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

/* 自定义 tabs 样式 */
:deep(.custom-tabs) {
  .ant-tabs-tab {
    margin-bottom: 0 !important;
  }

  &.ant-tabs-top > .ant-tabs-nav,
  &.ant-tabs-bottom > .ant-tabs-nav,
  &.ant-tabs-top > div > .ant-tabs-nav,
  &.ant-tabs-bottom > div > .ant-tabs-nav {
    margin-bottom: 0 !important;
  }

  .ant-tabs-nav::before {
    border-bottom: 1px solid hsl(var(--primary) / 65%) !important;
  }

  .ant-tabs-ink-bar {
    height: 2px !important;
    background: hsl(var(--primary)) !important;
  }

  .ant-tabs-tab-active .ant-tabs-tab-btn {
    font-weight: 500 !important;
    color: hsl(var(--primary)) !important;
  }

  .ant-tabs-tab:hover .ant-tabs-tab-btn {
    color: hsl(var(--primary)) !important;
  }

  .ant-tabs-tab .ant-tabs-tab-btn {
    color: hsl(var(--foreground) / 65%) !important;
  }
}

/* 表单网格布局调整（左侧2列） */
:deep(.vben-form) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

/* 表单项样式 */
:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
  text-align: left;
}

/* 抄送意见 */
.copy-reason-text {
  width: 100%;
  padding: 8px 16px;
  font-size: 13px;
  color: rgb(0 0 0 / 65%);
  text-align: center;
  background-color: rgb(0 0 0 / 4%);
  border-bottom: 1px solid #f0f0f0;
}

.footer-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 16px;
}

/* 全局高度自适应 */
:deep(.ant-spin-nested-loading) {
  height: auto;
  min-height: auto;
}

:deep(.ant-spin-container) {
  height: auto;
}

:deep(.ant-layout) {
  min-height: auto;
}

:deep(.ant-layout-content) {
  flex: none;
}
</style>

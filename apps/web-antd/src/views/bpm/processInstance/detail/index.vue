<script lang="ts" setup>
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';
import type { SystemUserApi } from '#/api/system/user';

import { computed, nextTick, onMounted, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';

import { Loading } from '@vben/common-ui';
import { BpmModelFormType, BpmProcessInstanceStatus } from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import {
  getApprovalDetail as getApprovalDetailApi,
  resubmitProcessInstance,
} from '#/api/bpm/processInstance';
import { withdrawProcessToStart } from '#/api/bpm/task';
import { getSimpleUserList } from '#/api/system/user';
import { BasicForm } from '#/components/basic-form';
import { setConfAndFields2 } from '#/components/form-create';
import { registerComponent } from '#/utils';

import ProcessInstanceOperationButton from './modules/operation-button.vue';

defineOptions({ name: 'BpmProcessInstanceDetail' });

const props = withDefaults(
  defineProps<{
    activityId?: string; // 流程活动编号，用于抄送查看
    id: string; // 流程实例的编号
    isTodo?: boolean; // 是否待办，用于判断是否显示底部操作按钮
    nodeKey?: string; // 任务节点key
    taskId?: string; // 任务编号
  }>(),
  {
    activityId: undefined,
    isTodo: true,
    taskId: undefined,
    nodeKey: undefined,
  },
);

enum FieldPermissionType {
  /**
   * 隐藏
   */
  // eslint-disable-next-line no-unused-vars
  NONE = '3',
  /**
   * 只读
   */
  // eslint-disable-next-line no-unused-vars
  READ = '1',
  /**
   * 编辑
   */
  // eslint-disable-next-line no-unused-vars
  WRITE = '2',
}

// 处理路由参数中的 isMy（可能是字符串）
const route = useRoute();
const userStore = useUserStore();
const { closeCurrentTab } = useTabs();

const isApproval = computed(() => {
  const queryApproval = route.query.isTodo;
  // 情况1：明确指定为false
  if (queryApproval === 'false') {
    return false;
  }

  // 情况2：queryApproval为'true'且当前任务状态为-1未提交且当前登录人等于制单人
  if (queryApproval === 'true') {
    // 获取流程发起人信息
    const startUser = processInstance.value?.startUser;
    // 获取当前登录用户ID
    const currentUserId = userStore.userInfo?.id;

    // 检查是否满足返回false的条件：
    // 1. 当前任务状态为-1（未提交）
    // 2. 当前登录人等于制单人
    if (
      startUser?.id &&
      currentUserId &&
      String(startUser.id) === String(currentUserId) &&
      processInstance.value?.status !== BpmProcessInstanceStatus.RUNNING
    ) {
      return false;
    }
  }

  return props.isTodo;
});

const processInstanceLoading = ref(false); // 流程实例的加载中
const processInstance = ref<BpmProcessInstanceApi.ProcessInstance>(); // 流程实例
const processDefinition = ref<any>({}); // 流程定义
// 使用 props 中的 nodeKey 或者从 route.query 获取
const nodeKey = computed(
  () => props.nodeKey || (route.query.nodeKey as string),
);
const nodeKeyName = ref<string>(); // 节点名称
const operationButtonRef = ref(); // 操作按钮组件 ref

// ========== 申请信息 ==========
const fApi = ref<any>(); //
const detailForm = ref({
  rule: [],
  option: {},
  value: {},
}); // 流程实例的表单详情

const writableFields: Array<string> = []; // 表单可以编辑的字段

/** 加载流程实例 */
const BusinessFormComponent = shallowRef<any>(null); // 异步组件
const businessFormRef = ref(); // 业务表单组件引用

// BasicForm组件引用（用于流程表单）
const basicFormRef = ref();

// 审批节点信息
const activityNodes = ref<BpmProcessInstanceApi.ApprovalNodeInfo[]>([]);

// 当前待办任务（用于撤回后重新提交）
const todoTask = ref<any>(null);

/** 是否处于可编辑状态（撤回后的 NOT_START 且有待办任务） */
const isEditable = computed(() => {
  return (
    processInstance.value?.status === BpmProcessInstanceStatus.NOT_START &&
    !!todoTask.value
  );
});

/** 构建流程表单的 headerData */
const normalFormHeaderData = computed(() => {
  if (!processInstance.value) {
    return {
      billName: processDefinition.value?.name || '',
      processStatus: BpmProcessInstanceStatus.NOT_START,
    };
  }
  return {
    billName:
      processDefinition.value?.name || processInstance.value?.name || '',
    processStatus: processInstance.value.status,
    billCode: String(processInstance.value.id),
    creatorName: processInstance.value.startUser?.nickname,
    createTime: processInstance.value.startTime,
    deptName: processInstance.value.startUser?.deptName,
    companyName: (processInstance.value.startUser as any)?.companyName || '',
    processInstanceId: String(processInstance.value.id),
  };
});

/** 获取详情 */
async function getDetail() {
  getApprovalDetail();
}

async function getApprovalDetail() {
  processInstanceLoading.value = true;
  try {
    const param = {
      processInstanceId: props.id,
      activityId: props.activityId,
      taskId: props.taskId,
    };
    const data = await getApprovalDetailApi(param);

    if (!data) {
      message.error('查询不到审批详情信息！');
    }

    if (!data.processDefinition || !data.processInstance) {
      message.error('查询不到流程信息！');
    }

    processInstance.value = data.processInstance;
    processDefinition.value = data.processDefinition;
    todoTask.value = data.todoTask; // 保存待办任务引用
    nodeKeyName.value = data.todoTask?.name;

    // 设置表单信息
    if (processDefinition.value.formType === BpmModelFormType.NORMAL) {
      // 获取表单字段权限
      const formFieldsPermission = data.formFieldsPermission;
      // 清空可编辑字段为空
      writableFields.splice(0);
      if (detailForm.value.rule?.length > 0) {
        // 避免刷新 form-create 显示不了
        detailForm.value.value = processInstance.value.formVariables;
      } else {
        setConfAndFields2(
          detailForm,
          processDefinition.value.formConf,
          processDefinition.value.formFields,
          processInstance.value.formVariables,
        );
      }
      nextTick().then(() => {
        fApi.value?.btn.show(false);
        fApi.value?.resetBtn.show(false);
        // 撤回后可编辑，否则禁用
        fApi.value?.disabled(!isEditable.value);
        // 设置表单字段权限
        if (formFieldsPermission) {
          if (isEditable.value) {
            // 可编辑状态：所有字段可写，仍隐藏 NONE 权限字段
            Object.keys(data.formFieldsPermission).forEach((item) => {
              if (formFieldsPermission[item] === FieldPermissionType.NONE) {
                fApi.value?.hidden(true, item);
              } else {
                fApi.value?.disabled(false, item);
                writableFields.push(item);
              }
            });
          } else {
            Object.keys(data.formFieldsPermission).forEach((item) => {
              setFieldPermission(item, formFieldsPermission[item]);
            });
          }
        }
      });
    } else {
      // 注意：data.processDefinition.formCustomViewPath 是组件的全路径，例如说：/crm/contract/detail/index.vue
      BusinessFormComponent.value = registerComponent(
        data?.processDefinition?.formCustomViewPath || '',
      );
    }

    // 获取审批节点，显示 Timeline 的数据
    activityNodes.value = data.activityNodes;

    // 获取待办任务显示操作按钮（需要等待 DOM 更新后 operationButtonRef 才可用）
    nextTick(() => {
      operationButtonRef.value?.loadTodoTask(data.todoTask);
      // 刷新 BasicForm 内部的审批信息、流程图和任务列表（与业务表单保持一致）
      basicFormRef.value?.refreshAllData();
    });
  } catch {
    message.error('获取审批详情失败！');
  } finally {
    processInstanceLoading.value = false;
  }
}

/**
 * 设置表单权限
 */
function setFieldPermission(field: string, permission: string) {
  if (permission === FieldPermissionType.READ) {
    fApi.value?.disabled(true, field);
  }
  if (permission === FieldPermissionType.WRITE) {
    fApi.value?.disabled(false, field);
    // 加入可以编辑的字段
    writableFields.push(field);
  }
  if (permission === FieldPermissionType.NONE) {
    fApi.value?.hidden(true, field);
  }
}

/**
 * 审批前的业务表单处理
 * 在审批通过前调用业务表单的预处理方法
 */
async function handleBeforeApproval(): Promise<boolean> {
  try {
    // 如果是业务表单且有预处理方法，则调用
    if (
      businessFormRef.value &&
      typeof businessFormRef.value.beforeApproval === 'function'
    ) {
      const result = await businessFormRef.value.beforeApproval();
      return result !== false; // 如果返回false则阻止审批
    }
    return true; // 默认允许审批
  } catch (error) {
    console.error('业务表单预处理失败:', error);
    message.error('业务表单处理失败，请检查后重试');
    return false;
  }
}

/** 流程表单 - 关闭 */
function handleClose() {
  closeCurrentTab();
}

/** 流程表单 - 撤回（退回到开始节点，可重新编辑提交） */
async function handleRevoke(reason?: string) {
  if (!processInstance.value?.id) return;
  try {
    processInstanceLoading.value = true;
    await withdrawProcessToStart({
      processInstanceId: String(processInstance.value.id),
      reason: reason || '发起人撤回',
    });
    message.success('撤回成功');
    await getDetail();
  } catch (error) {
    console.error('撤回失败:', error);
  } finally {
    processInstanceLoading.value = false;
  }
}

/** 流程表单 - 提交（撤回后重新提交） */
async function handleSubmit() {
  if (!processInstance.value?.id) {
    message.error('没有找到流程实例，无法提交');
    return;
  }
  try {
    processInstanceLoading.value = true;
    // 收集所有表单字段的值作为流程变量（撤回后重新提交需要全量提交）
    const variables: Record<string, any> = {
      ...detailForm.value.value,
    };
    // 调用后端重新提交接口（更新状态为审批中 + 审批发起人任务）
    await resubmitProcessInstance({
      processInstanceId: String(processInstance.value.id),
      variables,
    });
    message.success('提交成功');
    // 刷新详情页以更新状态
    await getDetail();
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    processInstanceLoading.value = false;
  }
}

/** 初始化 */
const userOptions = ref<SystemUserApi.User[]>([]); // 用户列表
onMounted(async () => {
  await getDetail();
  // 获得用户列表
  userOptions.value = await getSimpleUserList();
});
</script>

<template>
  <div class="bpm-process-instance-detail">
    <!-- 初始加载中 -->
    <Loading
      v-if="processInstanceLoading && !processDefinition?.formType"
      :spinning="true"
    />

    <!-- ======== 流程表单 (NORMAL) ======== -->
    <template
      v-else-if="processDefinition?.formType === BpmModelFormType.NORMAL"
    >
      <Loading :spinning="processInstanceLoading">
        <BasicForm
          ref="basicFormRef"
          :header-data="normalFormHeaderData"
          :activity-nodes="activityNodes"
          :hide-footer="isApproval"
          :hide-submit="!isEditable"
          :hide-save="true"
          :disabled="!isEditable"
          @close="handleClose"
          @submit="handleSubmit"
          @revoke="handleRevoke"
        >
          <!-- 表单内容：使用 form-create 渲染 -->
          <template #base-form>
            <form-create
              v-model="detailForm.value"
              v-model:api="fApi"
              :option="detailForm.option"
              :rule="detailForm.rule"
            />
          </template>
        </BasicForm>
      </Loading>

      <!-- 审批态：底部操作按钮（operation-button 内部已有固定定位样式） -->
      <ProcessInstanceOperationButton
        v-if="isApproval"
        ref="operationButtonRef"
        :process-instance="processInstance"
        :process-definition="processDefinition"
        :user-options="userOptions"
        :normal-form="detailForm"
        :normal-form-api="fApi"
        :writable-fields="writableFields"
        @success="getDetail"
      />
    </template>

    <!-- ======== 业务表单 (CUSTOM) ======== -->
    <template
      v-else-if="processDefinition?.formType === BpmModelFormType.CUSTOM"
    >
      <BusinessFormComponent
        ref="businessFormRef"
        :id="processInstance?.businessKey"
        :is-approval="isApproval"
        :activity-nodes="activityNodes"
        :process-instance="processInstance"
        :process-definition="processDefinition"
        :node-key="nodeKey"
        :node-key-name="nodeKeyName"
      />
      <!-- 审批态：底部操作按钮 -->
      <ProcessInstanceOperationButton
        v-if="isApproval"
        ref="operationButtonRef"
        :process-instance="processInstance"
        :process-definition="processDefinition"
        :user-options="userOptions"
        :normal-form="detailForm"
        :normal-form-api="fApi"
        :writable-fields="writableFields"
        :before-approval="handleBeforeApproval"
        @success="getDetail"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '#/styles/fixed-footer.scss' as *;
</style>

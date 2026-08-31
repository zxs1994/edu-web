<!--
 * @Author: zhanghui
 * @Date: 2025-08-04 23:13:26
 * @LastEditTime: 2025-08-10 21:42:50
 * @LastEditors: zhanghui
 * @Description: 表单详情页底部操作按钮
-->

<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import { computed, reactive, ref } from 'vue';

import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
} from '@vben/constants';

import { useUserStore } from '@vben/stores';

import {
  Button,
  Form,
  FormItem,
  Popover,
  Space,
  Textarea,
} from 'ant-design-vue';

// 传入组件参数
const props = defineProps({
  status: {
    type: String as any,
    default: '',
  },
  processStatus: {
    type: [String, Number] as any,
    default: BpmProcessInstanceStatus.NOT_START,
  },
  submitText: {
    type: String,
    default: '提交',
  },
  /** 是否隐藏提交按钮 */
  hideSubmit: {
    type: Boolean,
    default: false,
  },
  /** 是否隐藏保存按钮 */
  hideSave: {
    type: Boolean,
    default: false,
  },
  /** 是否隐藏删除按钮 */
  hideDelete: {
    type: Boolean,
    default: false,
  },
  /** 单据编号（新建未保存时为空，此时不显示删除按钮） */
  billCode: {
    type: String,
    default: '',
  },
  /** 是否显示再次提交按钮（流程已结束时使用） */
  showReCreate: {
    type: Boolean,
    default: false,
  },
  /** 单据创建人ID（用于权限校验，只有创建人才能看到编辑按钮） */
  creator: {
    type: [String, Number] as any,
    default: undefined,
  },
  /** 流程实例ID（有实例且审批中才显示撤回） */
  processInstanceId: {
    type: String,
    default: '',
  },
});
const emit = defineEmits([
  'close',
  'save',
  'submit',
  'revoke',
  'reCreate',
  'delete',
]);

/** 流程是否已结束 */
const isEndStatus = computed(() => {
  return (
    props.processStatus === BpmProcessInstanceStatus.APPROVE ||
    props.processStatus === BpmProcessInstanceStatus.REJECT ||
    props.processStatus === BpmProcessInstanceStatus.CANCEL
  );
});

/** 当前用户是否为单据创建人（新建未保存的单据也视为创建人） */
const userStore = useUserStore();
const isCreator = computed(() => {
  // 新建未保存的单据，creator为空，默认允许操作
  if (!props.creator) return true;
  return String(userStore.userInfo?.id) === String(props.creator);
});

// 撤回弹窗相关
const revokePopoverVisible = ref(false);
const revokeFormRef = ref<FormInstance>();
const revokeReasonForm = reactive({
  reason: '',
});
const revokeReasonRule: any = computed(() => {
  return {
    reason: [{ required: true, message: '请输入撤回原因', trigger: 'blur' }],
  };
});

// 关闭
const closeForm = () => {
  emit('close');
};
// 保存
const saveForm = () => {
  emit('save');
};
// 提交
const submitForm = () => {
  emit('submit');
};
// 再次提交
const reCreateForm = () => {
  emit('reCreate');
};

// 删除相关
const deletePopoverVisible = ref(false);
const openDeletePopover = () => {
  deletePopoverVisible.value = true;
};
const closeDeletePopover = () => {
  deletePopoverVisible.value = false;
};
const confirmDelete = () => {
  emit('delete');
  closeDeletePopover();
};

// 打开撤回弹窗
const openRevokePopover = () => {
  revokePopoverVisible.value = true;
};

// 关闭撤回弹窗
const closeRevokePopover = () => {
  revokePopoverVisible.value = false;
  if (revokeFormRef.value) {
    revokeFormRef.value.resetFields();
  }
};

// 确认撤回
const confirmRevoke = async () => {
  if (!revokeFormRef.value) return;

  try {
    await revokeFormRef.value.validate();
    emit('revoke', revokeReasonForm.reason);
    closeRevokePopover();
  } catch (error) {
    console.error('撤回表单验证失败:', error);
  }
};
</script>
<template>
  <Space>
    <!-- 【提交】按钮 -->
    <Button
      type="primary"
      @click="submitForm"
      v-if="
        !hideSubmit &&
        processStatus &&
        BpmProcessInstanceStatusEditValue.includes(processStatus) &&
        isCreator
      "
    >
      {{ $t('common.submit') }}
    </Button>
    <!-- 【保存】按钮 -->
    <Button
      @click="saveForm"
      v-if="
        !hideSave &&
        processStatus &&
        BpmProcessInstanceStatusEditValue.includes(processStatus) &&
        isCreator
      "
    >
      {{ $t('common.save') }}
    </Button>
    <!-- 【撤回】按钮：制单人 + 审批中 + 已有流程实例 -->
    <Popover
      v-model:open="revokePopoverVisible"
      placement="top"
      :overlay-style="{ minWidth: '400px' }"
      trigger="click"
      v-if="
        processInstanceId &&
        processStatus === BpmProcessInstanceStatus.RUNNING &&
        isCreator
      "
    >
      <Button type="primary" @click="openRevokePopover">
        {{ $t('common.revoke') }}
      </Button>
      <template #content>
        <div class="flex flex-1 flex-col px-5 pt-5">
          <Form
            layout="vertical"
            class="mb-auto"
            ref="revokeFormRef"
            :model="revokeReasonForm"
            :rules="revokeReasonRule"
            label-width="100px"
          >
            <FormItem label="撤回原因" name="reason">
              <Textarea
                v-model:value="revokeReasonForm.reason"
                placeholder="请输入撤回原因"
                :rows="4"
              />
            </FormItem>
            <FormItem>
              <Button type="primary" @click="confirmRevoke"> 确认撤回 </Button>
              <Button class="ml-2" @click="closeRevokePopover"> 取消 </Button>
            </FormItem>
          </Form>
        </div>
      </template>
    </Popover>
    <!-- 【删除】按钮 -->
    <Popover
      v-model:open="deletePopoverVisible"
      placement="top"
      :overlay-style="{ minWidth: '300px' }"
      trigger="click"
      v-if="
        !hideDelete &&
        billCode &&
        processStatus &&
        BpmProcessInstanceStatusEditValue.includes(processStatus) &&
        isCreator
      "
    >
      <Button danger type="primary" @click="openDeletePopover">
        {{ $t('common.delete') }}
      </Button>
      <template #content>
        <div class="flex flex-1 flex-col px-5 pt-5">
          <p class="mb-4">
            确定要删除此单据吗？删除后单据信息和流程数据将一并清理，不可恢复。
          </p>
          <div>
            <Button danger type="primary" @click="confirmDelete">
              确认删除
            </Button>
            <Button class="ml-2" @click="closeDeletePopover"> 取消 </Button>
          </div>
        </div>
      </template>
    </Popover>
    <!-- 【再次提交】按钮 -->
    <Button @click="reCreateForm" v-if="showReCreate && isEndStatus">
      再次提交
    </Button>
    <!-- 【关闭】按钮 -->
    <Button @click="closeForm">{{ $t('common.close') }}</Button>
  </Space>
</template>
<style scoped></style>

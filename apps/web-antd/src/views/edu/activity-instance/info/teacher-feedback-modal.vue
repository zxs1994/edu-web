<script lang="ts" setup>
import type { ActivityInstanceApi } from '#/api/edu/activity-instance';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { saveTeacherFeedback } from '#/api/edu/activity-instance';

import { useTeacherFeedbackFormSchema } from './feedback-data';

const emit = defineEmits(['success']);

const instanceId = ref<number>();
const activityName = ref('');
const readonly = ref(false);

const modalTitle = computed(() => {
  const name = activityName.value || '活动';
  return readonly.value ? `查看教培反馈 - ${name}` : `填写教培反馈 - ${name}`;
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  wrapperClass: 'grid grid-cols-1 gap-4',
  layout: 'vertical',
  schema: useTeacherFeedbackFormSchema(false),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[560px]',
  async onConfirm() {
    if (readonly.value || !instanceId.value) {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      await saveTeacherFeedback({
        instanceId: instanceId.value,
        summary: values.summary,
        problem: values.problem,
        suggestion: values.suggestion,
      });
      message.success('教培反馈提交成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      instanceId.value = undefined;
      activityName.value = '';
      readonly.value = false;
      return;
    }
    const data = modalApi.getData<{
      instanceId: number;
      activityName?: string;
      readonly?: boolean;
      feedback?: ActivityInstanceApi.TeacherFeedback | null;
    }>();
    if (!data?.instanceId) {
      return;
    }
    instanceId.value = data.instanceId;
    activityName.value = data.activityName ?? '';
    readonly.value = !!data.readonly;
    formApi.updateSchema(useTeacherFeedbackFormSchema(readonly.value));
    formApi.setValues({
      summary: data.feedback?.summary ?? '',
      problem: data.feedback?.problem ?? '',
      suggestion: data.feedback?.suggestion ?? '',
    });
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal
    :title="modalTitle"
    :show-cancel-button="!readonly"
    :show-confirm-button="true"
    :confirm-text="readonly ? '关闭' : '提交'"
  >
    <Form />
  </Modal>
</template>

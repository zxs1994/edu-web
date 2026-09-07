<script lang="ts" setup>
import type { ActivityInstanceApi } from '#/api/edu/activity-instance';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { saveStudentFeedback } from '#/api/edu/activity-instance';

import { useStudentFeedbackFormSchema } from './feedback-data';

const emit = defineEmits(['success']);

const instanceId = ref<number>();
const activityName = ref('');
const readonly = ref(false);

const modalTitle = computed(() => {
  const name = activityName.value || '活动';
  return readonly.value ? `查看学生反馈 - ${name}` : `填写学生反馈 - ${name}`;
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  wrapperClass: 'grid grid-cols-1 gap-4',
  layout: 'vertical',
  schema: useStudentFeedbackFormSchema(false),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[520px]',
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
      await saveStudentFeedback({
        instanceId: instanceId.value,
        satisfaction: values.satisfaction,
        harvest: values.harvest,
        content: values.content,
      });
      message.success('学生反馈提交成功');
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
      feedback?: ActivityInstanceApi.StudentFeedback | null;
    }>();
    if (!data?.instanceId) {
      return;
    }
    instanceId.value = data.instanceId;
    activityName.value = data.activityName ?? '';
    readonly.value = !!data.readonly;
    formApi.updateSchema(useStudentFeedbackFormSchema(readonly.value));
    formApi.setValues({
      satisfaction: data.feedback?.satisfaction,
      harvest: data.feedback?.harvest ?? '',
      content: data.feedback?.content ?? '',
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

<script lang="ts" setup>
import type { ActivityInstanceApi } from '#/api/edu/activity-instance';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getMyStudentFeedback,
  saveStudentFeedback,
} from '#/api/edu/activity-instance';

import { useStudentFeedbackFormSchema } from '../info/feedback-data';

const emit = defineEmits(['success']);

const instanceRow = ref<ActivityInstanceApi.EnrollableInstance>();
const readonly = ref(false);

const modalTitle = computed(() => {
  const name = instanceRow.value?.activityName ?? '活动';
  return readonly.value ? `查看反馈 - ${name}` : `填写反馈 - ${name}`;
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
    if (readonly.value || !instanceRow.value?.id) {
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
        instanceId: instanceRow.value.id,
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
      instanceRow.value = undefined;
      readonly.value = false;
      return;
    }
    const data = modalApi.getData<{
      row: ActivityInstanceApi.EnrollableInstance;
      readonly?: boolean;
    }>();
    if (!data?.row?.id) {
      return;
    }
    instanceRow.value = data.row;
    readonly.value = !!data.readonly;
    formApi.updateSchema(useStudentFeedbackFormSchema(readonly.value));

    const feedback = await getMyStudentFeedback(data.row.id);
    formApi.setValues({
      satisfaction: feedback?.satisfaction,
      harvest: feedback?.harvest ?? '',
      content: feedback?.content ?? '',
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
    :confirm-text="readonly ? '关闭' : '确认'"
  >
    <Form />
  </Modal>
</template>

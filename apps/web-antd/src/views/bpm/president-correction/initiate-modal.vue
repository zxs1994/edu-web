<script lang="ts" setup>
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { initiatePresidentCorrection } from '#/api/oa/president-correction';

import { useInitiateFormSchema } from './data';

const emit = defineEmits<{ success: [] }>();

const processName = ref('');

const [Form, formApi] = useVbenForm({
  schema: useInitiateFormSchema(),
  showDefaultActions: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[600px]',
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const row = modalApi.getData<BpmProcessInstanceApi.ProcessInstance>();
      processName.value = row?.name || '';
      await formApi.resetForm();
      await formApi.setValues({ correctionType: 1 });
    }
  },
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const row = modalApi.getData<BpmProcessInstanceApi.ProcessInstance>();
    if (!row?.businessKey) {
      message.error('无法识别原单据信息');
      return;
    }
    const values = await formApi.getValues();
    const processDefKey =
      row.processDefinition?.key || (row as any).processDefinitionKey || '';
    if (!processDefKey) {
      message.error('无法识别单据类型');
      return;
    }
    modalApi.lock();
    try {
      await initiatePresidentCorrection({
        sourceBillType: processDefKey,
        sourceBillId: Number(row.businessKey),
        correctionType: values.correctionType,
        correctionReason: values.correctionReason,
        councilDecision: values.correctionType === 2 ? 1 : 0,
        correctionResult: values.correctionResult,
      });
      message.success('纠错已发起');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="`发起异议纠错 - ${processName}`">
    <Form />
  </Modal>
</template>

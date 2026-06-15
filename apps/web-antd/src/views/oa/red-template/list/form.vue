<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { createRedTemplate, updateRedTemplate } from '#/api/oa/red-template';

import { useFormSchema } from './data';

const emit = defineEmits(['success']);
const formData = ref<Record<string, any>>({});
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const isEdit = computed(() => !!formData.value?.id);
const title = computed(() => (isEdit.value ? '编辑套红模板' : '新增套红模板'));

const [Modal, modalApi] = useVbenModal({
  class: 'w-[1200px]',
  async onConfirm() {
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;
      modalApi.lock();
      const values = await formApi.getValues();
      if (isEdit.value) {
        await updateRedTemplate({ ...formData.value, ...values });
      } else {
        await createRedTemplate(values);
      }
      message.success('操作成功');
      await modalApi.close();
      emit('success');
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      formData.value = data || {};
      if (data?.id) {
        await formApi.setValues(data);
      } else {
        await formApi.resetForm();
      }
    }
  },
});
</script>

<template>
  <Modal :title="title">
    <Form class="mx-4" />
  </Modal>
</template>

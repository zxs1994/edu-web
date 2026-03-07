<script lang="ts" setup>
import type { SystemScheduleApi } from '#/api/system/schedule';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createSchedule,
  getSchedule,
  pushSchedule,
  updateSchedule,
} from '#/api/system/schedule';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemScheduleApi.Schedule>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['日程'])
    : $t('ui.actionTitle.create', ['日程']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 保存日程 */
async function handleSave(needPush = false) {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  modalApi.lock();
  const formValues = await formApi.getValues();
  const data: any = { ...formValues };
  // 清理前端专用字段
  delete data.receivers;
  delete data.receiverNames;
  if (!data.pendingReceiverIds) {
    data.pendingReceiverIds = [];
  }
  try {
    let scheduleId: number;
    if (formData.value?.id) {
      await updateSchedule(data);
      scheduleId = data.id!;
    } else {
      scheduleId = await createSchedule(data);
    }
    if (needPush) {
      if (data.pendingReceiverIds.length === 0) {
        message.warning('请选择待推送接收人');
        modalApi.unlock();
        return;
      }
      await pushSchedule({
        scheduleId,
        receiverIds: data.pendingReceiverIds,
      });
      message.success('保存并推送成功');
    } else {
      message.success($t('ui.actionMessage.operationSuccess'));
    }
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    // 普通确认：只保存，不推送
    await handleSave(false);
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemScheduleApi.Schedule>();
    if (!data || !data.id) {
      // 新增场景：如果有默认数据，设置到表单
      if (data && Object.keys(data).length > 0) {
        await formApi.setValues(data);
      }
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSchedule(data.id);
      const formValues: any = { ...formData.value };
      // 待推送接收人（从后端 pendingReceiverIds 直接回填）
      if (!formValues.pendingReceiverIds) {
        formValues.pendingReceiverIds = [];
      }
      // 已接收人（只读展示姓名）
      formValues.receiverNames =
        formValues.receivers && formValues.receivers.length > 0
          ? formValues.receivers
              .map((r: SystemScheduleApi.Receiver) => r.receiverName)
              .join('、')
          : '';
      delete formValues.receivers;
      await formApi.setValues(formValues);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-4" />
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="modalApi.close()">取消</Button>
        <Button type="primary" @click="handleSave(false)">确认</Button>
        <Button type="primary" @click="handleSave(true)">确认并立即推送</Button>
      </div>
    </template>
  </Modal>
</template>

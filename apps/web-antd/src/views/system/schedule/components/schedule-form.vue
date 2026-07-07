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

/** 从待推送列表中排除已接收人 */
function filterPendingReceiverIds(
  pendingReceiverIds: number[] = [],
  receivedReceiverIds: number[] = [],
) {
  const receivedSet = new Set(receivedReceiverIds);
  return pendingReceiverIds.filter((id) => !receivedSet.has(id));
}

/** 保存日程 */
async function handleSave(needPush = false) {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  const formValues = await formApi.getValues();
  const data: any = { ...formValues };
  const receivedReceiverIds: number[] = data.receivedReceiverIds || [];
  const receiverIds = filterPendingReceiverIds(
    data.pendingReceiverIds,
    receivedReceiverIds,
  );
  delete data.pendingReceiverIds;
  delete data.receivedReceiverIds;
  delete data.receivers;
  delete data.receiverNames;
  data.receiverIds = receiverIds;

  if (needPush && receiverIds.length === 0) {
    message.warning('请选择待推送接收人');
    return;
  }

  modalApi.lock();
  try {
    let scheduleId: number;
    if (formData.value?.id) {
      await updateSchedule(data);
      scheduleId = data.id!;
    } else {
      scheduleId = await createSchedule(data);
    }
    if (needPush) {
      await pushSchedule({
        scheduleId,
        receiverIds,
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
      if (formValues.isPushed) {
        // 已推送：库中接收人视为已接收，待推送仅保留新增人选
        formValues.receivedReceiverIds =
          formValues.receivers?.map(
            (r: SystemScheduleApi.Receiver) => r.receiverId,
          ) || [];
        formValues.pendingReceiverIds = filterPendingReceiverIds(
          formValues.pendingReceiverIds,
          formValues.receivedReceiverIds,
        );
        formValues.receiverNames =
          formValues.receivers && formValues.receivers.length > 0
            ? formValues.receivers
                .map((r: SystemScheduleApi.Receiver) => r.receiverName)
                .join('、')
            : '';
      } else {
        // 未推送：库中接收人仍属于待推送
        formValues.receivedReceiverIds = [];
        if (
          !formValues.pendingReceiverIds?.length &&
          formValues.receivers?.length
        ) {
          formValues.pendingReceiverIds = formValues.receivers.map(
            (r: SystemScheduleApi.Receiver) => r.receiverId,
          );
        }
        formValues.receiverNames = '';
      }
      if (!formValues.pendingReceiverIds) {
        formValues.pendingReceiverIds = [];
      }
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

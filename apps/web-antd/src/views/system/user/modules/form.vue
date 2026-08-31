<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';
import type { SystemUserApi } from '#/api/system/user';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getSimpleRoleList } from '#/api/system/role';
import { createUser, getUser, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { isFixedIdentityUser, useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemUserApi.User>();
const roleList = ref<SystemRoleApi.Role[]>([]);

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['用户'])
    : $t('ui.actionTitle.create', ['用户']);
});

function refreshSchema() {
  formApi.updateSchema(
    useFormSchema({
      isFixedIdentity: isFixedIdentityUser(
        formData.value?.roleIds,
        roleList.value,
      ),
    }),
  );
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as SystemUserApi.User;
    try {
      await (formData.value?.id ? updateUser(data) : createUser(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    refreshSchema();
    // 加载数据
    const data = modalApi.getData<SystemUserApi.User>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getUser(data.id);
      // 设置到 values（排除 roleIds，避免多余字段进入表单）
      const { roleIds: _roleIds, ...userValues } = formData.value;
      await formApi.setValues(userValues);
      refreshSchema();
    } finally {
      modalApi.unlock();
    }
  },
});

onMounted(async () => {
  roleList.value = await getSimpleRoleList();
  refreshSchema();
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>

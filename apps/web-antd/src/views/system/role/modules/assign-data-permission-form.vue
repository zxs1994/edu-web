<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';

import { SystemDataScopeEnum } from '@vben/constants';
import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { assignRoleDataScope } from '#/api/system/permission';
import { getRole } from '#/api/system/role';
import { $t } from '#/locales';

import { useAssignDataPermissionFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useAssignDataPermissionFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = await formApi.getValues();
    try {
      await assignRoleDataScope({
        roleId: data.id,
        dataScope: SystemDataScopeEnum.ALL,
        dataScopeDeptIds: undefined,
      });
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<SystemRoleApi.Role>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      const role = await getRole(data.id);
      await formApi.setValues({
        ...role,
        // 历史角色若曾配置其他范围，打开时统一展示为全部
        dataScope: SystemDataScopeEnum.ALL,
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="数据权限" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>

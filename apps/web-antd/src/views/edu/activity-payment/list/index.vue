<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ActivityPaymentApi } from '#/api/edu/activity-payment';

import { onActivated } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatusEditValue } from '@vben/constants';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteActivityPayment,
  getActivityPaymentPage,
} from '#/api/edu/activity-payment';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'EduActivityPaymentList' });

const router = useRouter();

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  router.push({
    path: '/edu/activity/payment/info',
    query: { t: Date.now() },
  });
}

function handleEdit(row: ActivityPaymentApi.PaymentRequest) {
  router.push({
    path: '/edu/activity/payment/info',
    query: {
      id: row.id,
      t: Date.now(),
    },
  });
}

async function handleDelete(row: ActivityPaymentApi.PaymentRequest) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.title || row.billCode]),
    key: 'action_key_msg',
  });
  try {
    await deleteActivityPayment(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [
        row.title || row.billCode,
      ]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    wrapperClass: 'grid-cols-4',
    collapsed: true,
  },
  gridOptions: {
    id: 'edu-activity-payment-list',
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          getActivityPaymentPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: {
      refresh: true,
      refreshOptions: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<ActivityPaymentApi.PaymentRequest>,
});

onActivated(() => {
  onRefresh();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create'),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['edu:activity-payment:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['edu:activity-payment:update'],
              ifShow: BpmProcessInstanceStatusEditValue.includes(
                row.processStatus as number,
              ),
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['edu:activity-payment:delete'],
              ifShow: row.processStatus === -1,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  row.title || row.billCode,
                ]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

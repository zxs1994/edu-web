<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ActivityApi } from '#/api/edu/activity';

import { onActivated } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatus, BpmProcessInstanceStatusEditValue } from '@vben/constants';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteActivity, getActivityPage } from '#/api/edu/activity';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'EduActivityList' });

const router = useRouter();

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  router.push({
    path: '/edu/activity/info',
    query: {
      t: Date.now(),
    },
  });
}

function handleEdit(row: ActivityApi.Activity) {
  router.push({
    path: '/edu/activity/info',
    query: {
      id: row.id,
      t: Date.now(),
    },
  });
}

async function handleDelete(row: ActivityApi.Activity) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name || row.billCode]),
    key: 'action_key_msg',
  });
  try {
    await deleteActivity(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name || row.billCode]),
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
    id: 'edu-activity-list',
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getActivityPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      refreshOptions: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<ActivityApi.Activity>,
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
              auth: ['edu:activity:create'],
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
              ifShow: () =>
                row.processStatus != null &&
                BpmProcessInstanceStatusEditValue.includes(row.processStatus),
              auth: ['edu:activity:query'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              ifShow: () =>
                row.processStatus === BpmProcessInstanceStatus.NOT_START,
              auth: ['edu:activity:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  row.name || row.billCode,
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

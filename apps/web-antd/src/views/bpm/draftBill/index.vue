<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmDraftBillApi } from '#/api/bpm/draftBill';

import { onActivated } from 'vue';

import { Page } from '@vben/common-ui';

import { message, Modal } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMyDraftBillPage } from '#/api/bpm/draftBill';
import { router } from '#/router';
import {
  deleteDraftBill,
  getDraftBillInfoRoute,
} from '#/utils/bpm-draft-bill';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'BpmDraftBill' });

function handleDetail(row: BpmDraftBillApi.DraftBill) {
  const route = getDraftBillInfoRoute(row);
  if (!route) {
    message.warning('未配置该单据类型的编辑页面');
    return;
  }
  router.push(route);
}

function handleDelete(row: BpmDraftBillApi.DraftBill) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除草稿「${row.billCode || row.billId}」吗？删除后不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await deleteDraftBill(row.processDefinitionKey, row.billId);
      message.success('删除成功');
      gridApi.query();
    },
  });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    wrapperClass: 'grid-cols-4',
    collapsed: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMyDraftBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'billId',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<BpmDraftBillApi.DraftBill>,
});

onActivated(() => {
  gridApi.query();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #slot-bill-code="{ row }">
        <a
          v-if="row.billCode"
          class="text-primary"
          @click="handleDetail(row)"
        >
          {{ row.billCode }}
        </a>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['bpm:draft-bill:query'],
              onClick: () => handleDetail(row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['bpm:draft-bill:query'],
              onClick: () => handleDelete(row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IncomingDocumentBillApi } from '#/api/oa/incoming';

import { onActivated } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import {
  ACTION_ICON,
  TableAction,
  useVbenVxeGrid,
} from '#/adapter/vxe-table';
import {
  deleteIncomingDocumentBill,
  exportIncomingDocumentBill,
  getIncomingDocumentBillPage,
} from '#/api/oa/incoming';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();
defineOptions({ name: 'OaIncomingDocumentBillList' });

function onRefresh() {
  gridApi.query();
}

/* function handleCreate() {
  router.push({
    path: '/oa/document/incoming-document-info',
    query: { t: Date.now() },
  });
} */

function handleDetail(row: IncomingDocumentBillApi.IncomingDocumentBill) {
  const route = getOaDetailRoute(row, '/oa/document/incoming-document-info');
  router.push(route);
}

async function handleDelete(
  row: IncomingDocumentBillApi.IncomingDocumentBill,
) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteIncomingDocumentBill(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

async function handleExport() {
  const data = await exportIncomingDocumentBill(
    await gridApi.formApi.getValues(),
  );
  downloadFileFromBlobPart({ fileName: '公文收文.xls', source: data });
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
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getIncomingDocumentBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: { code: 'query' }, search: true },
  } as VxeTableGridOptions<IncomingDocumentBillApi.IncomingDocumentBill>,
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
            /* {
              label: $t('ui.actionTitle.create'),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:incoming-document-bill:create'],
              onClick: handleCreate,
            }, */
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:incoming-document-bill:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: () => handleDetail(row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

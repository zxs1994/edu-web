<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DocumentDispatchBillApi } from '#/api/oa/document';

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
  deleteDocumentDispatchBill,
  exportDocumentDispatchBill,
  getDocumentDispatchBillPage,
} from '#/api/oa/document';
import { getSimpleDeptList } from '#/api/system/dept';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { cachedDeptList, useGridColumns, useGridFormSchema } from './data';

const router = useRouter();
defineOptions({ name: 'OaDocumentDispatchBillList' });

function onRefresh() {
  gridApi.query();
}

/* function handleCreate() {
  router.push({
    path: '/oa/document/document-dispatch-info',
    query: { t: Date.now() },
  });
} */

function handleDetail(row: DocumentDispatchBillApi.DocumentDispatchBill) {
  const route = getOaDetailRoute(row, '/oa/document/document-dispatch-info');
  router.push(route);
}

async function handleDelete(row: DocumentDispatchBillApi.DocumentDispatchBill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteDocumentDispatchBill(row.id as number);
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
  const data = await exportDocumentDispatchBill(
    await gridApi.formApi.getValues(),
  );
  downloadFileFromBlobPart({ fileName: '公文发文.xls', source: data });
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
          return await getDocumentDispatchBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: { code: 'query' }, search: true },
  } as VxeTableGridOptions<DocumentDispatchBillApi.DocumentDispatchBill>,
});

onActivated(async () => {
  // 首次进入时加载部门列表，用于主送部门 ID→名称映射
  if (cachedDeptList.length === 0) {
    try {
      const data = await getSimpleDeptList();
      cachedDeptList.push(...((data as Array<{ id: number; name: string }>) || []));
    } catch {
      // 静默失败
    }
  }
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
              label: '新增公文发文',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:document-dispatch-bill:create'],
              onClick: handleCreate,
            }, */
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:document-dispatch-bill:export'],
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
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

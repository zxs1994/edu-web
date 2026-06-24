<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ProjectInitiationBillApi } from '#/api/oa/project';

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
  deleteProjectInitiationBill,
  exportProjectInitiationBill,
  getProjectInitiationBillPage,
} from '#/api/oa/project';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();
defineOptions({ name: 'OaProjectInitiationBillList' });

function onRefresh() {
  gridApi.query();
}

/* function handleCreate() {
  router.push({
    path: '/oa/contract/project-initiation-info',
    query: { t: Date.now() },
  });
} */

/* function handleEdit(row: ProjectInitiationBillApi.ProjectInitiationBill) {
  router.push({
    path: '/oa/contract/project-initiation-info',
    query: { id: row.id },
  });
} */

function handleDetail(row: ProjectInitiationBillApi.ProjectInitiationBill) {
  const route = getOaDetailRoute(row, '/oa/contract/project-initiation-info');
  router.push(route);
}

async function handleDelete(
  row: ProjectInitiationBillApi.ProjectInitiationBill,
) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.billCode]),
    key: 'action_key_msg',
  });
  try {
    await deleteProjectInitiationBill(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.billCode]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

async function handleExport() {
  const data = await exportProjectInitiationBill(
    await gridApi.formApi.getValues(),
  );
  downloadFileFromBlobPart({ fileName: '立项管理.xls', source: data });
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
          return await getProjectInitiationBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: { code: 'query' }, search: true },
  } as VxeTableGridOptions<ProjectInitiationBillApi.ProjectInitiationBill>,
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
              auth: ['oa:project-initiation-bill:create'],
              onClick: handleCreate,
            }, */
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:project-initiation-bill:export'],
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
            /* {
              label: $t('common.edit'),
              type: 'link',
              ifShow: () =>
                BpmProcessInstanceStatusEditValue.includes(
                  row.processStatus as number,
                ),
              auth: ['oa:project-initiation-bill:update'],
              onClick: handleEdit.bind(null, row),
            }, */
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

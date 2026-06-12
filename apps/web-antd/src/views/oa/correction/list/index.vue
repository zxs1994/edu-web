<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CorrectionBillApi } from '#/api/oa/correction';

import { onActivated } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import {
  ACTION_ICON,
  TableAction,
  useVbenVxeGrid,
} from '#/adapter/vxe-table';
import {
  exportCorrectionBill,
  freezeCorrectionBill,
  getCorrectionBillPage,
  unfreezeCorrectionBill,
} from '#/api/oa/correction';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

const userStore = useUserStore();
const router = useRouter();
defineOptions({ name: 'OaCorrectionBillList' });

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  router.push({
    path: '/oa/correction/correction-info',
    query: { t: Date.now() },
  });
}

async function handleFreeze(row: CorrectionBillApi.CorrectionBill) {
  const hideLoading = message.loading({
    content: '正在冻结...',
    key: 'action_key_msg',
  });
  try {
    await freezeCorrectionBill(row.id as number);
    message.success({ content: '冻结成功', key: 'action_key_msg' });
    onRefresh();
  } finally {
    hideLoading();
  }
}

async function handleUnfreeze(row: CorrectionBillApi.CorrectionBill) {
  const hideLoading = message.loading({
    content: '正在解冻...',
    key: 'action_key_msg',
  });
  try {
    await unfreezeCorrectionBill(row.id as number);
    message.success({ content: '解冻成功', key: 'action_key_msg' });
    onRefresh();
  } finally {
    hideLoading();
  }
}

async function handleExport() {
  const data = await exportCorrectionBill(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '纠错管理.xls', source: data });
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
          return await getCorrectionBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            creator: userStore.userInfo?.id,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: { code: 'query' }, search: true },
  } as VxeTableGridOptions<CorrectionBillApi.CorrectionBill>,
});

onActivated(() => {
  onRefresh();
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="纠错管理列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create'),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:correction-bill:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:correction-bill:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '冻结',
              type: 'link',
              ifShow: () => row.freezeStatus !== 1,
              auth: ['oa:correction-bill:update'],
              popConfirm: {
                title: `确认冻结该纠错单据？`,
                confirm: handleFreeze.bind(null, row),
              },
            },
            {
              label: '解冻',
              type: 'link',
              ifShow: () => row.freezeStatus === 1,
              auth: ['oa:correction-bill:update'],
              popConfirm: {
                title: `确认解冻该纠错单据？`,
                confirm: handleUnfreeze.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

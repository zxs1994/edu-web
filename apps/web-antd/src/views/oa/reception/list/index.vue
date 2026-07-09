<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ReceptionApplyBillApi } from '#/api/oa/reception';

import { onActivated } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
// import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteReceptionApplyBill,
  // exportReceptionApplyBill,
  getReceptionApplyBillPage,
} from '#/api/oa/reception';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();
defineOptions({ name: 'OaReceptionApplyBillList' });

const INFO_PATH = '/oa/reception/reception-apply-info';

function onRefresh() {
  gridApi.query();
}

async function handleDelete(row: ReceptionApplyBillApi.ReceptionApplyBill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteReceptionApplyBill(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

// 导出功能暂时不用
// async function handleExport() {
//   const data = await exportReceptionApplyBill(await gridApi.formApi.getValues());
//   downloadFileFromBlobPart({ fileName: '接待申请单.xls', source: data });
// }

function handleDetail(row: ReceptionApplyBillApi.ReceptionApplyBill) {
  router.push(getOaDetailRoute(row, INFO_PATH));
}

// 新增功能暂时不用
// function handleCreate() {
//   router.push({
//     path: INFO_PATH,
//     query: {
//       from: 'startProcess',
//       processDefinitionKey: 'oa_reception_apply_bill',
//       t: String(Date.now()),
//     },
//   });
// }

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
          return await getReceptionApplyBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<ReceptionApplyBillApi.ReceptionApplyBill>,
});

onActivated(() => {
  onRefresh();
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="接待申请单">
      <!-- 新增、导出功能暂时不用
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['接待申请单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:reception-apply-bill:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:reception-apply-bill:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      -->
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['oa:reception-apply-bill:query'],
              onClick: () => handleDetail(row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:reception-apply-bill:delete'],
              ifShow:
                row.processStatus === BpmProcessInstanceStatus.NOT_START
                || row.processStatus === 0,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.billCode]),
                confirm: () => handleDelete(row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

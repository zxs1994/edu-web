<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TravelApplyBillApi } from '#/api/oa/travel';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatusEditValue } from '@vben/constants';
import { useUserStore } from '@vben/stores';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import {
  ACTION_ICON,
  TableAction,
  useVbenVxeGrid,
} from '#/adapter/vxe-table';
import {
  deleteTravelApplyBill,
  deleteTravelApplyBillList,
  exportTravelApplyBill,
  getTravelApplyBillPage,
} from '#/api/oa/travel';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

const userStore = useUserStore();
const router = useRouter();
defineOptions({ name: 'OaTravelApplyBillList' });

function onRefresh() {
  gridApi.query();
}

/* function handleCreate() {
  router.push({
    path: '/oa/expense-travel/travel-apply-info',
    query: { t: Date.now() },
  });
} */

function handleDetail(row: TravelApplyBillApi.TravelApplyBill) {
  router.push({
    path: '/oa/expense-travel/travel-apply-info',
    query: { id: row.id },
  });
}

async function handleDelete(row: TravelApplyBillApi.TravelApplyBill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteTravelApplyBill(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

const checkedIds = ref<number[]>([]);

function handleRowCheckboxChange({
  records,
}: {
  records: TravelApplyBillApi.TravelApplyBill[];
}) {
  checkedIds.value = records
    .map((item) => item.id!)
    .filter((id): id is number => id !== undefined);
}

async function handleDeleteBatch() {
  const checkedRecords = gridApi.grid.getCheckboxRecords();
  const notAllowed = checkedRecords.filter(
    (r: TravelApplyBillApi.TravelApplyBill) =>
      !BpmProcessInstanceStatusEditValue.includes(r.processStatus as number),
  );
  if (notAllowed.length > 0) {
    message.warning(
      `以下单据不允许删除：${notAllowed.map((r: any) => r.billCode || r.id).join(', ')}`,
    );
    return;
  }
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    key: 'action_key_msg',
  });
  try {
    await deleteTravelApplyBillList(checkedIds.value);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess'),
      key: 'action_key_msg',
    });
    onRefresh();
    checkedIds.value = [];
  } finally {
    hideLoading();
  }
}

async function handleExport() {
  const data = await exportTravelApplyBill(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '差旅申请.xls', source: data });
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
          return await getTravelApplyBillPage({
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
  } as VxeTableGridOptions<TravelApplyBillApi.TravelApplyBill>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
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
              auth: ['oa:travel-apply-bill:create'],
              onClick: handleCreate,
            }, */
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:travel-apply-bill:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['oa:travel-apply-bill:delete'],
              onClick: handleDeleteBatch,
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
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              ifShow: () =>
                BpmProcessInstanceStatusEditValue.includes(
                  row.processStatus as number,
                ),
              auth: ['oa:travel-apply-bill:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.billCode]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              ifShow: () =>
                !BpmProcessInstanceStatusEditValue.includes(
                  row.processStatus as number,
                ),
              disabled: true,
              auth: ['oa:travel-apply-bill:delete'],
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

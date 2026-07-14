<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TravelApplyBillApi } from '#/api/oa/travel';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';
import { message } from 'ant-design-vue';

import {
  ACTION_ICON,
  TableAction,
  useVbenVxeGrid,
} from '#/adapter/vxe-table';
import {
  deleteTravelApplyBill,
  exportTravelApplyBillDetail,
  getTravelApplyBillPage,
} from '#/api/oa/travel';
import { $t } from '#/locales';
import { getTravelDetailRoute } from '#/utils/oa-route-resolver';

import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();
defineOptions({ name: 'OaTravelApplyBillList' });

function onRefresh() {
  gridApi.query();
}

const checkedRows = ref<TravelApplyBillApi.TravelApplyBill[]>([]);

function resolveTravelBillType(row: TravelApplyBillApi.TravelApplyBill) {
  return row.travelType === 2 ? '113' : '109';
}

function handleDetail(row: TravelApplyBillApi.TravelApplyBill) {
  router.push(getTravelDetailRoute(row));
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

async function handleExportSelectedDetail() {
  const exportableRows = checkedRows.value.filter(
    (row) => row.processStatus === BpmProcessInstanceStatus.APPROVE,
  );
  if (exportableRows.length === 0) {
    message.warning('仅支持导出审批通过的单据，请先勾选符合条件的单据');
    return;
  }
  const hideLoading = message.loading(`正在导出 ${exportableRows.length} 份单据...`, 0);
  let successCount = 0;
  try {
    for (const row of exportableRows) {
      if (!row.id) {
        continue;
      }
      try {
        const data = await exportTravelApplyBillDetail({
          billType: resolveTravelBillType(row),
          id: Number(row.id),
        });
        const prefix = row.travelType === 2 ? '出境出差申请单' : '出差申请单';
        const fileName = `${prefix}-${row.billCode || row.id}.xlsx`;
        downloadFileFromBlobPart({ fileName, source: data });
        successCount++;
      } catch (error: any) {
        message.error(`导出失败：${row.billCode || row.id}，${error?.message || '请稍后重试'}`);
      }
    }
    if (successCount > 0) {
      message.success(`导出完成，成功 ${successCount} 份`);
    }
  } finally {
    hideLoading();
  }
}

function handleRowCheckboxChange() {
  checkedRows.value = gridApi.grid.getCheckboxRecords() as TravelApplyBillApi.TravelApplyBill[];
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
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    checkboxConfig: {
      highlight: true,
      checkMethod: ({ row }: { row: TravelApplyBillApi.TravelApplyBill }) =>
        row.processStatus === BpmProcessInstanceStatus.APPROVE,
    },
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
            {
              label: '导出选中单据',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:travel-apply-bill:export'],
              disabled: checkedRows.length === 0,
              onClick: handleExportSelectedDetail,
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

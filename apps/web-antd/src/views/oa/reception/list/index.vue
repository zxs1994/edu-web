<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ReceptionApplyBillApi } from '#/api/oa/reception';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';
import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteReceptionApplyBill,
  exportReceptionApplyBillDetail,
  getReceptionApplyBillPage,
} from '#/api/oa/reception';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();
defineOptions({ name: 'OaReceptionApplyBillList' });

const INFO_PATH = '/oa/reception/reception-apply-info';
const BILL_TYPE = '115';

function onRefresh() {
  gridApi.query();
}

const checkedRows = ref<ReceptionApplyBillApi.ReceptionApplyBill[]>([]);

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
        const data = await exportReceptionApplyBillDetail({
          billType: BILL_TYPE,
          id: Number(row.id),
        });
        const fileName = `接待申请单-${row.billCode || row.id}.xlsx`;
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
  checkedRows.value = gridApi.grid.getCheckboxRecords() as ReceptionApplyBillApi.ReceptionApplyBill[];
}

function handleDetail(row: ReceptionApplyBillApi.ReceptionApplyBill) {
  router.push(getOaDetailRoute(row, INFO_PATH));
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
          return await getReceptionApplyBillPage({
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
      checkMethod: ({ row }: { row: ReceptionApplyBillApi.ReceptionApplyBill }) =>
        row.processStatus === BpmProcessInstanceStatus.APPROVE,
    },
    toolbarConfig: { refresh: { code: 'query' }, search: true },
  } as VxeTableGridOptions<ReceptionApplyBillApi.ReceptionApplyBill>,
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
    <Grid table-title="接待申请单">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '导出选中单据',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:reception-apply-bill:export'],
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

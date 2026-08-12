<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ExpensePaymentBillApi } from '#/api/oa/expense-payment';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteExpensePaymentBill,
  // exportExpensePaymentBill,
  exportExpensePaymentBillDetail,
  getExpensePaymentBillPage,
} from '#/api/oa/expense-payment';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'OaExpensePaymentBillList' });

const router = useRouter();
const INFO_PATH = '/oa/expense-travel/expense-payment-info';
const BILL_TYPE = '108';

function onRefresh() {
  gridApi.query();
}

const checkedRows = ref<ExpensePaymentBillApi.ExpensePaymentBill[]>([]);

async function handleDelete(row: ExpensePaymentBillApi.ExpensePaymentBill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteExpensePaymentBill(row.id as number);
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
//   const data = await exportExpensePaymentBill(await gridApi.formApi.getValues());
//   downloadFileFromBlobPart({ fileName: '费用支出申请.xls', source: data });
// }

function parseDownloadFileName(disposition?: string) {
  if (!disposition) {
    return undefined;
  }
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ? decodeURIComponent(plainMatch[1]) : undefined;
}

async function handleExportSelectedDetail() {
  const exportableRows = checkedRows.value.filter(
    (row) => row.processStatus === BpmProcessInstanceStatus.APPROVE,
  );
  if (exportableRows.length === 0) {
    message.warning('仅支持导出审批通过的单据，请先勾选符合条件的单据');
    return;
  }
  const hideLoading = message.loading(
    `正在导出 ${exportableRows.length} 份单据...`,
    0,
  );
  let successCount = 0;
  try {
    for (const row of exportableRows) {
      if (!row.id) {
        continue;
      }
      try {
        const response: any = await exportExpensePaymentBillDetail(
          {
            billType: BILL_TYPE,
            id: Number(row.id),
          },
          { responseReturn: 'raw' },
        );
        const fileName =
          parseDownloadFileName(response?.headers?.['content-disposition']) ||
          `费用支出申请单-${row.billCode || row.id}.xlsx`;
        downloadFileFromBlobPart({ fileName, source: response.data });
        successCount++;
      } catch (error: any) {
        message.error(
          `导出失败：${row.billCode || row.id}，${error?.message || '请稍后重试'}`,
        );
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
  checkedRows.value =
    gridApi.grid.getCheckboxRecords() as ExpensePaymentBillApi.ExpensePaymentBill[];
}

function handleDetail(row: ExpensePaymentBillApi.ExpensePaymentBill) {
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
          return await getExpensePaymentBillPage({
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
      checkMethod: ({
        row,
      }: {
        row: ExpensePaymentBillApi.ExpensePaymentBill;
      }) => row.processStatus === BpmProcessInstanceStatus.APPROVE,
    },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<ExpensePaymentBillApi.ExpensePaymentBill>,
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
    <Grid table-title="费用支出申请">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '导出选中单据',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:expense-payment-bill:export'],
              disabled: checkedRows.length === 0,
              onClick: handleExportSelectedDetail,
            },
          ]"
        />
      </template>
      <!-- 导出功能暂时不用
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.export'),
              type: 'default',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:expense-payment-bill:export'],
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
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['oa:expense-payment-bill:query'],
              onClick: () => handleDetail(row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:expense-payment-bill:delete'],
              ifShow: row.processStatus === BpmProcessInstanceStatus.NOT_START,
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

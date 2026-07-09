<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ExpenseReimburseBillApi } from '#/api/oa/expense';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
} from '@vben/constants';
import { message } from 'ant-design-vue';

import {
  ACTION_ICON,
  TableAction,
  useVbenVxeGrid,
} from '#/adapter/vxe-table';
import {
  getExpenseReimburseBillPage,
  updateExpenseReimburseBill,
} from '#/api/oa/expense';
import { $t } from '#/locales';
import { getExpenseDetailRoute } from '#/utils/oa-route-resolver';

import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();
defineOptions({ name: 'OaExpenseReimburseBillList' });

function onRefresh() {
  gridApi.query();
}

const checkedRows = ref<ExpenseReimburseBillApi.ExpenseReimburseBill[]>([]);

/* function handleCreate(billType: number) {
  const path = billType === 1
    ? '/oa/expense-travel/daily-expense-info'
    : '/oa/expense-travel/expense-reimburse-info';
  router.push({
    path,
    query: { t: Date.now() },
  });
} */

async function handleExport() {
  const data = await exportExpenseReimburseBill(
    await gridApi.formApi.getValues(),
  );
  downloadFileFromBlobPart({ fileName: '报销单.xls', source: data });
}

async function handleExportSelectedDetail() {
  if (checkedRows.value.length === 0) {
    message.warning('请先勾选要导出的单据');
    return;
  }
  const hideLoading = message.loading(`正在导出 ${checkedRows.value.length} 份单据...`, 0);
  let successCount = 0;
  try {
    for (const row of checkedRows.value) {
      if (!row.id) {
        continue;
      }
      try {
        const data = await exportExpenseBillDetail({
          billType: '107',
          id: Number(row.id),
        });
        const fileName = `差旅报销单-${row.billCode || row.id}.xlsx`;
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
  checkedRows.value = gridApi.grid.getCheckboxRecords() as ExpenseReimburseBillApi.ExpenseReimburseBill[];
}

function handleDetail(row: ExpenseReimburseBillApi.ExpenseReimburseBill) {
  router.push(getExpenseDetailRoute(row));
}

async function handleMarkPaid(row: ExpenseReimburseBillApi.ExpenseReimburseBill) {
  const hideLoading = message.loading({
    content: '正在更新支付状态...',
    key: 'action_key_msg',
  });
  try {
    await updateExpenseReimburseBill({
      id: row.id,
      billCode: row.billCode,
      totalAmount: row.totalAmount,
      paymentStatus: 1,
      companyId: row.companyId,
      companyName: row.companyName,
      deptId: row.deptId,
      deptName: row.deptName,
    });
    message.success({
      content: '已标记为已支付',
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
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
          return await getExpenseReimburseBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    checkboxConfig: { highlight: true },
    toolbarConfig: { refresh: { code: 'query' }, search: true },
  } as VxeTableGridOptions<ExpenseReimburseBillApi.ExpenseReimburseBill>,
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
              label: '新增差旅报销',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:expense-reimburse-bill:create'],
              onClick: () => handleCreate(2),
            },
            {
              label: '新增日常报销',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:expense-reimburse-bill:create'],
              onClick: () => handleCreate(1),
            }, */
            /* {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:expense-reimburse-bill:export'],
              onClick: handleExport,
            },
            {
              label: '导出选中单据',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:expense-reimburse-bill:export'],
              disabled: checkedRows.length === 0,
              onClick: handleExportSelectedDetail,
            }, */
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
            {
              label: '已支付',
              type: 'link',
              ifShow: () =>
                row.paymentStatus !== 1 &&
                row.processStatus === BpmProcessInstanceStatus.APPROVE,
              popConfirm: {
                title: `确认将 ${row.billCode} 标记为已支付？`,
                confirm: handleMarkPaid.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

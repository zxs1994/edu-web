<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ExpenseReimburseBillApi } from '#/api/oa/expense';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
} from '@vben/constants';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import {
  ACTION_ICON,
  TableAction,
  useVbenVxeGrid,
} from '#/adapter/vxe-table';
import {
  deleteExpenseReimburseBill,
  deleteExpenseReimburseBillList,
  exportExpenseReimburseBill,
  getExpenseReimburseBillPage,
  updateExpenseReimburseBill,
} from '#/api/oa/expense';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();
defineOptions({ name: 'OaExpenseReimburseBillList' });

function onRefresh() {
  gridApi.query();
}

/* function handleCreate(billType: number) {
  const path = billType === 1
    ? '/oa/expense-travel/daily-expense-info'
    : '/oa/expense-travel/expense-reimburse-info';
  router.push({
    path,
    query: { t: Date.now() },
  });
} */

async function handleDelete(
  row: ExpenseReimburseBillApi.ExpenseReimburseBill,
) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteExpenseReimburseBill(row.id as number);
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
  records: ExpenseReimburseBillApi.ExpenseReimburseBill[];
}) {
  checkedIds.value = records
    .map((item) => item.id!)
    .filter((id): id is number => id !== undefined);
}

async function handleDeleteBatch() {
  const checkedRecords = gridApi.grid.getCheckboxRecords();
  const notAllowed = checkedRecords.filter(
    (r: ExpenseReimburseBillApi.ExpenseReimburseBill) =>
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
    await deleteExpenseReimburseBillList(checkedIds.value);
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
  const data = await exportExpenseReimburseBill(
    await gridApi.formApi.getValues(),
  );
  downloadFileFromBlobPart({ fileName: '报销单.xls', source: data });
}

function handleDetail(row: ExpenseReimburseBillApi.ExpenseReimburseBill) {
  const oaInfoPath = row.billType === 1
    ? '/oa/expense-travel/daily-expense-info'
    : '/oa/expense-travel/expense-reimburse-info';
  const route = getOaDetailRoute(row, oaInfoPath);
  router.push(route);
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
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:expense-reimburse-bill:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['oa:expense-reimburse-bill:delete'],
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
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              ifShow: () =>
                BpmProcessInstanceStatusEditValue.includes(
                  row.processStatus as number,
                ),
              auth: ['oa:expense-reimburse-bill:delete'],
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
              auth: ['oa:expense-reimburse-bill:delete'],
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

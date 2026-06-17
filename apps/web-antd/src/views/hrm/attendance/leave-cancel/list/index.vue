<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { LeaveCancelBillApi } from '#/api/hrm/leave-cancel';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatusEditValue } from '@vben/constants';
import { useUserStore } from '@vben/stores';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteLeaveCancelBill,
  deleteLeaveCancelBillList,
  exportLeaveCancelBill,
  getLeaveCancelBillPage,
} from '#/api/hrm/leave-cancel';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'HrmLeaveCancelBillList' });
const userStore = useUserStore();
const router = useRouter();

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 新增请假销假申请单 */
function handleCreate() {
  router.push({
    path: '/hrm/attendance/leave-cancel-info',
    query: {
      t: Date.now(),
    },
  });
}

/** 删除请假销假申请单 */
async function handleDelete(row: LeaveCancelBillApi.LeaveCancelBill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteLeaveCancelBill(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除请假销假申请单 */
async function handleDeleteBatch() {
  const checkedRecords = gridApi.grid.getCheckboxRecords();
  const notAllowedRecords = checkedRecords.filter(
    (record: LeaveCancelBillApi.LeaveCancelBill) =>
      !BpmProcessInstanceStatusEditValue.includes(
        record.processStatus as number,
      ),
  );

  if (notAllowedRecords.length > 0) {
    const billCodes = notAllowedRecords
      .map(
        (record: LeaveCancelBillApi.LeaveCancelBill) =>
          record.billCode || record.id,
      )
      .join(', ');
    message.warning(`以下单据不允许删除：${billCodes}`);
    return;
  }

  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    key: 'action_key_msg',
  });
  try {
    await deleteLeaveCancelBillList(checkedIds.value);
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

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: LeaveCancelBillApi.LeaveCancelBill[];
}) {
  checkedIds.value = records
    .map((item) => item.id!)
    .filter((id): id is number => id !== undefined);
}

/** 导出表格 */
async function handleExport() {
  const data = await exportLeaveCancelBill(
    await gridApi.formApi.getValues(),
  );
  downloadFileFromBlobPart({ fileName: '请假销假申请单.xls', source: data });
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
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getLeaveCancelBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            creator: userStore.userInfo?.id,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<LeaveCancelBillApi.LeaveCancelBill>,
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
              label: $t('ui.actionTitle.create'),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:leave-cancel-bill:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['hrm:leave-cancel-bill:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['hrm:leave-cancel-bill:delete'],
              onClick: handleDeleteBatch,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              ifShow: () =>
                BpmProcessInstanceStatusEditValue.includes(
                  row.processStatus as number,
                ),
              auth: ['hrm:leave-cancel-bill:delete'],
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
              auth: ['hrm:leave-cancel-bill:delete'],
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

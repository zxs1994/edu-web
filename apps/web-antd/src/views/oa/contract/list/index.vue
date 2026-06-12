<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ContractBillApi } from '#/api/oa/contract';

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
  deleteContractBill,
  deleteContractBillList,
  exportContractBill,
  getContractBillPage,
} from '#/api/oa/contract';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

const userStore = useUserStore();
const router = useRouter();
defineOptions({ name: 'OaContractBillList' });

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  router.push({
    path: '/oa/contract-bill-info',
    query: { t: Date.now() },
  });
}

function handleDetail(row: ContractBillApi.ContractBill) {
  router.push({
    path: '/oa/contract-bill-info',
    query: { id: row.id },
  });
}

async function handleDelete(row: ContractBillApi.ContractBill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteContractBill(row.id as number);
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
  records: ContractBillApi.ContractBill[];
}) {
  checkedIds.value = records
    .map((item) => item.id!)
    .filter((id): id is number => id !== undefined);
}

async function handleDeleteBatch() {
  const checkedRecords = gridApi.grid.getCheckboxRecords();
  const notAllowed = checkedRecords.filter(
    (r: ContractBillApi.ContractBill) =>
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
    await deleteContractBillList(checkedIds.value);
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
  const data = await exportContractBill(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '合同审批.xls', source: data });
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
          return await getContractBillPage({
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
  } as VxeTableGridOptions<ContractBillApi.ContractBill>,
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
    <Grid table-title="合同审批列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create'),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:contract-bill:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:contract-bill:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['oa:contract-bill:delete'],
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
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              ifShow: () =>
                BpmProcessInstanceStatusEditValue.includes(
                  row.processStatus as number,
                ),
              auth: ['oa:contract-bill:delete'],
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
              auth: ['oa:contract-bill:delete'],
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

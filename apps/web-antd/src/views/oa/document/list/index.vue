<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DocumentDispatchBillApi } from '#/api/oa/document';

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
  deleteDocumentDispatchBill,
  deleteDocumentDispatchBillList,
  exportDocumentDispatchBill,
  getDocumentDispatchBillPage,
} from '#/api/oa/document';
import { getSimpleDeptList } from '#/api/system/dept';
import { $t } from '#/locales';

import { cachedDeptList, useGridColumns, useGridFormSchema } from './data';

const userStore = useUserStore();
const router = useRouter();
defineOptions({ name: 'OaDocumentDispatchBillList' });

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  router.push({
    path: '/oa/document-dispatch-info',
    query: { t: Date.now() },
  });
}

function handleDetail(row: DocumentDispatchBillApi.DocumentDispatchBill) {
  router.push({
    path: '/oa/document-dispatch-info',
    query: { id: row.id },
  });
}

async function handleDelete(row: DocumentDispatchBillApi.DocumentDispatchBill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteDocumentDispatchBill(row.id as number);
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
  records: DocumentDispatchBillApi.DocumentDispatchBill[];
}) {
  checkedIds.value = records
    .map((item) => item.id!)
    .filter((id): id is number => id !== undefined);
}

async function handleDeleteBatch() {
  const checkedRecords = gridApi.grid.getCheckboxRecords();
  const notAllowed = checkedRecords.filter(
    (r: DocumentDispatchBillApi.DocumentDispatchBill) =>
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
    await deleteDocumentDispatchBillList(checkedIds.value);
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
  const data = await exportDocumentDispatchBill(
    await gridApi.formApi.getValues(),
  );
  downloadFileFromBlobPart({ fileName: '公文发文.xls', source: data });
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
          return await getDocumentDispatchBillPage({
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
  } as VxeTableGridOptions<DocumentDispatchBillApi.DocumentDispatchBill>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

onActivated(async () => {
  // 首次进入时加载部门列表，用于主送部门 ID→名称映射
  if (cachedDeptList.length === 0) {
    try {
      const data = await getSimpleDeptList();
      cachedDeptList.push(...((data as Array<{ id: number; name: string }>) || []));
    } catch {
      // 静默失败
    }
  }
  onRefresh();
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="公文发文列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增公文发文',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:document-dispatch-bill:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:document-dispatch-bill:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['oa:document-dispatch-bill:delete'],
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
              auth: ['oa:document-dispatch-bill:delete'],
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
              auth: ['oa:document-dispatch-bill:delete'],
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

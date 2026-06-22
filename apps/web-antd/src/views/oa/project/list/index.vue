<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ProjectInitiationBillApi } from '#/api/oa/project';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import {
  ACTION_ICON,
  TableAction,
  useVbenVxeGrid,
} from '#/adapter/vxe-table';
import {
  deleteProjectInitiationBill,
  deleteProjectInitiationBillList,
  exportProjectInitiationBill,
  getProjectInitiationBillPage,
} from '#/api/oa/project';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();
defineOptions({ name: 'OaProjectInitiationBillList' });

function onRefresh() {
  gridApi.query();
}

/* function handleCreate() {
  router.push({
    path: '/oa/contract/project-initiation-info',
    query: { t: Date.now() },
  });
} */

/* function handleEdit(row: ProjectInitiationBillApi.ProjectInitiationBill) {
  router.push({
    path: '/oa/contract/project-initiation-info',
    query: { id: row.id },
  });
} */

function handleDetail(row: ProjectInitiationBillApi.ProjectInitiationBill) {
  const route = getOaDetailRoute(row, '/oa/contract/project-initiation-info');
  router.push(route);
}

async function handleDelete(
  row: ProjectInitiationBillApi.ProjectInitiationBill,
) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.billCode]),
    key: 'action_key_msg',
  });
  try {
    await deleteProjectInitiationBill(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.billCode]),
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
  records: ProjectInitiationBillApi.ProjectInitiationBill[];
}) {
  checkedIds.value = records
    .map((item) => item.id!)
    .filter((id): id is number => id !== undefined);
}

async function handleDeleteBatch() {
  const checkedRecords = gridApi.grid.getCheckboxRecords();
  const notAllowed = checkedRecords.filter(
    (r: ProjectInitiationBillApi.ProjectInitiationBill) =>
      r.processStatus !== BpmProcessInstanceStatus.NOT_START,
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
    await deleteProjectInitiationBillList(checkedIds.value);
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
  const data = await exportProjectInitiationBill(
    await gridApi.formApi.getValues(),
  );
  downloadFileFromBlobPart({ fileName: '立项管理.xls', source: data });
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
          return await getProjectInitiationBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: { code: 'query' }, search: true },
  } as VxeTableGridOptions<ProjectInitiationBillApi.ProjectInitiationBill>,
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
              auth: ['oa:project-initiation-bill:create'],
              onClick: handleCreate,
            }, */
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:project-initiation-bill:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['oa:project-initiation-bill:delete'],
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
            /* {
              label: $t('common.edit'),
              type: 'link',
              ifShow: () =>
                BpmProcessInstanceStatusEditValue.includes(
                  row.processStatus as number,
                ),
              auth: ['oa:project-initiation-bill:update'],
              onClick: handleEdit.bind(null, row),
            }, */
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              ifShow: () =>
                row.processStatus === BpmProcessInstanceStatus.NOT_START,
              auth: ['oa:project-initiation-bill:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.billCode]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

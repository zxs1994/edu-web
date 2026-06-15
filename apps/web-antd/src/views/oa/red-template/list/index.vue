<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RedTemplateApi } from '#/api/oa/red-template';

import { onActivated, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRedTemplate,
  deleteRedTemplateList,
  exportRedTemplate,
  getRedTemplatePage,
} from '#/api/oa/red-template';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

defineOptions({ name: 'OaRedTemplateList' });

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(row: RedTemplateApi.RedTemplate) {
  formModalApi.setData(row).open();
}

async function handleDelete(row: RedTemplateApi.RedTemplate) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteRedTemplate(row.id as number);
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
function handleRowCheckboxChange({ records }: { records: RedTemplateApi.RedTemplate[] }) {
  checkedIds.value = records.map((item) => item.id!).filter((id): id is number => id !== undefined);
}

async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    key: 'action_key_msg',
  });
  try {
    await deleteRedTemplateList(checkedIds.value);
    message.success({ content: $t('ui.actionMessage.deleteSuccess'), key: 'action_key_msg' });
    onRefresh();
    checkedIds.value = [];
  } finally {
    hideLoading();
  }
}

async function handleExport() {
  const data = await exportRedTemplate(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '套红模板.xls', source: data });
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
          return await getRedTemplatePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: { code: 'query' }, search: true },
  } as VxeTableGridOptions<RedTemplateApi.RedTemplate>,
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
    <FormModal @success="onRefresh" />
    <Grid table-title="套红模板列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['套红模板']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:red-template:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:red-template:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['oa:red-template:delete'],
              onClick: handleDeleteBatch,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:red-template:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:red-template:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.templateName]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

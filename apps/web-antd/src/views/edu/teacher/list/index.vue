<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TeacherApi } from '#/api/edu/teacher';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTeacher,
  deleteTeacherList,
  exportTeacherExcel,
  getTeacherPage,
} from '#/api/edu/teacher';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'EduTeacherList' });

const router = useRouter();
const checkedIds = ref<number[]>([]);

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  router.push({
    path: '/edu/teacher-info',
    query: {
      t: Date.now(),
    },
  });
}

function handleEdit(row: TeacherApi.Teacher) {
  router.push({
    path: '/edu/teacher-info',
    query: {
      id: row.id,
      t: Date.now(),
    },
  });
}

async function handleDelete(row: TeacherApi.Teacher) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteTeacher(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

async function handleDeleteBatch() {
  if (isEmpty(checkedIds.value)) {
    message.warning('请先选择要删除的记录');
    return;
  }
  const hideLoading = message.loading('正在删除...', 0);
  try {
    await deleteTeacherList(checkedIds.value);
    message.success('批量删除成功');
    checkedIds.value = [];
    onRefresh();
  } catch {
    message.error('批量删除失败');
  } finally {
    hideLoading();
  }
}

async function handleExport() {
  const hideLoading = message.loading('正在导出...', 0);
  try {
    const data = await exportTeacherExcel(await gridApi.formApi.getValues());
    downloadFileFromBlobPart({ fileName: '教培档案.xls', source: data });
    message.success('导出成功');
  } catch {
    message.error('导出失败');
  } finally {
    hideLoading();
  }
}

function handleRowCheckboxChange() {
  const records = gridApi.grid.getCheckboxRecords();
  checkedIds.value = records.map(
    (item: TeacherApi.Teacher) => item.id as number,
  );
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
          return await getTeacherPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      refreshOptions: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<TeacherApi.Teacher>,
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
              auth: ['edu:teacher:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['edu:teacher:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['edu:teacher:delete'],
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
              icon: ACTION_ICON.EDIT,
              auth: ['edu:teacher:update'],
              onClick: () => handleEdit(row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: () => handleDelete(row),
              },
              auth: ['edu:teacher:delete'],
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { StudentApi } from '#/api/edu/student';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteStudent,
  deleteStudentList,
  exportStudentExcel,
  getStudentPage,
} from '#/api/edu/student';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'EduStudentList' });

const router = useRouter();
const checkedIds = ref<number[]>([]);

function onRefresh() {
  gridApi.query();
}

function handleCreate() {
  router.push({
    path: '/edu/student-info',
    query: {
      t: Date.now(),
    },
  });
}

function handleEdit(row: StudentApi.Student) {
  router.push({
    path: '/edu/student-info',
    query: {
      id: row.id,
      t: Date.now(),
    },
  });
}

async function handleDelete(row: StudentApi.Student) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteStudent(row.id as number);
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
    await deleteStudentList(checkedIds.value);
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
    const data = await exportStudentExcel(await gridApi.formApi.getValues());
    downloadFileFromBlobPart({ fileName: '学生档案.xls', source: data });
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
    (item: StudentApi.Student) => item.id as number,
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
          return await getStudentPage({
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
  } as VxeTableGridOptions<StudentApi.Student>,
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
              auth: ['edu:student:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['edu:student:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['edu:student:delete'],
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
              auth: ['edu:student:update'],
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
              auth: ['edu:student:delete'],
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

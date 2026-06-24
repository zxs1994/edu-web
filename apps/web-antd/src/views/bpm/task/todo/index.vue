<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmTaskApi } from '#/api/bpm/task';

import { Page } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTaskTodoPage } from '#/api/bpm/task';
import { router } from '#/router';
import { isBillDeleted } from '#/utils/bpm-bill-status';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'BpmTodoTask' });

/** 办理任务 */
function handleAudit(row: BpmTaskApi.Task) {
  if (isBillDeleted(row)) {
    return;
  }
  router.push({
    name: 'BpmProcessInstanceTodoDetail',
    query: {
      id: row.processInstance!.id,
      taskId: row.id,
      isTodo: 'true',
      nodeKey: row.taskDefinitionKey,
    },
  });
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    wrapperClass: 'grid-cols-4',
    collapsed: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getTaskTodoPage({
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
      search: true,
    },
  } as VxeTableGridOptions<BpmTaskApi.Task>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #slot-bill-code="{ row }">
        <a
          v-if="!isBillDeleted(row) && row.processInstance?.billCode"
          class="text-primary"
          @click="handleAudit(row)"
        >
          {{ row.processInstance.billCode }}
        </a>
        <span v-else-if="row.processInstance?.billCode">
          {{ row.processInstance.billCode }}
        </span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <span v-if="isBillDeleted(row)" class="text-gray-400">-</span>
        <TableAction
          v-else
          :actions="[
            {
              label: $t('ui.actionTitle.handle'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['bpm:task:query'],
              onClick: handleAudit.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

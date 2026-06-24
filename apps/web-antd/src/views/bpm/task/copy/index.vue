<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';

import { Page } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProcessInstanceCopyPage } from '#/api/bpm/processInstance';
import { $t } from '#/locales';
import { router } from '#/router';
import { isBillDeleted } from '#/utils/bpm-bill-status';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'BpmCopyTask' });

/** 任务详情 */
function handleDetail(row: BpmProcessInstanceApi.ProcessInstanceCopyRespVO) {
  if (isBillDeleted(row)) {
    return;
  }
  const query: Record<string, string> = {
    id: row.processInstanceId,
    isCopy: 'true',
    ...(row.activityId && { activityId: row.activityId }),
    ...(row.reason && { copyReason: row.reason }),
  };
  router.push({
    name: 'BpmProcessInstanceDetail',
    query,
  });
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getProcessInstanceCopyPage({
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
  } as VxeTableGridOptions<BpmProcessInstanceApi.ProcessInstanceCopyRespVO>,
});
</script>

<template>
  <Page auto-content-height>

    <Grid>
      <template #slot-bill-code="{ row }">
        <a
          v-if="!isBillDeleted(row) && row.billCode"
          class="text-primary"
          @click="handleDetail(row)"
        >
          {{ row.billCode }}
        </a>
        <span v-else-if="row.billCode">{{ row.billCode }}</span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <span v-if="isBillDeleted(row)" class="text-gray-400">-</span>
        <TableAction
          v-else
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['bpm:task:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

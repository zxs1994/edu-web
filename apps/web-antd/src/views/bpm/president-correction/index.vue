<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPresidentCorrectionPage } from '#/api/oa/president-correction';
import { router } from '#/router';

import { useGridColumns, useGridFormSchema, OA_CATEGORY_CODE } from './data';
import InitiateModal from './initiate-modal.vue';

defineOptions({ name: 'BpmPresidentCorrection' });

const shouldRefreshList = ref(false);

const [InitiateFormModal, initiateModalApi] = useVbenModal({
  connectedComponent: InitiateModal,
  destroyOnClose: true,
  onClosed() {
    if (shouldRefreshList.value) {
      gridApi.query();
      shouldRefreshList.value = false;
    }
  },
});

function handleHistory(row: BpmProcessInstanceApi.ProcessInstance) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.id },
  });
}

function handleInitiate(row: BpmProcessInstanceApi.ProcessInstance) {
  initiateModalApi.setData(row).open();
}

function onInitiateSuccess() {
  shouldRefreshList.value = true;
  gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
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
          const params: Record<string, any> = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            category: OA_CATEGORY_CODE,
            ...formValues,
          };
          Object.keys(params).forEach((key) => {
            const value = params[key];
            if (value === '' || value === undefined || value === null) {
              delete params[key];
            }
          });
          return await getPresidentCorrectionPage(params);
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
  } as VxeTableGridOptions<BpmProcessInstanceApi.ProcessInstance>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看审批',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['oa:president-correction:query'],
              onClick: handleHistory.bind(null, row),
            },
            {
              label: '发起纠错',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:president-correction:initiate'],
              onClick: handleInitiate.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>

    <InitiateFormModal @success="onInitiateSuccess" />
  </Page>
</template>

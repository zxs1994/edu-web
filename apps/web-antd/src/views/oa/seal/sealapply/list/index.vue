<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SealApplyBillApi } from '#/api/oa/seal/sealapply';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSealApplyBill,
  exportSealApplyBillDetail,
  getSealApplyBillPage,
} from '#/api/oa/seal/sealapply';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { SealSelectModal } from '../../components';
import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();

const modalRef = ref<InstanceType<typeof SealSelectModal>>();
const checkedRows = ref<SealApplyBillApi.SealApplyBill[]>([]);
const BILL_TYPE = '103';

defineOptions({ name: 'OaSealApplyBillList' });

function onRefresh() {
  gridApi.query();
}

function handleDetail(row: SealApplyBillApi.SealApplyBill) {
  router.push(getOaDetailRoute(row, '/oa/seal/seal-apply-info'));
}

async function handleDelete(row: SealApplyBillApi.SealApplyBill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteSealApplyBill(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

async function handleExportSelectedDetail() {
  const exportableRows = checkedRows.value.filter(
    (row) => row.processStatus === BpmProcessInstanceStatus.APPROVE,
  );
  if (exportableRows.length === 0) {
    message.warning('仅支持导出审批通过的单据，请先勾选符合条件的单据');
    return;
  }
  const hideLoading = message.loading(`正在导出 ${exportableRows.length} 份单据...`, 0);
  let successCount = 0;
  try {
    for (const row of exportableRows) {
      if (!row.id) {
        continue;
      }
      try {
        const data = await exportSealApplyBillDetail({
          billType: BILL_TYPE,
          id: Number(row.id),
        });
        downloadFileFromBlobPart({
          fileName: `用印申请单-${row.billCode || row.id}.xlsx`,
          source: data,
        });
        successCount++;
      } catch (error: any) {
        message.error(`导出失败：${row.billCode || row.id}，${error?.message || '请稍后重试'}`);
      }
    }
    if (successCount > 0) {
      message.success(`导出完成，成功 ${successCount} 份`);
    }
  } finally {
    hideLoading();
  }
}

function handleRowCheckboxChange() {
  checkedRows.value = gridApi.grid.getCheckboxRecords() as SealApplyBillApi.SealApplyBill[];
}

function handleSealSelect(seal: any) {
  gridApi.formApi.setFieldValue('sealNo', seal.sealNo);
  gridApi.formApi.setFieldValue('sealId', seal.id);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(modalRef),
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
          return await getSealApplyBillPage({
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
    checkboxConfig: {
      highlight: true,
      checkMethod: ({ row }: { row: SealApplyBillApi.SealApplyBill }) =>
        row.processStatus === BpmProcessInstanceStatus.APPROVE,
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SealApplyBillApi.SealApplyBill>,
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
              label: '导出选中单据',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:seal-apply-bill:export'],
              disabled: checkedRows.length === 0,
              onClick: handleExportSelectedDetail,
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
          ]"
        />
      </template>
    </Grid>

    <SealSelectModal ref="modalRef" @select="handleSealSelect" />
  </Page>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SealApplyBillApi } from '#/api/oa/seal/sealapply';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSealApplyBill,
  exportSealApplyBill,
  getSealApplyBillPage,
} from '#/api/oa/seal/sealapply';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { SealSelectModal } from '../../components';
import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();

// 印章选择弹窗引用
const modalRef = ref<InstanceType<typeof SealSelectModal>>();

defineOptions({ name: 'OaSealApplyBillList' });

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 新增用印申请单 */
/* function handleCreate() {
  router.push({
    path: '/oa/seal/seal-apply-info',
    query: {
      t: Date.now(), // 添加时间戳作为随机串
    },
  });
} */

/** 查看用印申请单详情 */
function handleDetail(row: SealApplyBillApi.SealApplyBill) {
  const route = getOaDetailRoute(row, '/oa/seal/seal-apply-info');
  router.push(route);
}

/** 删除用印申请单 */
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

/** 导出表格 */
async function handleExport() {
  const data = await exportSealApplyBill(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '用印申请单.xls', source: data });
}

// 处理印章选择
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
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SealApplyBillApi.SealApplyBill>,
});

// 页签切换时自动刷新表格数据
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
              auth: ['oa:seal-apply-bill:create'],
              onClick: handleCreate,
            }, */
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:seal-apply-bill:export'],
              onClick: handleExport,
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

    <!-- 印章选择弹窗 -->
    <SealSelectModal ref="modalRef" @select="handleSealSelect" />
  </Page>
</template>

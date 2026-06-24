<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CarApplyBillApi } from '#/api/oa/car/carapply';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCarApplyBill,
  exportCarApplyBill,
  getCarApplyBillPage,
} from '#/api/oa/car/carapply';
import { $t } from '#/locales';
import { getOaDetailRoute } from '#/utils/oa-route-resolver';

import { CarSelectModal } from '../../components';
import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();

// 车辆选择弹窗引用
const modalRef = ref<InstanceType<typeof CarSelectModal>>();

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 新增用车申请单 */
/* function handleCreate() {
  router.push({
    path: '/oa/car/car-apply-info',
    query: {
      t: Date.now(), // 添加时间戳作为随机串
    },
  });
} */

/** 查看用车申请单详情 */
function handleDetail(row: CarApplyBillApi.CarApplyBill) {
  const route = getOaDetailRoute(row, '/oa/car/car-apply-info');
  router.push(route);
}

/** 删除用车申请单 */
async function handleDelete(row: CarApplyBillApi.CarApplyBill) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteCarApplyBill(row.id as number);
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
  const data = await exportCarApplyBill(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '用车申请单.xls', source: data });
}

// 处理车辆选择（多选弹窗，取第一辆车作为搜索条件）
function handleCarSelect(cars: any[]) {
  if (Array.isArray(cars) && cars.length > 0) {
    gridApi.formApi.setFieldValue('carNo', cars[0]!.carNo);
    gridApi.formApi.setFieldValue('carId', cars[0]!.id);
  }
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
          return await getCarApplyBillPage({
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
  } as VxeTableGridOptions<CarApplyBillApi.CarApplyBill>,
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
              auth: ['oa:car-apply-bill:create'],
              onClick: handleCreate,
            }, */
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['oa:car-apply-bill:export'],
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

    <!-- 车辆选择弹窗 -->
    <CarSelectModal ref="modalRef" @select="handleCarSelect" />
  </Page>
</template>

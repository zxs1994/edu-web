<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CarApi } from '#/api/oa/car/carinfo';

import { reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCarPage } from '#/api/oa/car/carinfo';

import { useCarSelectColumns, useCarSelectFormSchema } from './car-select-data';

/** 定义组件事件 */
const emit = defineEmits<{
  (e: 'select', cars: CarApi.Car[]): void;
}>();

const formData = reactive({
  selectedCars: [] as CarApi.Car[],
});

/** 表格实例 */
const [Grid, gridApi] = useVbenVxeGrid({
  separator: false,
  formOptions: {
    schema: useCarSelectFormSchema(),
    submitOnChange: true,
    collapsed: true,
  },
  gridOptions: {
    columns: useCarSelectColumns(),
    height: 440,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          // 合并分类筛选条件
          const queryParams = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };
          return await getCarPage(queryParams);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      enabled: false,
    },
    checkboxConfig: {
      highlight: true,
    },
    pagerConfig: {
      enabled: true,
    },
  } as VxeTableGridOptions<CarApi.Car>,
  gridEvents: {
    checkboxChange: ({
      checked,
      row,
    }: {
      checked: boolean;
      row: CarApi.Car;
    }) => {
      if (checked) {
        formData.selectedCars.push(row);
      } else {
        formData.selectedCars = formData.selectedCars.filter(
          (item) => item.id !== row.id,
        );
      }
    },
    checkboxAll: ({
      checked,
      records,
    }: {
      checked: boolean;
      records: CarApi.Car[];
    }) => {
      if (checked) {
        // 添加所有未选中的记录
        for (const row of records) {
          if (!formData.selectedCars.some((item) => item.id === row.id)) {
            formData.selectedCars.push(row);
          }
        }
      } else {
        // 移除当前页的所有记录
        const pageIds = new Set(records.map((r) => r.id));
        formData.selectedCars = formData.selectedCars.filter(
          (item) => !pageIds.has(item.id),
        );
      }
    },
    cellDblclick: ({ row }: { row: CarApi.Car }) => {
      // 双击直接选择单车
      formData.selectedCars = [row];
      handleConfirm();
    },
  },
});

/** 模态框实例 */
const [Modal, modalApi] = useVbenModal({
  title: '选择车辆',
  class: 'w-3/5 max-w-4xl',
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 打开弹窗时重置选中状态
      formData.selectedCars = [];
      await gridApi.grid.clearCheckboxRow();
    }
  },
  async onConfirm() {
    return handleConfirm();
  },
});

/** 确认选择 */
async function handleConfirm() {
  if (formData.selectedCars.length === 0) {
    message.error('请选择车辆');
    return false;
  }

  emit('select', [...formData.selectedCars]);
  formData.selectedCars = [];
  await gridApi.grid.clearCheckboxRow();
  await modalApi.close();
  return true;
}

/** 暴露modal API供外部调用 */
defineExpose({
  modalApi,
  gridApi,
});
</script>

<template>
  <Modal>
    <Grid />
  </Modal>
</template>

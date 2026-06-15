<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TravelApplyBillApi } from '#/api/oa/travel';

import { reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTravelApplyBillPage } from '#/api/oa/travel';

import {
  useTravelApplySelectColumns,
  useTravelApplySelectFormSchema,
} from './travel-apply-select-data';

/** 定义组件事件 */
const emit = defineEmits<{
  (e: 'select', bills: TravelApplyBillApi.TravelApplyBill[]): void;
}>();

const formData = reactive({
  selectedBills: [] as TravelApplyBillApi.TravelApplyBill[],
});

/** 表格实例 */
const [Grid, gridApi] = useVbenVxeGrid({
  separator: false,
  formOptions: {
    schema: useTravelApplySelectFormSchema(),
    submitOnChange: true,
    collapsed: true,
  },
  gridOptions: {
    columns: useTravelApplySelectColumns(),
    height: 440,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const queryParams = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            // 仅查询审批通过的差旅申请单
            processStatus: BpmProcessInstanceStatus.APPROVE,
            creator: useUserStore().userInfo?.id,
            ...formValues,
          };
          return await getTravelApplyBillPage(queryParams);
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { enabled: false },
    checkboxConfig: { highlight: true },
    pagerConfig: { enabled: true },
  } as VxeTableGridOptions<TravelApplyBillApi.TravelApplyBill>,
  gridEvents: {
    checkboxChange: ({
      checked,
      row,
    }: {
      checked: boolean;
      row: TravelApplyBillApi.TravelApplyBill;
    }) => {
      if (checked) {
        formData.selectedBills.push(row);
      } else {
        formData.selectedBills = formData.selectedBills.filter(
          (item) => item.id !== row.id,
        );
      }
    },
    checkboxAll: ({
      checked,
      records,
    }: {
      checked: boolean;
      records: TravelApplyBillApi.TravelApplyBill[];
    }) => {
      if (checked) {
        // 添加所有未选中的记录
        for (const row of records) {
          if (!formData.selectedBills.some((item) => item.id === row.id)) {
            formData.selectedBills.push(row);
          }
        }
      } else {
        // 移除当前页的所有记录
        const pageIds = new Set(records.map((r) => r.id));
        formData.selectedBills = formData.selectedBills.filter(
          (item) => !pageIds.has(item.id),
        );
      }
    },
  },
});

/** 模态框实例 */
const [Modal, modalApi] = useVbenModal({
  title: '选择差旅申请单',
  class: 'w-3/5 max-w-4xl',
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 打开弹窗时重置选中状态
      formData.selectedBills = [];
      await gridApi.grid.clearCheckboxRow();
    }
  },
  async onConfirm() {
    return handleConfirm();
  },
});

/** 确认选择 */
async function handleConfirm() {
  if (formData.selectedBills.length === 0) {
    message.error('请选择至少一个差旅申请单');
    return false;
  }
  emit('select', [...formData.selectedBills]);
  formData.selectedBills = [];
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

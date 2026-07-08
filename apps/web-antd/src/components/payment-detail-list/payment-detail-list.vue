<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ExpensePaymentBillApi } from '#/api/oa/expense-payment';

import { computed, nextTick, ref, watch } from 'vue';

import { DatePicker, Select } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  calcPaymentDetailsTotal,
  createPaymentDetail,
  formatPaymentExpenseDate,
  getExpenseTypeOptions,
  normalizePaymentDetail,
  usePaymentDetailColumns,
} from './data';

interface Props {
  modelValue?: ExpensePaymentBillApi.ExpensePaymentDetail[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: ExpensePaymentBillApi.ExpensePaymentDetail[]];
  'update:total': [total: number];
}>();

const tableData = ref<ExpensePaymentBillApi.ExpensePaymentDetail[]>([]);
const expenseTypeOptions = getExpenseTypeOptions();
let isInternalUpdate = false;

function emitUpdate() {
  isInternalUpdate = true;
  const data = [...tableData.value];
  emit('update:modelValue', data);
  emit('update:total', calcPaymentDetailsTotal(data));
}

function reloadGridData() {
  nextTick(() => {
    gridApi.grid.reloadData(tableData.value);
  });
}

function refreshFooter() {
  nextTick(() => {
    (gridApi.grid as any).updateFooter?.();
  });
}

function updateField(
  row: ExpensePaymentBillApi.ExpensePaymentDetail,
  field: keyof ExpensePaymentBillApi.ExpensePaymentDetail,
  value: any,
) {
  const index = findRowIndex(row);
  if (index !== -1) {
    (tableData.value[index] as any)[field] = value;
    emitUpdate();
    refreshFooter();
  }
}

function updateFieldByIndex(
  index: number,
  field: keyof ExpensePaymentBillApi.ExpensePaymentDetail,
  value: any,
) {
  if (index >= 0 && index < tableData.value.length) {
    (tableData.value[index] as any)[field] = value;
    emitUpdate();
    refreshFooter();
  }
}

function findRowIndex(row: ExpensePaymentBillApi.ExpensePaymentDetail): number {
  if (row.rowKey) {
    const byKey = tableData.value.findIndex((item) => item.rowKey === row.rowKey);
    if (byKey !== -1) return byKey;
  }
  if (row.id != null) {
    const byId = tableData.value.findIndex((item) => item.id === row.id);
    if (byId !== -1) return byId;
  }
  return tableData.value.indexOf(row);
}

function handleAdd() {
  const detail = createPaymentDetail(tableData.value.length + 1);
  tableData.value = [...tableData.value, detail];
  emitUpdate();
  reloadGridData();
}

function handleDeleteByIndex(index: number) {
  if (index < 0 || index >= tableData.value.length) return;
  tableData.value = tableData.value
    .filter((_, idx) => idx !== index)
    .map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
  emitUpdate();
  reloadGridData();
}

const topActions = computed(() => {
  if (props.readonly) return [];
  return [{ label: '添加明细', type: 'primary' as const, onClick: handleAdd }];
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: usePaymentDetailColumns(props.readonly),
    data: tableData.value,
    height: undefined,
    maxHeight: undefined,
    border: true,
    showOverflow: true,
    autoResize: true,
    keepSource: true,
    showFooter: true,
    footerMethod({ columns }) {
      return [
        columns.map((column, columnIndex) => {
          if (columnIndex === 0) return '合计';
          if (column.field === 'amount') {
            return `¥${calcPaymentDetailsTotal(tableData.value).toFixed(2)}`;
          }
          return '';
        }),
      ];
    },
    scrollY: { enabled: false },
    scrollX: { enabled: false },
    rowConfig: { keyField: 'rowKey', isHover: true },
    pagerConfig: { enabled: false },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<ExpensePaymentBillApi.ExpensePaymentDetail>,
});

watch(
  () => props.readonly,
  async (readonly) => {
    await nextTick();
    gridApi.grid.reloadColumn(usePaymentDetailColumns(readonly));
  },
);

watch(
  () => props.modelValue,
  async (details) => {
    if (isInternalUpdate) {
      isInternalUpdate = false;
      return;
    }
    if (!details) {
      tableData.value = [];
      await nextTick();
      gridApi.grid.reloadData([]);
      emit('update:total', 0);
      return;
    }
    await nextTick();
    tableData.value = details.map((item, index) => normalizePaymentDetail(item, index));
    gridApi.grid.reloadData(tableData.value);
    emit('update:total', calcPaymentDetailsTotal(tableData.value));
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="payment-detail-list">
    <div v-if="topActions.length > 0" class="mb-2 flex justify-end">
      <TableAction :actions="topActions" />
    </div>
    <Grid class="w-full">
      <template #expenseType="{ row }">
        <Select
          v-if="!props.readonly"
          :value="row.expenseType || undefined"
          class="cell-select"
          placeholder="请选择"
          :options="expenseTypeOptions"
          @change="(val: any) => updateField(row, 'expenseType', String(val || ''))"
        />
        <span v-else>{{ row.expenseType }}</span>
      </template>
      <template #expenseDate="{ row }">
        <DatePicker
          v-if="!props.readonly"
          :value="formatPaymentExpenseDate(row.expenseDate) || undefined"
          class="cell-date-picker"
          placeholder="请选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="(val: any) => updateField(row, 'expenseDate', String(val || ''))"
        />
        <span v-else>{{ formatPaymentExpenseDate(row.expenseDate) }}</span>
      </template>
      <template #cause="{ row, $rowIndex }">
        <input
          v-if="!props.readonly"
          :value="row.cause"
          class="cell-input"
          placeholder="请输入费用用途"
          @input="updateFieldByIndex($rowIndex, 'cause', ($event.target as HTMLInputElement).value)"
        />
        <span v-else>{{ row.cause }}</span>
      </template>
      <template #amount="{ row, $rowIndex }">
        <input
          v-if="!props.readonly"
          type="number"
          step="0.01"
          :value="row.amount"
          class="cell-input text-right"
          placeholder="0.00"
          @input="updateFieldByIndex($rowIndex, 'amount', Number(($event.target as HTMLInputElement).value) || 0)"
        />
        <span v-else>{{ Number(row.amount || 0).toFixed(2) }}</span>
      </template>
      <template #remark="{ row, $rowIndex }">
        <input
          v-if="!props.readonly"
          :value="row.remark"
          class="cell-input"
          placeholder="备注"
          @input="updateFieldByIndex($rowIndex, 'remark', ($event.target as HTMLInputElement).value)"
        />
        <span v-else>{{ row.remark }}</span>
      </template>
      <template #actions="{ $rowIndex }">
        <a class="text-red-500" @click="handleDeleteByIndex($rowIndex)">删除</a>
      </template>
    </Grid>
  </div>
</template>

<style scoped>
.cell-input,
.cell-select,
.cell-date-picker {
  width: 100%;
}
.cell-input {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 4px 8px;
}
</style>

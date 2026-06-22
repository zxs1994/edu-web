<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ExpenseReimburseBillApi } from '#/api/oa/expense';

import { computed, nextTick, ref, watch } from 'vue';

import { DatePicker, Select } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  createExpenseDetail,
  EXPENSE_TYPE_OPTIONS,
  formatExpenseDate,
  normalizeExpenseDetail,
  useExpenseDetailColumns,
} from './data';

interface Props {
  modelValue?: ExpenseReimburseBillApi.ExpenseReimburseDetail[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: ExpenseReimburseBillApi.ExpenseReimburseDetail[]];
  'update:total': [total: number];
}>();

const tableData = ref<ExpenseReimburseBillApi.ExpenseReimburseDetail[]>([]);

/** 防止自身 emit 触发 watch 循环刷新 */
let isInternalUpdate = false;

function emitUpdate() {
  isInternalUpdate = true;
  const data = [...tableData.value];
  emit('update:modelValue', data);
  const total = data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  emit('update:total', Number(total.toFixed(2)));
}

function reloadGridData() {
  nextTick(() => {
    gridApi.grid.reloadData(tableData.value);
  });
}

function updateField(
  row: ExpenseReimburseBillApi.ExpenseReimburseDetail,
  field: keyof ExpenseReimburseBillApi.ExpenseReimburseDetail,
  value: any,
) {
  const index = findRowIndex(row);
  if (index !== -1) {
    (tableData.value[index] as any)[field] = value;
    emitUpdate();
  }
}

function findRowIndex(row: ExpenseReimburseBillApi.ExpenseReimburseDetail): number {
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
  const detail = createExpenseDetail(tableData.value.length + 1);
  tableData.value.push(detail);
  emitUpdate();
  reloadGridData();
}

function handleDeleteByIndex(index: number) {
  if (index < 0 || index >= tableData.value.length) return;
  tableData.value.splice(index, 1);
  tableData.value.forEach((item, idx) => {
    item.sortOrder = idx + 1;
  });
  emitUpdate();
  reloadGridData();
}

function formatAmount(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0.00';
  return Number(value).toFixed(2);
}

/** 计算合计金额 */
function calcTotalAmount(): string {
  const total = tableData.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return total.toFixed(2);
}

const topActions = computed(() => {
  if (props.readonly) return [];
  return [
    {
      label: '添加费用明细',
      type: 'primary' as const,
      onClick: handleAdd,
    },
  ];
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useExpenseDetailColumns(props.readonly),
    data: tableData.value,
    height: undefined,
    maxHeight: undefined,
    border: true,
    showOverflow: true,
    autoResize: true,
    keepSource: true,
    showFooter: true,
    footerMethod({ columns, data }) {
      return [
        columns.map((column, columnIndex) => {
          if (columnIndex === 0) return '合计';
          if (column.field === 'amount') {
            return `¥${calcTotalAmount()}`;
          }
          return '';
        }),
      ];
    },
    scrollY: { enabled: false },
    scrollX: { enabled: false },
    virtualScrollY: false,
    virtualScrollX: false,
    rowConfig: {
      keyField: 'rowKey',
      isHover: true,
    },
    pagerConfig: { enabled: false },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<ExpenseReimburseBillApi.ExpenseReimburseDetail>,
});

watch(
  () => props.readonly,
  async (readonly) => {
    await nextTick();
    const columns = useExpenseDetailColumns(readonly);
    if (columns) {
      gridApi.grid.reloadColumn(columns);
    }
  },
);

/**
 * 监听 modelValue 变化，同步到表格数据
 * 使用 isInternalUpdate 标志位避免自身 emit 触发的循环刷新
 */
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
    tableData.value = details.map((item, index) => normalizeExpenseDetail(item, index));
    gridApi.grid.reloadData(tableData.value);
    emit(
      'update:total',
      Number(
        tableData.value
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
          .toFixed(2),
      ),
    );
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="expense-detail-list">
    <div v-if="topActions.length > 0" class="mb-2 flex justify-end">
      <TableAction :actions="topActions" />
    </div>

    <div>
      <Grid class="w-full">
        <!-- 费用类型 -->
        <template #expenseType="{ row }">
          <Select
            v-if="!props.readonly"
            :value="row.expenseType || undefined"
            class="cell-select"
            placeholder="请选择"
            :options="EXPENSE_TYPE_OPTIONS"
            @change="(val: string) => updateField(row, 'expenseType', val)"
          />
          <span v-else>{{ row.expenseType }}</span>
        </template>

        <!-- 发生日期 -->
        <template #expenseDate="{ row }">
          <DatePicker
            v-if="!props.readonly"
            :value="formatExpenseDate(row.expenseDate) || undefined"
            class="cell-date-picker"
            placeholder="请选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="(val: string) => updateField(row, 'expenseDate', val || '')"
          />
          <span v-else>{{ formatExpenseDate(row.expenseDate) }}</span>
        </template>

        <!-- 出发地 -->
        <template #departure="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.departure"
            class="cell-input"
            placeholder="请输入"
            @input="updateField(row, 'departure', ($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ row.departure }}</span>
        </template>

        <!-- 到达地 -->
        <template #destination="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.destination"
            class="cell-input"
            placeholder="请输入"
            @input="updateField(row, 'destination', ($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ row.destination }}</span>
        </template>

        <!-- 金额 -->
        <template #amount="{ row }">
          <input
            v-if="!props.readonly"
            type="number"
            step="0.01"
            :value="row.amount"
            class="cell-input text-right"
            placeholder="0.00"
            @input="updateField(row, 'amount', Number(($event.target as HTMLInputElement).value) || 0)"
          />
          <span v-else>{{ formatAmount(row.amount) }}</span>
        </template>

        <!-- 费用说明 -->
        <template #description="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.description"
            class="cell-input"
            placeholder="请输入"
            @input="updateField(row, 'description', ($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ row.description }}</span>
        </template>

        <!-- 操作 -->
        <template #actions="{ $rowIndex }">
          <TableAction
            v-if="!props.readonly"
            :actions="[
              {
                label: '删除',
                type: 'link',
                danger: true,
                popConfirm: {
                  title: '确定要删除这条费用明细吗？',
                  confirm: () => handleDeleteByIndex($rowIndex),
                },
              },
            ]"
          />
        </template>
      </Grid>
    </div>
  </div>
</template>

<style scoped>
.expense-detail-list {
  width: 100%;
}

.expense-detail-list :deep(.vxe-grid) {
  height: auto !important;
  max-height: none !important;
  padding-right: 0 !important;
  padding-left: 0 !important;
}

.expense-detail-list > div {
  padding: 0;
  margin: 0;
}

.cell-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
  font-size: 13px;
  line-height: 1.5;
}

.cell-input:hover {
  border-color: #40a9ff;
}

.cell-input:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgb(22 119 255 / 10%);
}

.cell-select {
  width: 100%;
}

.cell-date-picker {
  width: 100%;
}

.text-right {
  text-align: right;
}
</style>

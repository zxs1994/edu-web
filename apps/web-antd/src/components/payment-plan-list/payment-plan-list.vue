<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PaymentPlan } from '#/api/oa/contract';

import { computed, nextTick, ref, watch } from 'vue';

import { DatePicker, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  createPaymentPlan,
  PAYMENT_STATUS_MAP,
  PAYMENT_STATUS_OPTIONS,
  usePaymentPlanColumns,
} from './data';

interface Props {
  /** 收付款计划列表 */
  modelValue?: PaymentPlan[];
  /** 是否只读 */
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: PaymentPlan[]];
}>();

/** 表格内部数据 */
const tableData = ref<PaymentPlan[]>([]);

/** 状态选项 */
const statusOptions = PAYMENT_STATUS_OPTIONS;

/** 更新指定行的字段 */
function updateField(
  row: PaymentPlan,
  field: keyof PaymentPlan,
  value: any,
) {
  const index = tableData.value.findIndex(
    (item) =>
      (item.id && item.id === row.id) ||
      (item.rowKey && item.rowKey === row.rowKey),
  );
  if (index !== -1) {
    (tableData.value[index] as any)[field] = value;
    handleUpdateValue();
  }
}

/** 添加计划行 */
function handleAdd() {
  const plan = createPaymentPlan(tableData.value.length + 1);
  tableData.value.push(plan);
  handleUpdateValue();
}

/** 删除计划行 */
function handleDelete(row: PaymentPlan) {
  const index = tableData.value.findIndex(
    (item) =>
      (item.id && item.id === row.id) ||
      (item.rowKey && item.rowKey === row.rowKey),
  );
  if (index !== -1) {
    tableData.value.splice(index, 1);
    tableData.value.forEach((item, idx) => {
      item.sortOrder = idx + 1;
    });
    handleUpdateValue();
  }
}

/** 将最新数据写回并通知父组件 */
function handleUpdateValue() {
  emit('update:modelValue', [...tableData.value]);
}

/** 格式化金额显示 */
function formatAmount(value: number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  return Number(value).toFixed(2);
}

/** 获取状态文本 */
function getStatusText(status: number | undefined): string {
  if (status === undefined || status === null) return '';
  return PAYMENT_STATUS_MAP[status] || '';
}

/** 将字符串转为 dayjs 对象，空值返回 undefined */
function toDayjs(value: string | undefined | null): any {
  if (!value) return undefined;
  return dayjs(value);
}

// 顶部按钮配置
const topActions = computed(() => {
  if (props.readonly) return [];
  return [
    {
      label: '新增计划',
      type: 'primary' as const,
      onClick: handleAdd,
    },
  ];
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: usePaymentPlanColumns(props.readonly),
    data: tableData.value,
    height: undefined,
    maxHeight: undefined,
    border: true,
    showOverflow: true,
    autoResize: true,
    keepSource: true,
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
  } as VxeTableGridOptions<PaymentPlan>,
});

/** 监听 readonly 变化，动态更新列配置 */
watch(
  () => props.readonly,
  async (readonly) => {
    await nextTick();
    const columns = usePaymentPlanColumns(readonly);
    if (columns) {
      gridApi.grid.reloadColumn(columns);
    }
  },
);

/** 监听外部传入的数据变化 */
watch(
  () => props.modelValue,
  async (plans) => {
    if (!plans) return;
    await nextTick();
    tableData.value = [...plans];
    await gridApi.grid.reloadData(tableData.value);
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="payment-plan-list">
    <!-- 操作按钮区域 -->
    <div v-if="topActions.length > 0" class="mb-2 flex justify-end">
      <TableAction :actions="topActions" />
    </div>

    <!-- 计划表格 -->
    <div>
      <Grid class="w-full">
        <!-- 期次 -->
        <template #period="{ row }">
          <input
            v-if="!props.readonly"
            type="number"
            step="1"
            min="1"
            :value="row.period"
            class="cell-input text-center"
            placeholder="期次"
            @input="updateField(row, 'period', Number(($event.target as HTMLInputElement).value) || 1)"
          />
          <span v-else>{{ row.period }}</span>
        </template>

        <!-- 计划金额 -->
        <template #planAmount="{ row }">
          <input
            v-if="!props.readonly"
            type="number"
            step="0.01"
            :value="row.planAmount"
            class="cell-input text-right"
            placeholder="0.00"
            @input="updateField(row, 'planAmount', Number(($event.target as HTMLInputElement).value) || 0)"
          />
          <span v-else>{{ formatAmount(row.planAmount) }}</span>
        </template>

        <!-- 计划日期 -->
        <template #planDate="{ row }">
          <DatePicker
            v-if="!props.readonly"
            :value="toDayjs(row.planDate)"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="cell-date-picker"
            placeholder="请选择日期"
            @change="(val: any) => updateField(row, 'planDate', val || '')"
          />
          <span v-else>{{ row.planDate || '' }}</span>
        </template>

        <!-- 实际金额 -->
        <template #actualAmount="{ row }">
          <input
            v-if="!props.readonly"
            type="number"
            step="0.01"
            :value="row.actualAmount"
            class="cell-input text-right"
            placeholder="实际金额"
            @input="updateField(row, 'actualAmount', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          />
          <span v-else>{{ formatAmount(row.actualAmount) }}</span>
        </template>

        <!-- 实际日期 -->
        <template #actualDate="{ row }">
          <DatePicker
            v-if="!props.readonly"
            :value="toDayjs(row.actualDate)"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="cell-date-picker"
            placeholder="请选择日期"
            @change="(val: any) => updateField(row, 'actualDate', val || '')"
          />
          <span v-else>{{ row.actualDate || '' }}</span>
        </template>

        <!-- 状态 -->
        <template #status="{ row }">
          <Select
            v-if="!props.readonly"
            :value="row.status"
            :options="statusOptions"
            class="cell-select"
            placeholder="请选择状态"
            @change="(val: any) => updateField(row, 'status', val)"
          />
          <span v-else>{{ getStatusText(row.status) }}</span>
        </template>

        <!-- 备注 -->
        <template #remark="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.remark"
            class="cell-input"
            placeholder="备注"
            @input="updateField(row, 'remark', ($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ row.remark }}</span>
        </template>

        <!-- 操作 -->
        <template #actions="{ row }">
          <TableAction
            v-if="!props.readonly"
            :actions="[
              {
                label: '删除',
                type: 'link',
                danger: true,
                popConfirm: {
                  title: '确定要删除这条计划吗？',
                  confirm: () => handleDelete(row),
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
.payment-plan-list {
  width: 100%;
}

.payment-plan-list :deep(.vxe-grid) {
  height: auto !important;
  max-height: none !important;
  padding-right: 0 !important;
  padding-left: 0 !important;
}

.payment-plan-list > div {
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

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.cell-date-picker {
  width: 100%;
}

.cell-select {
  width: 100%;
  min-width: 100px;
}
</style>

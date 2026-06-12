<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ContractDetail } from '#/api/oa/contract';

import { computed, nextTick, ref, watch } from 'vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  calculateAmount,
  createContractDetail,
  useContractDetailColumns,
} from './data';

interface Props {
  /** 合同明细列表 */
  modelValue?: ContractDetail[];
  /** 是否只读 */
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: ContractDetail[]];
}>();

/** 表格内部数据 */
const tableData = ref<ContractDetail[]>([]);

/** 更新指定行的字段 */
function updateField(
  row: ContractDetail,
  field: keyof ContractDetail,
  value: any,
) {
  const index = tableData.value.findIndex(
    (item) =>
      (item.id && item.id === row.id) ||
      (item.rowKey && item.rowKey === row.rowKey),
  );
  if (index !== -1) {
    (tableData.value[index] as any)[field] = value;
    // 如果修改了数量或单价，自动计算金额
    if (field === 'quantity' || field === 'unitPrice') {
      tableData.value[index]!.amount = calculateAmount(
        tableData.value[index]!.quantity,
        tableData.value[index]!.unitPrice,
      );
    }
    handleUpdateValue();
  }
}

/** 添加明细行 */
function handleAdd() {
  const detail = createContractDetail(tableData.value.length + 1);
  tableData.value.push(detail);
  handleUpdateValue();
}

/** 删除明细行 */
function handleDelete(row: ContractDetail) {
  const index = tableData.value.findIndex(
    (item) =>
      (item.id && item.id === row.id) ||
      (item.rowKey && item.rowKey === row.rowKey),
  );
  if (index !== -1) {
    tableData.value.splice(index, 1);
    // 重新排序
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
  if (value === undefined || value === null) return '0.00';
  return Number(value).toFixed(2);
}

// 顶部按钮配置
const topActions = computed(() => {
  if (props.readonly) return [];
  return [
    {
      label: '添加明细行',
      type: 'primary' as const,
      onClick: handleAdd,
    },
  ];
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useContractDetailColumns(props.readonly),
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
  } as VxeTableGridOptions<ContractDetail>,
});

/** 监听 readonly 变化，动态更新列配置 */
watch(
  () => props.readonly,
  async (readonly) => {
    await nextTick();
    const columns = useContractDetailColumns(readonly);
    if (columns) {
      gridApi.grid.reloadColumn(columns);
    }
  },
);

/** 监听外部传入的数据变化 */
watch(
  () => props.modelValue,
  async (details) => {
    if (!details) return;
    await nextTick();
    tableData.value = [...details];
    await gridApi.grid.reloadData(tableData.value);
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="contract-detail-list">
    <!-- 操作按钮区域 -->
    <div v-if="topActions.length > 0" class="mb-2 flex justify-end">
      <TableAction :actions="topActions" />
    </div>

    <!-- 明细表格 -->
    <div>
      <Grid class="w-full">
        <!-- 项目/产品名称 -->
        <template #productName="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.productName"
            class="cell-input"
            placeholder="请输入"
            @input="updateField(row, 'productName', ($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ row.productName }}</span>
        </template>

        <!-- 规格型号 -->
        <template #specification="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.specification"
            class="cell-input"
            placeholder="请输入"
            @input="updateField(row, 'specification', ($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ row.specification }}</span>
        </template>

        <!-- 单位 -->
        <template #unit="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.unit"
            class="cell-input"
            placeholder="单位"
            @input="updateField(row, 'unit', ($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ row.unit }}</span>
        </template>

        <!-- 数量 -->
        <template #quantity="{ row }">
          <input
            v-if="!props.readonly"
            type="number"
            step="0.0001"
            :value="row.quantity"
            class="cell-input text-right"
            placeholder="数量"
            @input="updateField(row, 'quantity', Number(($event.target as HTMLInputElement).value) || 0)"
          />
          <span v-else>{{ row.quantity?.toFixed(4) }}</span>
        </template>

        <!-- 单价 -->
        <template #unitPrice="{ row }">
          <input
            v-if="!props.readonly"
            type="number"
            step="0.01"
            :value="row.unitPrice"
            class="cell-input text-right"
            placeholder="0.00"
            @input="updateField(row, 'unitPrice', Number(($event.target as HTMLInputElement).value) || 0)"
          />
          <span v-else>{{ formatAmount(row.unitPrice) }}</span>
        </template>

        <!-- 金额（只读，自动计算） -->
        <template #amount="{ row }">
          <span>{{ formatAmount(row.amount) }}</span>
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
                  title: '确定要删除这条明细吗？',
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
.contract-detail-list {
  width: 100%;
}

.contract-detail-list :deep(.vxe-grid) {
  height: auto !important;
  max-height: none !important;
  padding-right: 0 !important;
  padding-left: 0 !important;
}

.contract-detail-list > div {
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
</style>

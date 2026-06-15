<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TravelApplyBillApi } from '#/api/oa/travel';

import { computed, nextTick, ref, watch } from 'vue';

import { DatePicker, Select } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  createItineraryDetail,
  TRANSPORT_TYPE_OPTIONS,
  useItineraryDetailColumns,
} from './data';

interface Props {
  modelValue?: TravelApplyBillApi.TravelItinerary[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: TravelApplyBillApi.TravelItinerary[]];
}>();

const tableData = ref<TravelApplyBillApi.TravelItinerary[]>([]);

function updateField(
  row: TravelApplyBillApi.TravelItinerary,
  field: keyof TravelApplyBillApi.TravelItinerary,
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

function handleAdd() {
  const detail = createItineraryDetail(tableData.value.length + 1);
  tableData.value.push(detail);
  handleUpdateValue();
}

function handleDelete(row: TravelApplyBillApi.TravelItinerary) {
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

function handleUpdateValue() {
  emit('update:modelValue', [...tableData.value]);
}

function getTransportLabel(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  const option = TRANSPORT_TYPE_OPTIONS.find((opt) => opt.value === value);
  return option ? (option.label as string) : String(value);
}

const topActions = computed(() => {
  if (props.readonly) return [];
  return [
    {
      label: '添加行程',
      type: 'primary' as const,
      onClick: handleAdd,
    },
  ];
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useItineraryDetailColumns(props.readonly),
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
  } as VxeTableGridOptions<TravelApplyBillApi.TravelItinerary>,
});

watch(
  () => props.readonly,
  async (readonly) => {
    await nextTick();
    const columns = useItineraryDetailColumns(readonly);
    if (columns) {
      gridApi.grid.reloadColumn(columns);
    }
  },
);

watch(
  () => props.modelValue,
  async (itineraries) => {
    if (!itineraries) return;
    await nextTick();
    tableData.value = [...itineraries];
    await gridApi.grid.reloadData(tableData.value);
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="itinerary-detail-list">
    <div v-if="topActions.length > 0" class="mb-2 flex justify-end">
      <TableAction :actions="topActions" />
    </div>

    <div>
      <Grid class="w-full">
        <!-- 出发城市 -->
        <template #departureCity="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.departureCity"
            class="cell-input"
            placeholder="请输入"
            @input="updateField(row, 'departureCity', ($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ row.departureCity }}</span>
        </template>

        <!-- 到达城市 -->
        <template #destinationCity="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.destinationCity"
            class="cell-input"
            placeholder="请输入"
            @input="updateField(row, 'destinationCity', ($event.target as HTMLInputElement).value)"
          />
          <span v-else>{{ row.destinationCity }}</span>
        </template>

        <!-- 开始日期 -->
        <template #startDate="{ row }">
          <DatePicker
            v-if="!props.readonly"
            :value="row.startDate || undefined"
            class="cell-date-picker"
            placeholder="请选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="(val: string) => updateField(row, 'startDate', val)"
          />
          <span v-else>{{ row.startDate }}</span>
        </template>

        <!-- 结束日期 -->
        <template #endDate="{ row }">
          <DatePicker
            v-if="!props.readonly"
            :value="row.endDate || undefined"
            class="cell-date-picker"
            placeholder="请选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="(val: string) => updateField(row, 'endDate', val)"
          />
          <span v-else>{{ row.endDate }}</span>
        </template>

        <!-- 交通方式 -->
        <template #transportType="{ row }">
          <Select
            v-if="!props.readonly"
            :value="row.transportType !== undefined && row.transportType !== null ? row.transportType : undefined"
            class="cell-select"
            placeholder="请选择"
            :options="TRANSPORT_TYPE_OPTIONS"
            @change="(val: number) => updateField(row, 'transportType', val)"
          />
          <span v-else>{{ getTransportLabel(row.transportType) }}</span>
        </template>

        <!-- 备注 -->
        <template #remark="{ row }">
          <input
            v-if="!props.readonly"
            :value="row.remark"
            class="cell-input"
            placeholder="请输入"
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
                  title: '确定要删除这条行程明细吗？',
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
.itinerary-detail-list {
  width: 100%;
}

.itinerary-detail-list :deep(.vxe-grid) {
  height: auto !important;
  max-height: none !important;
  padding-right: 0 !important;
  padding-left: 0 !important;
}

.itinerary-detail-list > div {
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
</style>

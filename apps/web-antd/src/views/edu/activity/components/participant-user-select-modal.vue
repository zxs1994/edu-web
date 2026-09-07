<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  queryParticipantUserSelectPage,
  useParticipantUserSelectColumns,
  useParticipantUserSelectFormSchema,
} from './participant-user-select-data';

const GRID_ID = 'edu-activity-participant-user-select-grid';

const emit = defineEmits<{
  (e: 'select', users: SystemUserApi.User[]): void;
}>();

/** 已选用户 ID（唯一真相，仅由传入参数和用户操作变更） */
const checkedUserIds = ref<Set<number>>(new Set());
/** 已选用户详情（从表格行数据补充） */
const checkedUserMap = ref<Map<number, SystemUserApi.User>>(new Map());
const isRestoring = ref(false);

function toUserId(id: unknown): number | null {
  if (id == null || id === '') {
    return null;
  }
  const num = Number(id);
  return Number.isNaN(num) ? null : num;
}

function toRowKey(id: number) {
  return encodeURIComponent(String(id));
}

function handleCheckboxChange({
  row,
  checked,
}: {
  row: SystemUserApi.User;
  checked: boolean;
}) {
  if (isRestoring.value) {
    return;
  }
  const userId = toUserId(row?.id);
  if (userId == null) {
    return;
  }
  const newMap = new Map(checkedUserMap.value);
  const newIds = new Set(checkedUserIds.value);
  if (checked) {
    newMap.set(userId, row);
    newIds.add(userId);
  } else {
    newMap.delete(userId);
    newIds.delete(userId);
  }
  checkedUserMap.value = newMap;
  checkedUserIds.value = newIds;
}

function handleCheckboxAll({ checked }: { checked: boolean }) {
  if (isRestoring.value) {
    return;
  }
  const grid = gridApi.grid;
  if (!grid) {
    return;
  }
  const rows = (grid.getData?.() ?? []) as SystemUserApi.User[];
  const newMap = new Map(checkedUserMap.value);
  const newIds = new Set(checkedUserIds.value);
  rows.forEach((row) => {
    const userId = toUserId(row.id);
    if (userId == null) {
      return;
    }
    if (checked) {
      newMap.set(userId, row);
      newIds.add(userId);
    } else {
      newMap.delete(userId);
      newIds.delete(userId);
    }
  });
  checkedUserMap.value = newMap;
  checkedUserIds.value = newIds;
}

function resetCheckedState() {
  checkedUserIds.value = new Set();
  checkedUserMap.value = new Map();
}

function initCheckedUserIds(userIds: number[]) {
  resetCheckedState();
  const normalizedIds = userIds
    .map((id) => toUserId(id))
    .filter((id): id is number => id != null);
  checkedUserIds.value = new Set(normalizedIds);
}

async function clearGridCheckboxState() {
  const grid = gridApi.grid;
  if (!grid) {
    return;
  }
  isRestoring.value = true;
  try {
    await grid.setAllCheckboxRow?.(false);
    await grid.clearCheckboxReserve?.();
  } finally {
    await nextTick();
    isRestoring.value = false;
  }
}

async function restoreCheckboxSelection() {
  const grid = gridApi.grid;
  if (!grid || checkedUserIds.value.size === 0) {
    return;
  }
  isRestoring.value = true;
  try {
    await nextTick();
    await grid.setAllCheckboxRow?.(false);

    const rows = (grid.getData?.() ?? []) as SystemUserApi.User[];
    const newMap = new Map(checkedUserMap.value);
    const keys: string[] = [];

    rows.forEach((row) => {
      const userId = toUserId(row.id);
      if (userId != null && checkedUserIds.value.has(userId)) {
        newMap.set(userId, row);
        keys.push(toRowKey(userId));
      }
    });
    checkedUserMap.value = newMap;

    if (keys.length > 0) {
      await grid.setCheckboxRowKey?.(keys, true);
    }
  } finally {
    await nextTick();
    isRestoring.value = false;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  separator: false,
  formOptions: {
    schema: useParticipantUserSelectFormSchema(),
    submitOnChange: true,
    collapsed: false,
    // 筛选项每行列数：小屏 1 / 中屏 2 / 大屏 3（可按需改）
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  },
  gridOptions: {
    id: GRID_ID,
    columns: useParticipantUserSelectColumns(),
    height: 630,
    keepSource: true,
    toolbarConfig: {
      enabled: false,
      refresh: false,
      zoom: false,
      custom: false,
      search: false,
    },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page }, formValues) => {
          return await queryParticipantUserSelectPage(page, formValues);
        },
        querySuccess: () => {
          restoreCheckboxSelection();
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    checkboxConfig: {
      highlight: true,
      range: true,
      reserve: false,
      // 点击整行切换勾选
      trigger: 'row',
    },
    pagerConfig: {
      enabled: true,
    },
  } as VxeTableGridOptions<SystemUserApi.User>,
  gridEvents: {
    checkboxChange: handleCheckboxChange,
    checkboxAll: handleCheckboxAll,
  },
});

const [Modal, modalApi] = useVbenModal({
  title: '选择参与人',
  class: 'participant-user-select-modal w-4/5 max-w-6xl',
  destroyOnClose: true,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetCheckedState();
      await clearGridCheckboxState();
      return;
    }
    const data = modalApi.getData<{ userIds?: number[] }>();
    const userIds = [...(data?.userIds ?? [])];
    modalApi.lock();
    try {
      await clearGridCheckboxState();
      initCheckedUserIds(userIds);
      await nextTick();
      await gridApi.query();
    } finally {
      modalApi.unlock();
    }
  },
  async onConfirm() {
    // if (checkedUserIds.value.size === 0) {
    //   message.warning('请至少选择一位参与人');
    //   return false;
    // }
    const users = [...checkedUserIds.value]
      .map((id) => checkedUserMap.value.get(id))
      .filter((user): user is SystemUserApi.User => user != null);
    // if (users.length === 0) {
    //   message.warning('请至少选择一位参与人');
    //   return false;
    // }
    emit('select', users);
    resetCheckedState();
    await clearGridCheckboxState();
    await modalApi.close();
    return true;
  },
});

function openSelect(userIds?: number[]) {
  modalApi.setData({ userIds: userIds ?? [] }).open();
}

defineExpose({
  modalApi,
  openSelect,
});
</script>

<template>
  <Modal>
    <Grid>
      <template #table-title />
    </Grid>
  </Modal>
</template>

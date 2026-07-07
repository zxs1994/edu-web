<script lang="ts" setup>
import { computed } from 'vue';

import { Tag } from 'ant-design-vue';

import {
  getTaskBillStatusMeta,
  type TaskBillStatusTab,
} from '#/utils/bpm-bill-status';

const props = defineProps<{
  record: any;
  tab: TaskBillStatusTab;
}>();

const statusMeta = computed(() =>
  getTaskBillStatusMeta(props.record, props.tab),
);
</script>

<template>
  <Tag :color="statusMeta.color">{{ statusMeta.label }}</Tag>
</template>

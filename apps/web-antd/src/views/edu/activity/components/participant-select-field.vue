<script lang="ts" setup>
import type { Ref } from 'vue';

import { computed } from 'vue';

import { Button, Popover, Tag } from 'ant-design-vue';

import {
  PARTICIPANT_TAG_VISIBLE_LIMIT,
  sliceTagsForDisplay,
  splitParticipantDisplayNames,
} from './participant-user-select-data';

const modelValue = defineModel<string>({ default: '' });

const props = defineProps<{
  onSelect?: () => void;
  readonly?: boolean | Ref<boolean>;
}>();

const isReadonly = computed(() => {
  const readonly = props.readonly;
  return typeof readonly === 'object' ? readonly.value : !!readonly;
});

const splitNames = computed(() =>
  splitParticipantDisplayNames(modelValue.value ?? ''),
);

const participantRows = computed(() => {
  const { teachers, students } = splitNames.value;
  return [
    {
      key: 'teacher',
      label: '教培',
      tags: teachers,
      ...sliceTagsForDisplay(teachers, PARTICIPANT_TAG_VISIBLE_LIMIT.teachers),
    },
    {
      key: 'student',
      label: '学生',
      tags: students,
      ...sliceTagsForDisplay(students, PARTICIPANT_TAG_VISIBLE_LIMIT.students),
    },
  ];
});

const hasParticipants = computed(() =>
  participantRows.value.some((row) => row.tags.length > 0),
);

function handleSelect() {
  if (isReadonly.value) {
    return;
  }
  props.onSelect?.();
}
</script>

<template>
  <div
    class="participant-select-field w-full rounded-lg border border-dashed border-gray-300 px-3 py-2"
    :class="{
      'cursor-pointer hover:border-primary': !isReadonly,
      'bg-gray-50': isReadonly,
    }"
    @click="handleSelect"
  >
    <div class="flex flex-col gap-2">
      <div
        v-for="row in participantRows"
        :key="row.key"
        class="flex items-start gap-2"
      >
        <span class="w-10 shrink-0 text-sm text-gray-500">{{ row.label }}</span>
        <div class="flex min-h-6 flex-1 flex-wrap gap-1">
          <Tag
            v-for="(name, index) in row.visible"
            :key="`${row.key}-${name}-${index}`"
          >
            {{ name }}
          </Tag>
          <Popover v-if="row.overflow.length" placement="bottomLeft" trigger="click">
            <template #content>
              <div class="max-h-60 max-w-md overflow-y-auto py-1">
                <div class="mb-1 text-xs text-gray-500">
                  共 {{ row.tags.length }} 人
                </div>
                <div class="flex flex-wrap gap-1">
                  <Tag
                    v-for="(name, index) in row.tags"
                    :key="`${row.key}-all-${name}-${index}`"
                  >
                    {{ name }}
                  </Tag>
                </div>
              </div>
            </template>
            <Tag
              class="cursor-pointer border-dashed"
              color="processing"
              @click.stop
            >
              +{{ row.overflow.length }} 人
            </Tag>
          </Popover>
          <span v-if="row.tags.length === 0" class="text-sm text-gray-400">
            暂无
          </span>
        </div>
        <span class="shrink-0 text-xs text-gray-400">{{ row.tags.length }}人</span>
      </div>
    </div>

    <div v-if="!hasParticipants && !isReadonly" class="mt-1 text-sm text-gray-400">
      请选择参与人（学生/教培）
    </div>

    <!-- <div v-if="!isReadonly" class="mt-2 flex justify-end">
      <Button type="link" size="small" class="px-0" @click.stop="handleSelect">
        选择
      </Button>
    </div> -->
  </div>
</template>

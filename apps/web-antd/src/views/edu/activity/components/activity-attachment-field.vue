<script lang="ts" setup>
import type { Ref } from 'vue';
import type { UploadFile } from 'ant-design-vue';

import { computed, ref, watch } from 'vue';

import { Button, Upload } from 'ant-design-vue';

import { useUpload } from '#/components/upload/use-upload';

export interface ActivityAttachmentItem {
  fileName: string;
  fileUrl: string;
}

const modelValue = defineModel<ActivityAttachmentItem[]>({
  default: () => [],
});

const props = withDefaults(
  defineProps<{
    disabled?: boolean | Ref<boolean>;
    maxCount?: number;
  }>(),
  {
    maxCount: 10,
  },
);

const { httpRequest } = useUpload('activity');
const fileList = ref<UploadFile[]>([]);

const isDisabled = computed(() => {
  const disabled = props.disabled;
  return typeof disabled === 'object' ? !!disabled.value : !!disabled;
});

function buildFileList(attachments?: ActivityAttachmentItem[]): UploadFile[] {
  if (!attachments?.length) {
    return [];
  }
  return attachments.map((item, index) => ({
    uid: `${index}-${item.fileUrl}`,
    name: item.fileName,
    status: 'done' as const,
    url: item.fileUrl,
  }));
}

function toAttachments(list?: UploadFile[]): ActivityAttachmentItem[] {
  return (list ?? [])
    .filter((file) => file.status === 'done' || file.status === 'success')
    .map((file) => ({
      fileName: file.name || '附件',
      fileUrl: file.url || (file.response as { url?: string })?.url || '',
    }))
    .filter((item) => item.fileUrl);
}

function sameAttachments(
  a?: ActivityAttachmentItem[],
  b?: ActivityAttachmentItem[],
) {
  const left = a ?? [];
  const right = b ?? [];
  if (left.length !== right.length) {
    return false;
  }
  return left.every(
    (item, index) =>
      item.fileUrl === right[index]?.fileUrl &&
      item.fileName === right[index]?.fileName,
  );
}

/** 仅从外部值回填列表，避免与上传变更互相监听 */
watch(
  () => modelValue.value,
  (list) => {
    const next = toAttachments(fileList.value);
    if (sameAttachments(list, next)) {
      return;
    }
    fileList.value = buildFileList(list);
  },
  { immediate: true },
);

function syncModelFromFileList() {
  const next = toAttachments(fileList.value);
  if (!sameAttachments(modelValue.value, next)) {
    modelValue.value = next;
  }
}

function handleChange() {
  syncModelFromFileList();
}

function handleRemove() {
  // 删除后下一拍再同步，确保 fileList 已更新
  queueMicrotask(() => syncModelFromFileList());
}

async function customUpload(option: any) {
  try {
    const result = await httpRequest(option.file as File);
    // 写入 url，便于列表回显与保存 fileUrl
    if (option.file && result?.url) {
      option.file.url = result.url;
    }
    option.onSuccess?.(result);
    syncModelFromFileList();
  } catch (error) {
    option.onError?.(error);
  }
}
</script>

<template>
  <Upload
    v-model:file-list="fileList"
    :custom-request="customUpload"
    :disabled="isDisabled"
    :max-count="maxCount"
    multiple
    @change="handleChange"
    @remove="handleRemove"
  >
    <Button v-if="!isDisabled" type="default">上传附件</Button>
  </Upload>
</template>

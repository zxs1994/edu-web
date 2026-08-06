<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AttachmentApi } from '#/api/common/attachment';

import { computed, nextTick, ref, watch } from 'vue';

import { Button, message, Modal } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { useUpload } from '#/components/upload/use-upload';
import {
  downloadAttachmentFile,
  extractUploadPath,
  extractUploadUrl,
  isBlobAttachmentUrl,
  isTextPreviewFile,
  isTxtAttachment,
  previewTextAttachment,
  resolveAttachmentAccessUrl,
} from '#/utils/attachment-url';

import {
  createAttachment,
  useAttachmentActions,
  useAttachmentColumns,
} from './data';

interface Props {
  /** 附件列表 */
  modelValue?: AttachmentApi.AttachmentSaveReq[];
  /** 是否只读 */
  readonly?: boolean;
  /** 最大文件数量 */
  maxCount?: number;
  /** 允许的文件类型 */
  accept?: string;
  /** 最大文件大小（MB） */
  maxSize?: number;
  /** 隐藏上传按钮（当需要在外部自定义按钮位置时使用） */
  hideUploadButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  readonly: false,
  maxCount: 20,
  accept: '*',
  maxSize: 10,
  hideUploadButton: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: AttachmentApi.AttachmentSaveReq[]];
}>();

/** 表格内部数据 */
const tableData = ref<AttachmentApi.AttachmentSaveReq[]>([]);
const { httpRequest } = useUpload('oa/attachment');
const IMAGE_EXTENSIONS = new Set([
  'bmp',
  'gif',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp',
]);
const imagePreviewVisible = ref(false);
const imagePreviewItems = ref<{ fileName: string; url: string }[]>([]);
const imagePreviewIndex = ref(0);
const currentPreviewItem = computed(
  () => imagePreviewItems.value[imagePreviewIndex.value] || null,
);
const hasPrevImage = computed(() => imagePreviewIndex.value > 0);
const hasNextImage = computed(
  () => imagePreviewIndex.value < imagePreviewItems.value.length - 1,
);

function getAttachmentExtension(row: AttachmentApi.AttachmentSaveReq) {
  return (
    row.fileExtension ||
    row.fileName?.split('.').pop() ||
    ''
  ).toLowerCase();
}

function isImageAttachment(row: AttachmentApi.AttachmentSaveReq) {
  return IMAGE_EXTENSIONS.has(getAttachmentExtension(row));
}

function resolveImagePreviewItems() {
  return tableData.value
    .map((item) => ({
      id: item.id,
      fileName: item.fileName || '图片',
      fileExtension: item.fileExtension,
      uploadTime: item.uploadTime,
      url: getAttachmentAccessUrl(item),
    }))
    .filter((item) => !!item.url);
}

function openImagePreview(row: AttachmentApi.AttachmentSaveReq) {
  const items = resolveImagePreviewItems().filter((item) =>
    IMAGE_EXTENSIONS.has(
      (
        item.fileExtension ||
        item.fileName.split('.').pop() ||
        ''
      ).toLowerCase(),
    ),
  );
  if (items.length === 0) {
    message.warning('暂无可预览的图片附件');
    return;
  }
  const currentUrl = getAttachmentAccessUrl(row);
  const targetIndex = items.findIndex(
    (item) =>
      (!!item.id && !!row.id && item.id === row.id) ||
      (item.fileName === row.fileName && item.uploadTime === row.uploadTime) ||
      item.url === currentUrl,
  );
  imagePreviewItems.value = items.map((item) => ({
    fileName: item.fileName,
    url: item.url,
  }));
  imagePreviewIndex.value = targetIndex === -1 ? 0 : targetIndex;
  imagePreviewVisible.value = true;
}

function handleCloseImagePreview() {
  imagePreviewVisible.value = false;
}

function handlePrevImage() {
  if (hasPrevImage.value) {
    imagePreviewIndex.value -= 1;
  }
}

function handleNextImage() {
  if (hasNextImage.value) {
    imagePreviewIndex.value += 1;
  }
}

function getAttachmentAccessUrl(row: AttachmentApi.AttachmentSaveReq) {
  return resolveAttachmentAccessUrl(row);
}

function warnInvalidAttachmentUrl(row: AttachmentApi.AttachmentSaveReq) {
  if (isBlobAttachmentUrl(row.fileUrl) || isBlobAttachmentUrl(row.filePath)) {
    message.warning('附件为历史临时地址，请重新上传后保存');
    return;
  }
  message.warning('附件地址无效');
}

/** 添加附件 */
async function handleAdd(file: File) {
  try {
    const uploadResult = await httpRequest(file);
    const url = extractUploadUrl(uploadResult);
    if (!url) {
      throw new Error('上传未返回文件地址');
    }
    const attachment = createAttachment(file, tableData.value.length + 1);
    attachment.fileUrl = url;
    attachment.filePath = extractUploadPath(uploadResult) || url;
    tableData.value.push(attachment);
    handleUpdateValue();
    message.success('文件上传成功');
  } catch (error) {
    console.error('文件上传失败:', error);
    message.error('文件上传失败');
  }
}

/** 删除附件 */
function handleDelete(row: AttachmentApi.AttachmentSaveReq) {
  const index = tableData.value.findIndex(
    (item) =>
      (item.id && item.id === row.id) ||
      (item.fileName === row.fileName && item.uploadTime === row.uploadTime),
  );
  if (index !== -1) {
    tableData.value.splice(index, 1);
    // 重新排序
    tableData.value.forEach((item, idx) => {
      item.sortOrder = idx + 1;
    });
    handleUpdateValue();
    message.success('删除成功');
  }
}

/** 预览附件 */
async function handlePreview(row: AttachmentApi.AttachmentSaveReq) {
  if (isTxtAttachment(row)) {
    message.info('txt 文件不支持在线预览，请下载后查看');
    return;
  }
  const url = getAttachmentAccessUrl(row);
  if (!url) {
    warnInvalidAttachmentUrl(row);
    return;
  }
  if (isTextPreviewFile(row)) {
    try {
      await previewTextAttachment(row);
    } catch (error) {
      console.error('文本预览失败:', error);
      message.error('文本预览失败');
    }
    return;
  }
  if (isImageAttachment(row)) {
    openImagePreview(row);
    return;
  }
  window.open(url, '_blank');
}

/** 下载附件 */
async function handleDownload(row: AttachmentApi.AttachmentSaveReq) {
  if (!getAttachmentAccessUrl(row)) {
    warnInvalidAttachmentUrl(row);
    return;
  }
  try {
    await downloadAttachmentFile(row);
  } catch (error) {
    console.error('附件下载失败:', error);
    message.error('附件下载失败');
  }
}

/** 将最新数据写回并通知父组件 */
function handleUpdateValue() {
  emit('update:modelValue', [...tableData.value]);
}

/** 备注编辑完成后更新数据 */
function handleRemarkEdit() {
  handleUpdateValue();
}

// 文件验证和处理函数
function handleFileUpload(file: File) {
  // 检查文件大小
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize;
  if (!isLtMaxSize) {
    message.error(`文件大小不能超过 ${props.maxSize}MB`);
    return false;
  }

  // 检查文件数量
  if (tableData.value.length >= props.maxCount) {
    message.error(`最多只能上传 ${props.maxCount} 个文件`);
    return false;
  }

  // 添加文件到列表
  handleAdd(file);
  return false;
}

/** 触发文件选择（供外部调用） */
function handleTriggerUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = props.accept === '*' ? '' : props.accept;
  input.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      [...files].forEach((file) => {
        handleFileUpload(file);
      });
    }
  });
  input.click();
}

// 上传按钮配置
const uploadActions = computed(() => {
  if (
    props.readonly ||
    tableData.value.length >= props.maxCount ||
    props.hideUploadButton
  ) {
    return [];
  }

  return [
    {
      label: '上传附件',
      type: 'primary' as const,
      onClick: handleTriggerUpload,
    },
  ];
});

// 暴露方法给父组件
defineExpose({
  handleTriggerUpload,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    editConfig: {
      trigger: 'click',
      mode: 'cell',
    },
    columns: useAttachmentColumns(props.readonly),
    data: tableData.value,
    // 完全移除高度限制，让表格完全自适应
    height: undefined,
    maxHeight: undefined,
    border: true,
    showOverflow: true,
    autoResize: true,
    keepSource: true,
    // 禁用所有滚动相关配置
    scrollY: {
      enabled: false,
    },
    scrollX: {
      enabled: false,
    },
    // 禁用虚拟滚动
    virtualScrollY: false,
    virtualScrollX: false,
    rowConfig: {
      keyField: 'rowKey',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<AttachmentApi.AttachmentSaveReq>,
  gridEvents: {
    editClosed: handleRemarkEdit,
  },
});

/** 监听 readonly 变化，动态更新列配置 */
watch(
  () => props.readonly,
  async (readonly) => {
    await nextTick();
    // 重新设置列配置
    const columns = useAttachmentColumns(readonly);
    if (columns) {
      gridApi.grid.reloadColumn(columns);
    }
  },
);

/** 监听外部传入的数据变化 */
watch(
  () => props.modelValue,
  async (attachments) => {
    if (!attachments) {
      return;
    }
    await nextTick();
    tableData.value = [...attachments];
    await gridApi.grid.reloadData(tableData.value);
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>

<template>
  <div class="attachment-list">
    <!-- 上传区域 -->
    <div v-if="uploadActions.length > 0" class="mb-2 flex justify-end">
      <TableAction :actions="uploadActions" />
    </div>

    <!-- 附件列表 -->
    <div>
      <Grid class="w-full">
        <template #actions="{ row }">
          <TableAction
            :actions="
              useAttachmentActions(
                props.readonly,
                row,
                () => handlePreview(row),
                () => handleDownload(row),
                () => handleDelete(row),
              )
            "
          />
        </template>
      </Grid>
    </div>
    <Modal
      :open="imagePreviewVisible"
      :title="currentPreviewItem?.fileName || '图片预览'"
      :footer="null"
      width="70vw"
      @cancel="handleCloseImagePreview"
    >
      <div class="image-preview-wrap">
        <div class="image-preview-toolbar">
          <Button
            size="small"
            :disabled="!hasPrevImage"
            @click="handlePrevImage"
          >
            上一张
          </Button>
          <span class="image-preview-index">
            {{ imagePreviewIndex + 1 }} / {{ imagePreviewItems.length }}
          </span>
          <Button
            size="small"
            :disabled="!hasNextImage"
            @click="handleNextImage"
          >
            下一张
          </Button>
        </div>
        <div class="image-preview-body">
          <img
            v-if="currentPreviewItem"
            :src="currentPreviewItem.url"
            :alt="currentPreviewItem.fileName"
            class="preview-image"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.attachment-list {
  width: 100%;
}

.attachment-list :deep(.vxe-grid) {
  height: auto !important;
  max-height: none !important;
  padding-right: 0 !important;
  padding-left: 0 !important;
}

/* 确保按钮容器与表格对齐 */
.attachment-list > div {
  padding: 0;
  margin: 0;
}

.image-preview-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.image-preview-index {
  min-width: 70px;
  font-size: 13px;
  text-align: center;
}

.image-preview-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  max-height: 70vh;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
</style>

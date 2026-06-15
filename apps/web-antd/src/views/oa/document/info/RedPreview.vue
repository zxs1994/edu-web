<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  formData: Record<string, any>;
  templateData?: Record<string, any>;
}>();

/** 机关名称（来自模板或formData） */
const orgName = computed(() => {
  return props.templateData?.orgName || props.formData?.companyName || '机关名称';
});

/** 名称字号（来自模板，默认36） */
const nameFontSize = computed(() => {
  return props.templateData?.nameFontSize || 36;
});

/** 分隔线样式：single=单线 double=双线 */
const separatorStyle = computed(() => {
  return props.templateData?.separatorStyle || 'single';
});

/** 印章图片URL */
const sealImage = computed(() => {
  return props.templateData?.sealImage || '';
});

/** 公文标题 */
const docTitle = computed(() => {
  return props.formData?.docTitle || '(公文标题)';
});

/** 发文字号 */
const docNumberDisplay = computed(() => {
  const prefix = props.formData?.docNumberPrefix || '';
  const year = props.formData?.docNumberYear || '';
  const serial = props.formData?.docNumberSerial || '';
  if (prefix || year || serial) {
    return `${prefix}〔${year}〕${serial}号`;
  }
  return props.formData?.docNumber || '';
});

/** 正文内容 */
const docContent = computed(() => {
  return props.formData?.docContent || '(正文内容)';
});

/** 公司名称 */
const companyName = computed(() => {
  return props.formData?.companyName || '';
});

/** 发文日期 */
const issueDateDisplay = computed(() => {
  const d = props.formData?.issueDate;
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

/** 签发人 */
const signer = computed(() => {
  return props.formData?.signer || '';
});

/** 密级 */
const secrecyLabel = computed(() => {
  const map: Record<number, string> = { 0: '公开', 1: '内部', 2: '机密', 3: '绝密' };
  return map[props.formData?.secrecyLevel] || '';
});

/** 紧急程度 */
const urgencyLabel = computed(() => {
  const map: Record<number, string> = { 0: '普通', 1: '急件', 2: '特急' };
  return map[props.formData?.urgencyLevel] || '';
});
</script>

<template>
  <div class="red-preview-wrapper">
    <div class="red-preview-title">公文预览</div>
    <div class="red-preview-document">
      <!-- 红头区域 -->
      <div class="red-header">
        <div
          class="red-header-org-name"
          :style="{ fontSize: nameFontSize + 'px' }"
        >
          {{ orgName }}
        </div>
        <div class="red-header-doc-type">文 件</div>
        <div
          class="red-header-line"
          :class="{ 'red-header-line--double': separatorStyle === 'double' }"
        />
      </div>

      <!-- 发文字号 -->
      <div v-if="docNumberDisplay" class="red-doc-number">
        {{ docNumberDisplay }}
      </div>

      <!-- 密级和紧急程度 -->
      <div v-if="secrecyLabel || urgencyLabel" class="red-meta-row">
        <span v-if="secrecyLabel" class="red-meta-item">{{ secrecyLabel }}</span>
        <span v-if="urgencyLabel" class="red-meta-item">{{ urgencyLabel }}</span>
      </div>

      <!-- 标题 -->
      <div class="red-title">{{ docTitle }}</div>

      <!-- 正文 -->
      <div class="red-content">
        <div v-if="docContent && docContent !== '(正文内容)'" class="red-content-text">
          {{ docContent }}
        </div>
        <div v-else class="red-content-placeholder">（正文内容）</div>
      </div>

      <!-- 落款 + 印章 -->
      <div class="red-footer">
        <div class="red-footer-right">
          <div v-if="signer" class="red-footer-signer">签发人：{{ signer }}</div>
          <div class="red-footer-company">
            {{ companyName }}
            <img
              v-if="sealImage"
              :src="sealImage"
              class="red-seal-image"
              alt="印章"
            />
          </div>
          <div>{{ issueDateDisplay }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.red-preview-wrapper {
  position: sticky;
  top: 16px;
}

.red-preview-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: rgb(0 0 0 / 85%);
  padding-left: 10px;
  border-left: 4px solid hsl(var(--primary));
}

.red-preview-document {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
  padding: 40px 48px;
  min-height: 600px;
  font-family: '仿宋', 'FangSong', 'SimSun', serif;
}

/* 红头区域 */
.red-header {
  text-align: center;
  margin-bottom: 20px;
}

.red-header-org-name {
  font-weight: 700;
  letter-spacing: 4px;
  line-height: 1.4;
  color: #ff0000;
  font-family: '方正小标宋简体', 'STZhongsong', 'SimSun', serif;
}

.red-header-doc-type {
  font-size: 18px;
  letter-spacing: 8px;
  color: #333;
  margin-top: 4px;
}

.red-header-line {
  border-top: 3px solid #ff0000;
  margin-top: 16px;
}

.red-header-line--double {
  border-top: 3px double #ff0000;
}

/* 发文字号 */
.red-doc-number {
  text-align: center;
  font-size: 16px;
  color: #333;
  margin: 20px 0 12px;
  font-family: '仿宋', 'FangSong', serif;
}

/* 密级/紧急程度行 */
.red-meta-row {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.red-meta-item {
  padding: 2px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

/* 标题 */
.red-title {
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: #000;
  margin: 24px 0;
  line-height: 1.6;
  font-family: '方正小标宋简体', 'STZhongsong', 'SimSun', serif;
}

/* 正文 */
.red-content {
  font-size: 16px;
  line-height: 2;
  color: #333;
  min-height: 200px;
  text-indent: 2em;
  white-space: pre-wrap;
}

.red-content-placeholder {
  color: #ccc;
  text-align: center;
  text-indent: 0;
}

/* 落款 */
.red-footer {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
}

.red-footer-right {
  text-align: right;
  font-size: 16px;
  color: #333;
  line-height: 1.6;
}

.red-footer-signer {
  font-size: 14px;
  margin-bottom: 4px;
}

.red-footer-company {
  position: relative;
  display: inline-block;
}

.red-seal-image {
  position: absolute;
  right: -20px;
  top: -20px;
  width: 100px;
  height: 100px;
  object-fit: contain;
  opacity: 0.85;
}
</style>

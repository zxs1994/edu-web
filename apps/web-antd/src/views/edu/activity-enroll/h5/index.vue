<script lang="ts" setup>
import type { ActivityH5EnrollApi } from '#/api/edu/activity-enroll-h5';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccessStore } from '@vben/stores';
import { IconifyIcon } from '@vben/icons';

import {
  enrollByH5Token,
  getH5EnrollInfo,
} from '#/api/edu/activity-enroll-h5';

defineOptions({ name: 'EduActivityH5Enroll' });

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const route = useRoute();
const accessStore = useAccessStore();

const loading = ref(true);
const submitting = ref(false);
const error = ref<null | string>(null);
const info = ref<ActivityH5EnrollApi.EnrollInfo | null>(null);
const justEnrolled = ref(false);

const token = computed(() => {
  const fromPath = route.params.c;
  const pathVal = Array.isArray(fromPath) ? fromPath[0] : fromPath;
  if (pathVal != null && String(pathVal).trim()) {
    return String(pathVal).trim();
  }
  const raw = route.query.c;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value != null ? String(value).trim() : '';
});

const pageState = computed<'loading' | 'enroll' | 'done' | 'blocked' | 'error'>(
  () => {
    if (loading.value && !info.value) return 'loading';
    if (error.value && !info.value) return 'error';
    if (!info.value) return 'error';
    if (info.value.enrolled || justEnrolled.value) return 'done';
    if (info.value.canEnroll) return 'enroll';
    return 'blocked';
  },
);

const tip = computed(() => {
  if (justEnrolled.value) return '报名成功，请按时参加';
  if (info.value?.enrolled) return '您已报名，请按时参加';
  if (pageState.value === 'enroll') return '确认信息无误后即可报名';
  return info.value?.message || '当前暂不可报名';
});

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toParts(value?: Date | number[] | string) {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) {
    const [y, m, d, hh = 0, mm = 0] = value;
    if (y == null || m == null || d == null) return null;
    return { y, m, d, hh, mm };
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    hh: date.getHours(),
    mm: date.getMinutes(),
  };
}

const planView = computed(() => {
  const p = toParts(info.value?.plannedDate);
  if (!p) return null;
  const weekday = WEEKDAYS[new Date(p.y, p.m - 1, p.d).getDay()] ?? '';
  return {
    dateLine: `${p.y}年${p.m}月${p.d}日`,
    weekLine: `星期${weekday}`,
    timeLine: `${pad(p.hh)}:${pad(p.mm)}`,
  };
});

const enrollWindow = computed(() => {
  const s = toParts(info.value?.enrollStartTime);
  const e = toParts(info.value?.enrollEndTime);
  if (!s || !e) return null;
  const short = (p: NonNullable<ReturnType<typeof toParts>>) =>
    `${p.m}月${p.d}日 ${pad(p.hh)}:${pad(p.mm)}`;
  return `${short(s)} 至 ${short(e)}`;
});

const seatLine = computed(() => {
  const limit = info.value?.enrollLimit;
  if (limit == null || limit <= 0) return null;
  return `已报 ${info.value?.enrollCount ?? 0} / 限额 ${limit}`;
});

const ctaLabel = computed(() => {
  if (submitting.value) return '提交中…';
  if (pageState.value === 'done') return '已报名';
  if (pageState.value === 'blocked') return '暂不可报名';
  return '确认报名';
});

async function loadInfo() {
  loading.value = true;
  error.value = null;
  if (!token.value) {
    error.value = '报名链接无效，请从短信重新打开';
    info.value = null;
    loading.value = false;
    return;
  }
  try {
    const data = await getH5EnrollInfo(token.value);
    info.value = data;
    if (data?.tenantId != null) {
      accessStore.setTenantId(data.tenantId);
    }
  } catch (e: any) {
    error.value = e?.message || e?.msg || '加载报名信息失败';
    info.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleEnroll() {
  if (!token.value || pageState.value !== 'enroll' || submitting.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await enrollByH5Token(token.value);
    justEnrolled.value = true;
    await loadInfo();
  } catch (e: any) {
    error.value = e?.message || e?.msg || '报名失败，请稍后重试';
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadInfo();
});
</script>

<template>
  <div class="sheet" :data-state="pageState">
    <div class="sheet__sky" aria-hidden="true" />
    <div class="sheet__wave" aria-hidden="true" />

    <div class="sheet__body">
      <header class="sheet__brand">
        <span class="sheet__icon" aria-hidden="true">
          <IconifyIcon icon="lucide:calendar-check-2" />
        </span>
        <div class="sheet__brand-text">
          <p class="sheet__name">鲲鹏智航</p>
          <p class="sheet__sub">专项活动报名</p>
        </div>
      </header>

      <!-- loading -->
      <section v-if="pageState === 'loading'" class="sheet__block">
        <div class="skel skel--title" />
        <div class="skel skel--line" />
        <div class="skel skel--block" />
      </section>

      <!-- error -->
      <section v-else-if="pageState === 'error'" class="sheet__block is-center">
        <p class="sheet__emoji" aria-hidden="true">链接失效</p>
        <h1 class="sheet__title">打不开报名页</h1>
        <p class="sheet__desc">{{ error }}</p>
      </section>

      <!-- content -->
      <template v-else-if="info">
        <section class="sheet__block">
          <p v-if="info.userName" class="sheet__hi">
            {{ info.userName }}，你好
          </p>
          <h1 class="sheet__title">{{ info.activityName || '活动报名' }}</h1>
          <p class="sheet__meta">
            第 {{ info.periodNo ?? '-' }} 期
          </p>

          <div v-if="info.content" class="sheet__content">
            <p class="sheet__content-label">活动内容</p>
            <p class="sheet__content-body">{{ info.content }}</p>
          </div>

          <div v-if="planView" class="sheet__when">
            <div class="sheet__when-date">
              <strong>{{ planView.dateLine }}</strong>
              <span>{{ planView.weekLine }}</span>
            </div>
            <div class="sheet__when-time">{{ planView.timeLine }}</div>
          </div>

          <p v-if="enrollWindow" class="sheet__soft">
            报名开放：{{ enrollWindow }}
          </p>
          <p v-if="seatLine" class="sheet__soft">{{ seatLine }}</p>

          <p class="sheet__tip" :data-tone="pageState">{{ tip }}</p>
          <p v-if="error" class="sheet__err">{{ error }}</p>
        </section>
      </template>
    </div>

    <footer v-if="info" class="sheet__bar">
      <button
        type="button"
        class="sheet__cta"
        :disabled="pageState !== 'enroll' || submitting"
        :aria-busy="submitting"
        @click="handleEnroll"
      >
        <span v-if="pageState === 'done'" class="sheet__check" aria-hidden="true">
          ✓
        </span>
        {{ ctaLabel }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.sheet {
  --ink: #0f1c24;
  --muted: #667788;
  --line: rgb(15 28 36 / 8%);
  --teal: #0b6e6a;
  --teal-2: #12948e;
  --ok: #0f7a57;
  --warn: #8a641f;
  --danger: #c0392b;
  --paper: #f3f7f6;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  min-height: -webkit-fill-available;
  color: var(--ink);
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans SC',
    'Microsoft YaHei', sans-serif;
  background: var(--paper);
  overflow-x: hidden;
}

@supports (padding: constant(safe-area-inset-top)) {
  .sheet {
    --safe-top: constant(safe-area-inset-top);
    --safe-right: constant(safe-area-inset-right);
    --safe-bottom: constant(safe-area-inset-bottom);
    --safe-left: constant(safe-area-inset-left);
  }
}

@supports (padding: env(safe-area-inset-top)) {
  .sheet {
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-right: env(safe-area-inset-right, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --safe-left: env(safe-area-inset-left, 0px);
  }
}

.sheet__sky {
  position: absolute;
  inset: 0 0 auto 0;
  height: min(58vh, 420px);
  background:
    linear-gradient(165deg, #0b6e6a 0%, #147f90 48%, #2a6f9a 100%);
  clip-path: polygon(0 0, 100% 0, 100% 78%, 0 100%);
}

.sheet__wave {
  position: absolute;
  top: min(42vh, 300px);
  left: -10%;
  width: 120%;
  height: 120px;
  background: radial-gradient(
    ellipse at center,
    rgb(255 255 255 / 22%) 0%,
    transparent 70%
  );
  animation: float 7s ease-in-out infinite alternate;
  pointer-events: none;
}

.sheet__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  min-height: -webkit-fill-available;
  max-width: 440px;
  margin: 0 auto;
  padding-top: calc(22px + var(--safe-top));
  padding-right: calc(22px + var(--safe-right));
  /* 为底部固定按钮预留空间：按钮 54 + 上下内边距 + 安全区 */
  padding-bottom: calc(54px + 28px + var(--safe-bottom) + 16px);
  padding-left: calc(22px + var(--safe-left));
}

.sheet__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  color: #fff;
  text-align: center;
  animation: in 0.45s ease-out both;
}

.sheet__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  font-size: 24px;
  color: #0b6e6a;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 8px 20px rgb(0 0 0 / 12%);
}

.sheet__brand-text {
  display: grid;
  gap: 4px;
}

.sheet__name {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.15;
}

.sheet__sub {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.18em;
  opacity: 0.82;
}

.sheet__block {
  padding: 22px 20px 20px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 4px;
  box-shadow: 0 18px 40px rgb(15 28 36 / 10%);
  animation: in 0.5s 0.05s ease-out both;
}

.sheet__block.is-center {
  text-align: center;
  padding-top: 36px;
  padding-bottom: 36px;
}

.sheet__hi {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--muted);
}

.sheet__title {
  margin: 0;
  font-size: clamp(24px, 6.5vw, 30px);
  font-weight: 800;
  line-height: 1.28;
  letter-spacing: -0.02em;
}

.sheet__meta {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--teal);
}

.sheet__content {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  animation: in 0.5s 0.08s ease-out both;
}

.sheet__content-label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.sheet__content-body {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
}

.sheet__desc {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}

.sheet__emoji {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--danger);
}

.sheet__when {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  animation: in 0.5s 0.12s ease-out both;
}

.sheet__when-date {
  display: grid;
  gap: 4px;
}

.sheet__when-date strong {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.sheet__when-date span {
  font-size: 13px;
  color: var(--muted);
}

.sheet__when-time {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--teal);
  font-variant-numeric: tabular-nums;
}

.sheet__soft {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
}

.sheet__tip {
  margin: 18px 0 0;
  padding: 11px 12px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  border-radius: 2px;
  animation: in 0.45s 0.18s ease-out both;
}

.sheet__tip[data-tone='enroll'] {
  color: var(--teal);
  background: rgb(11 110 106 / 8%);
}

.sheet__tip[data-tone='done'] {
  color: var(--ok);
  background: rgb(15 122 87 / 9%);
}

.sheet__tip[data-tone='blocked'] {
  color: var(--warn);
  background: rgb(138 100 31 / 9%);
}

.sheet__err {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--danger);
}

.sheet__bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: 12px calc(22px + var(--safe-right)) calc(12px + var(--safe-bottom))
    calc(22px + var(--safe-left));
  background: linear-gradient(
    180deg,
    rgb(243 247 246 / 0%) 0%,
    var(--paper) 36%,
    var(--paper) 100%
  );
  animation: in 0.5s 0.2s ease-out both;
}

.sheet__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 54px;
  border: 0;
  border-radius: 4px;
  font: inherit;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #fff;
  background: linear-gradient(135deg, var(--teal) 0%, var(--teal-2) 100%);
  box-shadow: 0 14px 28px rgb(11 110 106 / 32%);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.15s ease;
}

.sheet__cta:active:not(:disabled) {
  transform: translateY(1px) scale(0.985);
  box-shadow: 0 8px 16px rgb(11 110 106 / 24%);
}

.sheet__cta:disabled {
  cursor: default;
  filter: grayscale(0.15);
  box-shadow: none;
  background: #d5dde3;
  color: #6a7884;
}

.sheet[data-state='done'] .sheet__cta:disabled {
  background: rgb(15 122 87 / 12%);
  color: var(--ok);
}

.sheet__check {
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  background: var(--ok);
  color: #fff;
}

.skel {
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    #e8eef0 0%,
    #f4f7f8 50%,
    #e8eef0 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

.skel--title {
  height: 28px;
  width: 72%;
  margin-bottom: 12px;
}

.skel--line {
  height: 14px;
  width: 40%;
  margin-bottom: 22px;
}

.skel--block {
  height: 72px;
  width: 100%;
}

@keyframes in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-3%);
  }
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
</style>

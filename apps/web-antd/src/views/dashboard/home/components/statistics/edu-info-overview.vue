<script lang="ts" setup>
import type { EduDashboardApi } from '#/api/edu/dashboard';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';

import { getEduOverview } from '#/api/edu/dashboard';

defineOptions({ name: 'EduInfoOverview' });

/** 与侧边栏菜单图标保持一致 */
const EDU_MENU_ICONS = {
  student: 'lucide:graduation-cap',
  teacher: 'lucide:presentation',
  activity: 'lucide:flag',
  budget: 'lucide:chart-pie',
} as const;

const { hasAccessByCodes } = useAccess();
const canView = computed(() =>
  hasAccessByCodes(['edu:dashboard:overview']),
);

const loading = ref(false);
const overview = ref<EduDashboardApi.Overview>({});

interface StatItem {
  key: string;
  title: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  value: number | null | undefined;
  placeholder: boolean;
}

const items = computed<StatItem[]>(() => [
  {
    key: 'student',
    title: '学员数',
    icon: EDU_MENU_ICONS.student,
    iconColor: '#2563eb',
    iconBg: 'rgb(37 99 235 / 10%)',
    value: overview.value.studentCount,
    placeholder: false,
  },
  {
    key: 'teacher',
    title: '师资人数',
    icon: EDU_MENU_ICONS.teacher,
    iconColor: '#0d9488',
    iconBg: 'rgb(13 148 136 / 10%)',
    value: overview.value.teacherCount,
    placeholder: false,
  },
  {
    key: 'activity',
    title: '专项活动',
    icon: EDU_MENU_ICONS.activity,
    iconColor: '#6366f1',
    iconBg: 'rgb(99 102 241 / 10%)',
    value: overview.value.activityCount,
    placeholder: false,
  },
  {
    key: 'budget',
    title: '预算执行率',
    icon: EDU_MENU_ICONS.budget,
    iconColor: '#f97316',
    iconBg: 'rgb(249 115 22 / 10%)',
    value: overview.value.budgetExecRate,
    placeholder: true,
  },
]);

function formatCount(value: number | null | undefined, placeholder: boolean) {
  if (value === null || value === undefined) {
    return placeholder ? '-' : '0';
  }
  return value.toLocaleString('zh-CN');
}

async function loadOverview() {
  if (!canView.value) {
    return;
  }
  loading.value = true;
  try {
    overview.value = await getEduOverview();
  } catch (error) {
    console.error('加载信息总览失败', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadOverview();
});
</script>

<template>
  <div v-if="canView" class="edu-info-overview" :class="{ 'is-loading': loading }">
    <div
      v-for="item in items"
      :key="item.key"
      class="edu-info-overview__card"
    >
      <div
        class="edu-info-overview__icon"
        :style="{ color: item.iconColor, backgroundColor: item.iconBg }"
      >
        <IconifyIcon :icon="item.icon" class="text-2xl" />
      </div>
      <div class="edu-info-overview__meta">
        <div class="edu-info-overview__title">{{ item.title }}</div>
        <div class="edu-info-overview__value">
          {{ formatCount(item.value, item.placeholder) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edu-info-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  align-items: stretch;
}

.edu-info-overview.is-loading {
  opacity: 0.7;
}

.edu-info-overview__card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
}

.edu-info-overview__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
}

.edu-info-overview__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  margin-left: 16px;
  text-align: right;
}

.edu-info-overview__title {
  margin-bottom: 6px;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.2;
}

.edu-info-overview__value {
  color: #374151;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
}

</style>

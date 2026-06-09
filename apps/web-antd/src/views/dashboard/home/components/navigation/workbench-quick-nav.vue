<script lang="ts" setup>
import type { WorkbenchQuickNavItem } from '@vben/common-ui';

import { useRouter } from 'vue-router';

import { WorkbenchQuickNav } from '@vben/common-ui';
import { openWindow } from '@vben/utils';

interface Props {
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: '快捷导航',
});

const router = useRouter();

// 示例快捷导航数据
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: '首页',
    url: '/',
  },
  {
    color: '#3fb27f',
    icon: 'simple-icons:erpnext',
    title: 'OA 办公',
    url: '/oa',
  },
  {
    color: '#7c3aed',
    icon: 'tabler:brand-ansible',
    title: '工作流程',
    url: '/bpm',
  },
  {
    color: '#4daf1bc9',
    icon: 'simple-icons:civicrm',
    title: '人事管理',
    url: '/hrm',
  },
];

function navTo(nav: WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}
</script>

<template>
  <WorkbenchQuickNav :items="quickNavItems" :title="title" @click="navTo" />
</template>

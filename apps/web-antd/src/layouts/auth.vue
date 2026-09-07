<script lang="ts" setup>
import { computed } from 'vue';

import { preferences, usePreferences } from '@vben/preferences';

import { $t } from '#/locales';

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const logoDark = computed(() => preferences.logo.sourceDark);
const { isDark } = usePreferences();

const logoSrc = computed(() => {
  if (isDark.value && logoDark.value) {
    return logoDark.value;
  }
  return logo.value;
});

const companyName = computed(() => preferences.copyright.companyName);
const companySiteLink = computed(() => preferences.copyright.companySiteLink);
const currentYear = new Date().getFullYear();
</script>

<template>
  <div
    :class="[isDark ? 'dark' : '']"
    class="oa-auth-layout flex min-h-screen select-none overflow-hidden"
  >
    <!-- 左侧品牌展示面板 -->
    <div class="oa-brand-panel relative hidden w-[45%] lg:flex">
      <!-- 背景装饰 -->
      <div class="oa-brand-bg absolute inset-0"></div>
      <div class="oa-brand-pattern absolute inset-0"></div>

      <!-- 内容区域 -->
      <div class="relative z-10 flex w-full flex-col justify-between p-12">
        <!-- Logo 和系统名称 -->
        <div class="flex items-center">
          <img
            v-if="logoSrc"
            :alt="appName"
            :src="logoSrc"
            class="mr-3 drop-shadow-lg"
            width="30"
          />
          <div>
            <h1 class="text-xl font-bold text-white">{{ appName }}</h1>
          </div>
        </div>

        <!-- 中间标语 -->
        <div class="space-y-6">
          <h2 class="text-3xl font-bold leading-tight text-white xl:text-4xl">
            {{ $t('authentication.pageTitle') }}
          </h2>
          <p class="text-lg text-white/70">
            {{ $t('authentication.pageDesc') }}
          </p>
          <!-- 功能亮点 -->
          <div class="mt-8 space-y-4">
            <div class="flex items-center gap-3 text-white/80">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </span>
              <span class="text-sm">学业辅导与成长规划</span>
            </div>
            <div class="flex items-center gap-3 text-white/80">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </span>
              <span class="text-sm">校企项目与实践任务</span>
            </div>
            <div class="flex items-center gap-3 text-white/80">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 2.707a48.667 48.667 0 00-3.413-.387m0 0a48.667 48.667 0 00-3.413.387m3.413-.387V6.75m0 0A2.25 2.25 0 0012 4.5v0a2.25 2.25 0 00-2.25 2.25m0 0v1.5m0 0A2.25 2.25 0 017.5 10.5v0a2.25 2.25 0 002.25 2.25m0 0h4.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </span>
              <span class="text-sm">奖助推送与岗位推荐</span>
            </div>
          </div>
        </div>

        <!-- 底部版权 -->
        <div class="text-sm text-white/40">
          &copy; {{ currentYear }} {{ appName }}
        </div>
      </div>
    </div>

    <!-- 右侧表单区域 -->
    <div class="relative flex flex-1 flex-col">
      <!-- 工具栏 -->
      <!--      <div-->
      <!--        class="absolute right-4 top-4 z-10 flex items-center gap-1"-->
      <!--      >-->
      <!--        <LanguageToggle />-->
      <!--        <ThemeToggle />-->
      <!--      </div>-->

      <!-- 移动端 Logo -->
      <div class="flex items-center px-8 pt-8 lg:hidden">
        <img
          v-if="logoSrc"
          :alt="appName"
          :src="logoSrc"
          class="mr-2"
          width="36"
        />
        <span class="text-lg font-semibold text-foreground">{{ appName }}</span>
      </div>

      <!-- 表单内容 -->
      <div class="flex flex-1 items-center justify-center px-6 py-10">
        <div class="w-full max-w-md">
          <!-- Router View -->
          <RouterView v-slot="{ Component, route }">
            <Transition appear mode="out-in" name="slide-right">
              <KeepAlive :include="['Login']">
                <component
                  :is="Component"
                  :key="route.fullPath"
                  class="w-full"
                />
              </KeepAlive>
            </Transition>
          </RouterView>
        </div>
      </div>

      <!-- 底部版权 (桌面端) -->
      <div
        v-if="preferences.copyright.enable"
        class="hidden px-8 pb-4 text-center text-xs text-muted-foreground lg:block"
      >
        Copyright &copy; {{ currentYear }}
        <a
          v-if="companyName"
          :href="companySiteLink || 'javascript:void(0)'"
          class="mx-1 hover:text-primary"
          target="_blank"
        >
          {{ companyName }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.oa-auth-layout {
  background: hsl(var(--background));
}

/* 左侧品牌面板 - 渐变背景 */
.oa-brand-bg {
  background: linear-gradient(160deg, #1a365d 0%, #2563eb 50%, #1d4ed8 100%);
}

.dark .oa-brand-bg {
  background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%);
}

/* 装饰纹理 */
.oa-brand-pattern {
  background-image:
    radial-gradient(
      circle at 20% 80%,
      rgb(255 255 255 / 6%) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 20%,
      rgb(255 255 255 / 4%) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 40% 40%,
      rgb(255 255 255 / 3%) 0%,
      transparent 30%
    );
}

/* 右侧区域过渡动画 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>

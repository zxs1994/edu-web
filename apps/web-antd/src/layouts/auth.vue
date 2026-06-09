<script lang="ts" setup>
import { computed } from 'vue';

import { LanguageToggle, ThemeToggle } from '@vben/layouts';
import { usePreferences } from '@vben/preferences';
import { preferences } from '@vben/preferences';

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
      <div class="oa-brand-bg absolute inset-0" />
      <div class="oa-brand-pattern absolute inset-0" />

      <!-- 内容区域 -->
      <div class="relative z-10 flex w-full flex-col justify-between p-12">
        <!-- Logo 和系统名称 -->
        <div class="flex items-center">
          <img
            v-if="logoSrc"
            :alt="appName"
            :src="logoSrc"
            class="mr-3 drop-shadow-lg"
            width="48"
          />
          <div>
            <h1 class="text-xl font-bold text-white">{{ appName }}</h1>
            <p class="mt-0.5 text-sm text-white/60">DingHeng OA</p>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </span>
              <span class="text-sm">高效流程审批，提升办公效率</span>
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </span>
              <span class="text-sm">多部门协同，信息高效流转</span>
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
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </span>
              <span class="text-sm">数据安全保障，权限精细管理</span>
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
        <span class="text-foreground text-lg font-semibold">{{
          appName
        }}</span>
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
        class="text-muted-foreground hidden px-8 pb-4 text-center text-xs lg:block"
      >
        Copyright &copy; {{ currentYear }}
        <a
          v-if="companyName"
          :href="companySiteLink || 'javascript:void(0)'"
          class="hover:text-primary mx-1"
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
  background-image: radial-gradient(
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

<script lang="ts" setup>
import type { ActivityInstanceApi } from '#/api/edu/activity-instance';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, nextTick, onActivated, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelEnrollActivityInstance,
  enrollActivityInstance,
  getMyEnrollableInstancePage,
} from '#/api/edu/activity-instance';

import StudentFeedbackModal from './student-feedback-modal.vue';
import {
  formatMyFeedbackStatus,
  getEnrolledTagColor,
  getMyFeedbackTagColor,
  useEnrollGridColumns,
  useEnrollGridFormSchema,
} from './data';

defineOptions({ name: 'EduActivityInstanceEnroll' });

const route = useRoute();
const actionLoadingId = ref<number>();

/** URL ?instanceCode= 解析结果 */
const routeInstanceCode = computed(() => {
  const raw = route.query.instanceCode;
  if (raw == null) return '';
  const code = Array.isArray(raw) ? raw[0] : raw;
  return code != null && String(code).trim() ? String(code).trim() : '';
});

const [FeedbackModal, feedbackModalApi] = useVbenModal({
  connectedComponent: StudentFeedbackModal,
});

async function handleEnroll(row: ActivityInstanceApi.EnrollableInstance) {
  if (!row.id) return;
  actionLoadingId.value = row.id;
  try {
    await enrollActivityInstance(row.id);
    message.success('报名成功');
    gridApi.query();
  } finally {
    actionLoadingId.value = undefined;
  }
}

async function handleCancel(row: ActivityInstanceApi.EnrollableInstance) {
  if (!row.id) return;
  actionLoadingId.value = row.id;
  try {
    await cancelEnrollActivityInstance(row.id);
    message.success('已取消报名');
    gridApi.query();
  } finally {
    actionLoadingId.value = undefined;
  }
}

function openFeedbackModal(
  row: ActivityInstanceApi.EnrollableInstance,
  viewOnly = false,
) {
  feedbackModalApi.setData({ row, readonly: viewOnly }).open();
}

function handleFeedbackSuccess() {
  gridApi.query();
}

function hasActions(row: ActivityInstanceApi.EnrollableInstance) {
  return (
    row.canEnroll
    || row.canCancel
    || row.myFeedbackStatus === 'pending'
    || row.myFeedbackStatus === 'submitted'
  );
}

function resolveQueryInstanceCode(formValues?: Record<string, any>) {
  const fromForm = formValues?.instanceCode;
  if (fromForm != null && String(fromForm).trim()) {
    return String(fromForm).trim();
  }
  return routeInstanceCode.value || undefined;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useEnrollGridFormSchema(routeInstanceCode.value || undefined),
    wrapperClass: 'grid-cols-4',
    collapsed: false,
  },
  gridOptions: {
    id: 'edu-activity-instance-enroll-list',
    columns: useEnrollGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: true },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page }, formValues) => {
          const instanceCode = resolveQueryInstanceCode(formValues);
          return getMyEnrollableInstancePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            ...(instanceCode ? { instanceCode } : {}),
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<ActivityInstanceApi.EnrollableInstance>,
});

async function waitGridReady(maxRetry = 40) {
  for (let i = 0; i < maxRetry; i++) {
    if (
      typeof gridApi.formApi?.setValues === 'function'
      && typeof (gridApi.grid as any)?.commitProxy === 'function'
    ) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

/** 预填 URL 参数并触发带参查询 */
async function applyRouteQueryAndSearch() {
  await nextTick();
  const ready = await waitGridReady();
  if (!ready) {
    console.warn('[enroll] grid/form 未就绪，跳过 URL 预填');
    return;
  }

  const code = routeInstanceCode.value;
  const values = code ? { instanceCode: code } : {};
  if (code) {
    await gridApi.formApi.setValues(values);
  }
  // 表格 proxy 读的是 latestSubmissionValues，必须显式写入
  const formValues = {
    ...(await gridApi.formApi.getValues()),
    ...values,
  };
  gridApi.formApi.setLatestSubmissionValues(formValues);
  await gridApi.query(formValues);
}

onMounted(() => {
  applyRouteQueryAndSearch();
});

onActivated(() => {
  applyRouteQueryAndSearch();
});

watch(
  () => route.query.instanceCode,
  () => {
    applyRouteQueryAndSearch();
  },
);
</script>

<template>
  <Page auto-content-height>
    <FeedbackModal @success="handleFeedbackSuccess" />
    <Grid>
      <template #enrolled="{ row }">
        <Tag :color="getEnrolledTagColor(row.enrolled)">
          {{ row.enrolled ? '已报名' : '未报名' }}
        </Tag>
      </template>
      <template #myFeedback="{ row }">
        <Tag
          v-if="row.myFeedbackStatus && row.myFeedbackStatus !== 'none'"
          :color="getMyFeedbackTagColor(row.myFeedbackStatus)"
        >
          {{ formatMyFeedbackStatus(row.myFeedbackStatus) }}
        </Tag>
        <span v-else class="text-gray-400">-</span>
      </template>
      <template #actions="{ row }">
        <Button
          v-if="row.canEnroll"
          :loading="actionLoadingId === row.id"
          size="small"
          type="link"
          @click="handleEnroll(row)"
        >
          报名
        </Button>
        <Popconfirm
          v-if="row.canCancel"
          title="确定取消报名吗？"
          @confirm="handleCancel(row)"
        >
          <Button
            :loading="actionLoadingId === row.id"
            danger
            size="small"
            type="link"
          >
            取消报名
          </Button>
        </Popconfirm>
        <Button
          v-if="row.myFeedbackStatus === 'pending'"
          size="small"
          type="link"
          @click="openFeedbackModal(row, false)"
        >
          填写反馈
        </Button>
        <Button
          v-if="row.myFeedbackStatus === 'submitted'"
          size="small"
          type="link"
          @click="openFeedbackModal(row, true)"
        >
          查看反馈
        </Button>
        <span v-if="!hasActions(row)" class="text-gray-400">-</span>
      </template>
    </Grid>
  </Page>
</template>

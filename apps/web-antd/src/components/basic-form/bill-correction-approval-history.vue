<script lang="ts" setup>
import type { PresidentCorrectionApi } from '#/api/oa/president-correction';

import { computed, onMounted, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import { Alert, Collapse, Spin } from 'ant-design-vue';

import { getApprovalDetail } from '#/api/bpm/processInstance';
import { getBillCorrectionHistory } from '#/api/oa/president-correction';
import BpmProcessInstanceTaskList from '#/views/bpm/processInstance/detail/modules/task-list.vue';
import BpmProcessInstanceTimeline from '#/views/bpm/processInstance/detail/modules/time-line.vue';

import CardContainer from './card-container.vue';

defineOptions({ name: 'BillCorrectionApprovalHistory' });

const emit = defineEmits<{
  loaded: [payload: { freezeStatus: number; hasHistory: boolean; isReApproval: boolean }];
}>();

const props = defineProps<{
  /** 当前单据流程实例 ID（用于判断是否处于重审） */
  currentProcessInstanceId?: string;
  /** 会长异议/纠错展示层激活：强制展示黄色提示与纠错历史区 */
  overlayActive?: boolean;
  sourceBillId?: number;
  sourceBillType?: string;
}>();

const CORRECTION_TYPE_OBJECTION = 1;
const CORRECTION_TYPE_COUNCIL = 2;
const CORRECTION_STATUS_IN_PROGRESS = 1;

const loading = ref(false);
const history = ref<PresidentCorrectionApi.BillHistory | null>(null);
const activityNodesMap = ref<Record<string, any[]>>({});
const activeKeys = ref<string[]>([]);
const isReApprovalFlag = ref(false);
const loadingProcessIds = new Set<string>();

const hasHistory = computed(() => (history.value?.items?.length ?? 0) > 0);
const isReApproval = computed(() => {
  if (!hasHistory.value || !props.currentProcessInstanceId) {
    return false;
  }
  return history.value!.items!.some(
    (item) => item.newProcessInstanceId === props.currentProcessInstanceId,
  );
});

function buildSummary(item: PresidentCorrectionApi.BillHistoryItem) {
  const time = item.revokeTime ? formatDateTime(item.revokeTime) : '';
  const user = item.revokeUserName || '会长';
  if (item.correctionType === CORRECTION_TYPE_COUNCIL) {
    return `会长【${user}】于 ${time} 依据理事会决议纠错${item.correctionResult ? `，结果：${item.correctionResult}` : ''}`;
  }
  return `会长【${user}】于 ${time} 发起异议纠错，原审批流程已撤销。原因：${item.correctionReason || '—'}`;
}

function panelHeader(item: PresidentCorrectionApi.BillHistoryItem) {
  const version = item.approvalVersion ?? 1;
  const typeLabel =
    item.correctionType === CORRECTION_TYPE_COUNCIL ? '理事会决议' : '异议纠错';
  return `第 ${version} 次纠错（${typeLabel}）— 原审批记录`;
}

async function loadActivityNodes(processInstanceId: string) {
  if (
    !processInstanceId ||
    activityNodesMap.value[processInstanceId] ||
    loadingProcessIds.has(processInstanceId)
  ) {
    return;
  }
  loadingProcessIds.add(processInstanceId);
  try {
    const data = await getApprovalDetail({ processInstanceId });
    activityNodesMap.value[processInstanceId] = data.activityNodes ?? [];
  } catch (error) {
    console.warn('加载原审批进度失败:', processInstanceId, error);
    activityNodesMap.value[processInstanceId] = [];
  } finally {
    loadingProcessIds.delete(processInstanceId);
  }
}

async function loadHistory() {
  if (!props.sourceBillType || !props.sourceBillId) {
    history.value = null;
    return;
  }
  loading.value = true;
  try {
    const data = await getBillCorrectionHistory({
      sourceBillType: props.sourceBillType,
      sourceBillId: props.sourceBillId,
    });
    history.value = data;
    const items = data.items ?? [];
    if (items.length > 0) {
      const last = items[items.length - 1];
      activeKeys.value = last?.correctionId
        ? [String(last.correctionId)]
        : [];
    }
    await Promise.all(
      [
        ...new Set(
          items
            .map((item) => item.sourceProcessInstanceId)
            .filter((id): id is string => !!id),
        ),
      ].map((id) => loadActivityNodes(id)),
    );
    isReApprovalFlag.value = isReApproval.value;
    emit('loaded', {
      freezeStatus: data.freezeStatus ?? 0,
      hasHistory: items.length > 0,
      isReApproval: isReApprovalFlag.value,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(loadHistory);

watch(
  () => [props.sourceBillType, props.sourceBillId] as const,
  () => loadHistory(),
);

watch(
  () => props.currentProcessInstanceId,
  () => {
    if (props.sourceBillType && props.sourceBillId) {
      loadHistory();
    }
  },
);

const alertMessage = computed(() => {
  if (isReApproval.value) {
    return '本单据已重新提交审批，下方可查看纠错重审进度；原审批记录见折叠面板';
  }
  if (history.value?.correctionStatus === CORRECTION_STATUS_IN_PROGRESS) {
    return '本单据处于会长纠错处理中，请修改单据信息后重新提交审批';
  }
  return '本单据处于会长纠错处理中，业务操作已冻结';
});

defineExpose({ isReApproval, hasHistory, refresh: loadHistory });
</script>

<template>
  <div v-if="hasHistory || loading || overlayActive" class="mb-4">
    <Spin :spinning="loading">
      <Alert
        v-if="history?.freezeStatus === 1 || overlayActive"
        class="mb-4"
        type="warning"
        show-icon
        :message="alertMessage"
      />

      <Collapse v-if="hasHistory" v-model:active-key="activeKeys">
        <Collapse.Panel
          v-for="item in history?.items ?? []"
          :key="String(item.correctionId)"
          :header="panelHeader(item)"
        >
          <Alert
            class="mb-4"
            :type="
              item.correctionType === CORRECTION_TYPE_COUNCIL
                ? 'error'
                : 'warning'
            "
            show-icon
            :message="buildSummary(item)"
          />

          <CardContainer
            v-if="item.sourceProcessInstanceId"
            title="原审批进度"
          >
            <BpmProcessInstanceTimeline
              :activity-nodes="
                activityNodesMap[item.sourceProcessInstanceId] ?? []
              "
              direction="horizontal"
              :show-status-icon="true"
              :enable-approve-user-select="false"
            />
          </CardContainer>

          <CardContainer
            v-if="item.sourceProcessInstanceId"
            title="原审批记录（含流程撤销）"
          >
            <BpmProcessInstanceTaskList
              :id="item.sourceProcessInstanceId"
              :loading="false"
            />
          </CardContainer>
        </Collapse.Panel>
      </Collapse>
    </Spin>
  </div>
</template>

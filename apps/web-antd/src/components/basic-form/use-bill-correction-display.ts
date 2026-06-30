import type { Ref } from 'vue';

import { computed, ref } from 'vue';

import { BpmProcessInstanceStatus } from '@vben/constants';

import { getBillCorrectionHistory } from '#/api/oa/president-correction';

/** 会长异议/纠错展示层：表头 Tag + 顶部历史区 + 隐藏审批/流程图 Tab */
export function useBillCorrectionDisplay(options: {
  billId: Ref<number | undefined>;
  presidentCorrectionDisplay?: Ref<boolean | undefined>;
  processInstanceId: Ref<string | undefined>;
  sourceBillType?: Ref<string | undefined>;
}) {
  const correctionFreezeStatus = ref(0);
  const hasCorrectionHistory = ref(false);
  const isReApprovalFlow = ref(false);

  const isPresidentCorrectionOverlay = computed(
    () =>
      options.presidentCorrectionDisplay?.value === true ||
      correctionFreezeStatus.value === 1,
  );

  function onCorrectionHistoryLoaded(payload: {
    freezeStatus: number;
    hasHistory: boolean;
    isReApproval: boolean;
  }) {
    isReApprovalFlow.value = payload.isReApproval;
    hasCorrectionHistory.value = payload.hasHistory;
    correctionFreezeStatus.value = payload.freezeStatus ?? 0;
  }

  async function loadCorrectionMeta() {
    if (!options.sourceBillType?.value || !options.billId.value) {
      return;
    }
    const data = await getBillCorrectionHistory({
      sourceBillType: options.sourceBillType.value,
      sourceBillId: options.billId.value,
    });
    const items = data.items ?? [];
    hasCorrectionHistory.value = items.length > 0;
    correctionFreezeStatus.value = data.freezeStatus ?? 0;
    isReApprovalFlow.value = items.some(
      (item) => item.newProcessInstanceId === options.processInstanceId.value,
    );
  }

  function hasActiveBillProcess(header: {
    processInstanceId?: string;
    processStatus?: number;
  }) {
    return (
      !!header.processInstanceId &&
      header.processStatus != null &&
      header.processStatus !== BpmProcessInstanceStatus.NOT_START
    );
  }

  /** 纠错冻结：未重提隐藏 Tab；已重提（newProcessInstanceId 匹配）展示新流程 Tab */
  function shouldShowApprovalTabs(header: {
    processInstanceId?: string;
    processStatus?: number;
  }) {
    if (!hasActiveBillProcess(header)) {
      return false;
    }
    if (isPresidentCorrectionOverlay.value) {
      return isReApprovalFlow.value;
    }
    return true;
  }

  function mergePresidentCorrectionHeader<T extends Record<string, any>>(header: T) {
    return {
      ...header,
      presidentCorrectionDisplay: isPresidentCorrectionOverlay.value,
    };
  }

  return {
    correctionFreezeStatus,
    hasCorrectionHistory,
    isReApprovalFlow,
    isPresidentCorrectionOverlay,
    loadCorrectionMeta,
    mergePresidentCorrectionHeader,
    onCorrectionHistoryLoaded,
    shouldShowApprovalTabs,
  };
}

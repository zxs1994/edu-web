import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';

/** 流程定义 key → 业务单据详情路由（与 BPM 模型 formCustomCreatePath 对齐，作兜底） */
export const PROCESS_KEY_INFO_PATH: Record<string, string> = {
  oa_car_apply_bill: '/oa/car/car-apply-info',
  oa_car_return_bill: '/oa/car/car-return-info',
  oa_seal_apply_bill: '/oa/seal/seal-apply-info',
  oa_meeting_room_booking: '/oa/meetingroom/booking-info',
  oa_contract_bill: '/oa/contract/contract-bill-info',
  oa_document_dispatch_bill: '/oa/document/document-dispatch-info',
  oa_expense_reimburse_bill: '/oa/expense-travel/expense-reimburse-info',
  oa_daily_expense_bill: '/oa/expense-travel/daily-expense-info',
  oa_expense_payment_bill: '/oa/expense-travel/expense-payment-info',
  oa_project_initiation_bill: '/oa/contract/project-initiation-info',
  oa_travel_apply_bill: '/oa/expense-travel/travel-apply-info',
  oa_travel_apply_bill_copy: '/oa/expense-travel/travel-apply-info',
  oa_incoming_document_bill: '/oa/document/incoming-document-info',
  oa_correction_bill: '/oa/correction/correction-info',
  oa_reception_apply_bill: '/oa/reception/reception-apply-info',
};

/**
 * 「我的流程」列表行 → 详情路由
 * 会长异议/纠错：原流程已撤销，跳转业务单据页以便修改并重新提交
 */
export function getProcessInstanceMyDetailRoute(
  row: BpmProcessInstanceApi.ProcessInstance,
) {
  if (row.presidentCorrectionAwaitingResubmit && row.businessKey) {
    const processKey = row.processDefinition?.key;
    const infoPath =
      row.processDefinition?.formCustomCreatePath ||
      (processKey ? PROCESS_KEY_INFO_PATH[processKey] : undefined);
    if (infoPath) {
      return {
        path: infoPath,
        query: { id: row.businessKey },
      };
    }
  }
  return {
    name: 'BpmProcessInstanceDetail',
    query: { id: String(row.id), isTodo: 'false' },
  };
}

import { deleteCarApplyBill } from '#/api/oa/car/carapply';
import { deleteCarReturnBill } from '#/api/oa/car/carreturn';
import { deleteContractBill } from '#/api/oa/contract';
import { deleteCorrectionBill } from '#/api/oa/correction';
import { deleteDocumentDispatchBill } from '#/api/oa/document';
import { deleteExpenseReimburseBill } from '#/api/oa/expense';
import { deleteExpensePaymentBill } from '#/api/oa/expense-payment';
import { deleteIncomingDocumentBill } from '#/api/oa/incoming';
import { deleteMeetingRoomBooking } from '#/api/oa/meetingroom/booking';
import { deleteProjectInitiationBill } from '#/api/oa/project';
import { deleteSealApplyBill } from '#/api/oa/seal/sealapply';
import { deleteTravelApplyBill } from '#/api/oa/travel';
import { deleteEmployeeEntryBill } from '#/api/hrm/employee-entry';
import { deleteEmployeeRegularBill } from '#/api/hrm/employee-regular';
import { deleteEmployeeResignationBill } from '#/api/hrm/employee-resignation';
import { deleteEmployeeTransferBill } from '#/api/hrm/employee-transfer';

type DraftBillDeleteHandler = (id: number) => Promise<unknown>;

/** 流程定义 key → 业务单删除接口 */
const DRAFT_BILL_DELETE_MAP: Record<string, DraftBillDeleteHandler> = {
  oa_car_apply_bill: deleteCarApplyBill,
  oa_car_return_bill: deleteCarReturnBill,
  oa_seal_apply_bill: deleteSealApplyBill,
  oa_meeting_room_booking: deleteMeetingRoomBooking,
  oa_contract_bill: deleteContractBill,
  oa_document_dispatch_bill: deleteDocumentDispatchBill,
  oa_expense_reimburse_bill: deleteExpenseReimburseBill,
  oa_daily_expense_bill: deleteExpenseReimburseBill,
  oa_expense_payment_bill: deleteExpensePaymentBill,
  oa_project_initiation_bill: deleteProjectInitiationBill,
  oa_travel_apply_bill: deleteTravelApplyBill,
  oa_travel_apply_bill_copy: deleteTravelApplyBill,
  oa_incoming_document_bill: deleteIncomingDocumentBill,
  oa_correction_bill: deleteCorrectionBill,
  hr_employee_entry_bill: deleteEmployeeEntryBill,
  hr_employee_regular_bill: deleteEmployeeRegularBill,
  hr_employee_transfer_bill: deleteEmployeeTransferBill,
  hr_employee_resignation_bill: deleteEmployeeResignationBill,
};

export async function deleteDraftBill(
  processDefinitionKey: string,
  billId: number,
) {
  const handler = DRAFT_BILL_DELETE_MAP[processDefinitionKey];
  if (!handler) {
    throw new Error(`暂不支持删除该类型草稿：${processDefinitionKey}`);
  }
  await handler(billId);
}

export function getDraftBillInfoRoute(row: {
  billId: number;
  infoPath?: string;
}) {
  if (!row.infoPath) {
    return null;
  }
  return {
    path: row.infoPath,
    query: { id: row.billId },
  };
}

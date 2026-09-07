import { deleteActivity } from '#/api/edu/activity';
import { deleteActivityPayment } from '#/api/edu/activity-payment';
import { deleteEmployeeEntryBill } from '#/api/hrm/employee-entry';
import { deleteEmployeeRegularBill } from '#/api/hrm/employee-regular';
import { deleteEmployeeResignationBill } from '#/api/hrm/employee-resignation';
import { deleteEmployeeTransferBill } from '#/api/hrm/employee-transfer';

type DraftBillDeleteHandler = (id: number) => Promise<unknown>;

/** 流程定义 key → 业务单删除接口 */
const DRAFT_BILL_DELETE_MAP: Record<string, DraftBillDeleteHandler> = {
  hr_employee_entry_bill: deleteEmployeeEntryBill,
  hr_employee_regular_bill: deleteEmployeeRegularBill,
  hr_employee_transfer_bill: deleteEmployeeTransferBill,
  hr_employee_resignation_bill: deleteEmployeeResignationBill,
  edu_activity: deleteActivity,
  edu_activity_payment_request: deleteActivityPayment,
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

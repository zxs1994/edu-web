import { deleteEmployeeEntryBill } from '#/api/hrm/employee-entry';
import { deleteEmployeeRegularBill } from '#/api/hrm/employee-regular';
import { deleteEmployeeResignationBill } from '#/api/hrm/employee-resignation';
import { deleteEmployeeTransferBill } from '#/api/hrm/employee-transfer';

type DraftBillDeleteHandler = (id: number) => Promise<unknown>;

/** 流程定义 key → 业务单删除接口（OA 业务已移除，仅保留 HRM） */
const DRAFT_BILL_DELETE_MAP: Record<string, DraftBillDeleteHandler> = {
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

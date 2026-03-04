import type { PageParam, PageResult } from '@vben/request';

import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace LeaveCancelBillApi {
  /** 请假销假申请单信息 */
  export interface LeaveCancelBill {
    id?: number;
    billCode?: string;
    processInstanceId?: string;
    processStatus?: number;
    // 请假信息
    leaveType?: number;
    leaveBalance?: number;
    expectedStartTime?: Date;
    expectedEndTime?: Date;
    expectedDays?: number;
    projectName?: string;
    projectCode?: string;
    leaveReason?: string;
    // 销假信息
    actualStartTime?: Date;
    actualEndTime?: Date;
    actualDays?: number;
    cancelRemark?: string;
    // 制单人信息
    creatorName?: string;
    companyId?: number;
    companyName?: string;
    deptId?: number;
    deptName?: string;
    creator?: number;
    remark?: string;
    createTime?: Date;
    attachments?: AttachmentApi.AttachmentSaveReq[];
  }

  /** 请假销假申请单分页请求 */
  export interface LeaveCancelBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    leaveType?: number;
    creator?: string;
    createTime?: Date[];
  }
}

/** 查询请假销假申请单列表 */
export function getLeaveCancelBillPage(
  params: LeaveCancelBillApi.LeaveCancelBillPageReqVO,
) {
  return requestClient.get<
    PageResult<LeaveCancelBillApi.LeaveCancelBill>
  >('/hrm/leave-cancel-bill/page', { params });
}

/** 查询请假销假申请单详情 */
export function getLeaveCancelBill(id: number) {
  return requestClient.get<LeaveCancelBillApi.LeaveCancelBill>(
    `/hrm/leave-cancel-bill/get?id=${id}`,
  );
}

/** 保存请假销假申请单 */
export function saveLeaveCancelBill(
  data: LeaveCancelBillApi.LeaveCancelBill,
) {
  return requestClient.post<number>('/hrm/leave-cancel-bill/save', data);
}

/** 提交请假销假申请单 */
export function submitLeaveCancelBill(
  data: LeaveCancelBillApi.LeaveCancelBill,
) {
  return requestClient.post<number>('/hrm/leave-cancel-bill/submit', data);
}

/** 删除请假销假申请单 */
export function deleteLeaveCancelBill(id: number) {
  return requestClient.delete(`/hrm/leave-cancel-bill/delete?id=${id}`);
}

/** 批量删除请假销假申请单 */
export function deleteLeaveCancelBillList(ids: number[]) {
  return requestClient.delete(
    `/hrm/leave-cancel-bill/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出请假销假申请单 */
export function exportLeaveCancelBill(params: any) {
  return requestClient.download('/hrm/leave-cancel-bill/export-excel', {
    params,
  });
}

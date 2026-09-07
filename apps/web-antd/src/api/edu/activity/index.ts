import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ActivityApi {
  /** 费用标准 */
  export interface FeeStandard {
    id?: number;
    feeType?: string;
    feeMode?: string;
    currency?: string;
    amount?: number;
    payeeUserId?: number;
    payeeUserName?: string;
    feeSide?: string;
    remark?: string;
    /** 前端表格行 key（未保存行） */
    _clientRowKey?: string;
  }

  /** 专项活动 */
  export interface Activity {
    id?: number;
    billCode?: string;
    processInstanceId?: string;
    processStatus?: number;
    name?: string;
    activityType?: string;
    activitySubtype?: string;
    content?: string;
    cycleType?: string;
    startDate?: string;
    enrollStartTime?: Date | number | number[] | string;
    enrollEndTime?: Date | number | number[] | string;
    budgetAmount?: number;
    deptId?: number;
    deptName?: string;
    companyId?: number;
    companyName?: string;
    creator?: number | string;
    creatorName?: string;
    remark?: string;
    createTime?: Date | string;
    ownerUserIds?: number[];
    ownerUserNames?: string;
    participantUserIds?: number[];
    participantNames?: string;
    feeStandards?: FeeStandard[];
    /** 附件（非必填），与活动记录一致：fileName + fileUrl */
    attachments?: Attachment[];
  }

  export interface Attachment {
    fileName: string;
    fileUrl: string;
  }

  export interface ActivityPageReqVO extends PageParam {
    billCode?: string;
    name?: string;
    activityType?: string;
    processStatus?: number;
    cycleType?: string;
    startDate?: string[];
    creator?: number | string;
    createTime?: Date[];
  }
}

/** 查询专项活动分页 */
export function getActivityPage(params: ActivityApi.ActivityPageReqVO) {
  return requestClient.get<PageResult<ActivityApi.Activity>>('/edu/activity/page', {
    params,
  });
}

/** 查询专项活动详情 */
export function getActivity(id: number) {
  return requestClient.get<ActivityApi.Activity>(`/edu/activity/get?id=${id}`);
}

/** 保存专项活动草稿 */
export function saveActivity(data: ActivityApi.Activity) {
  return requestClient.post<number>('/edu/activity/save', data);
}

/** 提交专项活动审核 */
export function submitActivity(data: ActivityApi.Activity) {
  return requestClient.post<number>('/edu/activity/submit', data);
}

/** 删除专项活动 */
export function deleteActivity(id: number) {
  return requestClient.delete<boolean>(`/edu/activity/delete?id=${id}`);
}

/** 批量删除专项活动 */
export function deleteActivityList(ids: number[]) {
  return requestClient.delete<boolean>('/edu/activity/delete-list', {
    params: { ids: ids.join(',') },
  });
}

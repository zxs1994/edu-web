import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ActivityFeeItemApi {
  export interface FeeItem {
    id?: number;
    feeCode?: string;
    instanceId?: number;
    instanceCode?: string;
    activityId?: number;
    activityName?: string;
    feeType?: string;
    feeMode?: string;
    currency?: string;
    unitPrice?: number;
    quantity?: number;
    amount?: number;
    feeSide?: string;
    payeeUserId?: number;
    payeeUserName?: string;
    status?: string;
    paymentRequestId?: number;
    paymentBillCode?: string;
    generateTime?: string;
    payTime?: string;
    remark?: string;
  }

  export interface PageReqVO extends PageParam {
    feeCode?: string;
    activityId?: number;
    activityName?: string;
    instanceId?: number;
    instanceCode?: string;
    status?: string;
    feeSide?: string;
    feeType?: string;
    currency?: string;
    generateTime?: Date[];
  }
}

/** 费用明细分页 */
export function getActivityFeeItemPage(params: ActivityFeeItemApi.PageReqVO) {
  return requestClient.get<PageResult<ActivityFeeItemApi.FeeItem>>(
    '/edu/activity-fee-item/page',
    { params },
  );
}

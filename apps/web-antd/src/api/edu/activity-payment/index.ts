import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ActivityPaymentApi {
  export interface FeeItem {
    id?: number;
    feeCode?: string;
    instanceId?: number;
    instanceCode?: string;
    activityId?: number;
    feeType?: string;
    currency?: string;
    amount?: number;
    /** 实际金额（付款申请填写；合计按此汇总） */
    actualAmount?: number;
    feeSide?: string;
    payeeUserId?: number;
    payeeUserName?: string;
    status?: string;
    paymentRequestId?: number;
    generateTime?: string;
    remark?: string;
  }

  export interface PaymentRequest {
    id?: number;
    billCode?: string;
    activityId?: number;
    activityName?: string;
    activityBillCode?: string;
    /** 兼容旧单选；提交时优先用 instanceIds */
    instanceId?: number;
    /** 多选活动实例 */
    instanceIds?: number[];
    instanceCode?: string;
    title?: string;
    totalAmount?: number;
    currency?: string;
    processInstanceId?: string;
    processStatus?: number;
    applicantUserId?: number;
    applicantUserName?: string;
    /** 表头展示用（与 BasicForm creatorName 对齐） */
    creator?: number | string;
    creatorName?: string;
    companyName?: string;
    deptName?: string;
    remark?: string;
    createTime?: string;
    feeItems?: FeeItem[];
    feeItemIds?: number[];
    /** 费用明细实际金额（保存/提交时传） */
    feeActualAmounts?: Array<{ feeItemId: number; actualAmount: number }>;
  }

  export interface PageReqVO extends PageParam {
    billCode?: string;
    activityId?: number;
    title?: string;
    processStatus?: number;
    applicantUserId?: number;
    createTime?: Date[];
  }
}

export function getActivityPaymentPage(params: ActivityPaymentApi.PageReqVO) {
  return requestClient.get<PageResult<ActivityPaymentApi.PaymentRequest>>(
    '/edu/activity-payment/page',
    { params },
  );
}

export function getActivityPayment(id: number) {
  return requestClient.get<ActivityPaymentApi.PaymentRequest>(
    `/edu/activity-payment/get?id=${id}`,
  );
}

export function saveActivityPayment(data: ActivityPaymentApi.PaymentRequest) {
  return requestClient.post<number>('/edu/activity-payment/save', data);
}

export function submitActivityPayment(data: ActivityPaymentApi.PaymentRequest) {
  return requestClient.post<number>('/edu/activity-payment/submit', data);
}

export function deleteActivityPayment(id: number) {
  return requestClient.delete<boolean>(`/edu/activity-payment/delete?id=${id}`);
}

export function deleteActivityPaymentList(ids: number[]) {
  return requestClient.delete<boolean>('/edu/activity-payment/delete-list', {
    params: { ids: ids.join(',') },
  });
}

export function getSelectablePaymentFeeItems(params: {
  instanceIds?: number[];
  instanceId?: number;
  activityId?: number;
  paymentRequestId?: number;
}) {
  const { instanceIds, instanceId, ...rest } = params;
  const resolvedIds =
    instanceIds && instanceIds.length > 0
      ? instanceIds
      : instanceId != null
        ? [instanceId]
        : [];
  return requestClient.get<ActivityPaymentApi.FeeItem[]>(
    '/edu/activity-payment/selectable-fee-items',
    {
      params: {
        ...rest,
        instanceIds: resolvedIds,
      },
    },
  );
}

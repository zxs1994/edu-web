import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace RewardPoolApi {
  export interface RewardPool {
    id?: number;
    name?: string;
    totalBudget?: number;
    frozenAmount?: number;
    paidAmount?: number;
    availableAmount?: number;
    status?: number;
    remark?: string;
    createTime?: Date | string;
    updateTime?: Date | string;
  }

  export interface RewardPoolUpdateReqVO {
    id: number;
    name: string;
    remark?: string;
  }

  export interface RewardPoolUpdateStatusReqVO {
    id: number;
    status: number;
  }

  export interface RewardPoolAdjustReqVO {
    direction: 'DOWN' | 'UP';
    amount: number;
    remark: string;
  }

  export interface RewardPoolTxn {
    id?: number;
    poolId?: number;
    txnType?: string;
    amount?: number;
    totalAfter?: number;
    frozenAfter?: number;
    paidAfter?: number;
    bizType?: string;
    bizId?: number;
    remark?: string;
    createTime?: Date | string;
    creator?: string;
    creatorName?: string;
  }

  export interface RewardPoolTxnPageReqVO extends PageParam {
    poolId?: number;
    txnType?: string;
    createTime?: Date[];
  }
}

/** 获取系统奖金池 */
export function getRewardPool() {
  return requestClient.get<RewardPoolApi.RewardPool>('/edu/reward-pool/get');
}

/** 更新奖金池名称/备注 */
export function updateRewardPool(data: RewardPoolApi.RewardPoolUpdateReqVO) {
  return requestClient.put<boolean>('/edu/reward-pool/update', data);
}

/** 启停奖金池 */
export function updateRewardPoolStatus(
  data: RewardPoolApi.RewardPoolUpdateStatusReqVO,
) {
  return requestClient.put<boolean>('/edu/reward-pool/update-status', data);
}

/** 充值/调减 */
export function adjustRewardPool(data: RewardPoolApi.RewardPoolAdjustReqVO) {
  return requestClient.post<boolean>('/edu/reward-pool/adjust', data);
}

/** 流水分页 */
export function getRewardPoolTxnPage(
  params: RewardPoolApi.RewardPoolTxnPageReqVO,
) {
  return requestClient.get<PageResult<RewardPoolApi.RewardPoolTxn>>(
    '/edu/reward-pool/txn/page',
    { params },
  );
}

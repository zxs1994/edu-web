import { requestClient } from '#/api/request';

export namespace RewardPoolApi {
  export type PeriodMode = 'CUSTOM' | 'MONTH' | 'QUARTER';

  export interface BudgetPeriod {
    id?: number;
    name?: string;
    periodNo?: number;
    startDate?: string;
    endDate?: string;
    budgetAmount?: number;
  }

  export interface BudgetYear {
    id?: number;
    budgetYear?: number;
    periodMode?: PeriodMode | string;
    totalBudget?: number;
    remark?: string;
    createTime?: Date | string;
    periods?: BudgetPeriod[];
  }

  export interface BudgetYearCreateReqVO {
    budgetYear: number;
    periodMode: PeriodMode | string;
    totalBudget?: number;
    remark?: string;
    periods?: Array<{
      name?: string;
      startDate?: string;
      endDate?: string;
      budgetAmount?: number;
    }>;
  }

  export interface BudgetYearUpdateReqVO {
    id: number;
    remark?: string;
    periodMode?: PeriodMode | string;
    /** 传入则按当前时段均分重置 */
    totalBudget?: number;
    periods?: Array<{
      id?: number;
      name?: string;
      startDate?: string;
      endDate?: string;
      budgetAmount?: number;
    }>;
  }

  export interface BudgetPeriodUpdateReqVO {
    id: number;
    name: string;
    budgetAmount: number;
    startDate?: string;
    endDate?: string;
  }

  export interface PeriodExecution {
    id?: number;
    name?: string;
    periodNo?: number;
    startDate?: string;
    endDate?: string;
    budgetAmount?: number;
    executedAmount?: number;
    executionRate?: null | number;
  }

  export interface BudgetExecution {
    yearId?: number;
    budgetYear?: number;
    periodMode?: string;
    totalBudget?: number;
    totalExecuted?: number;
    executionRate?: null | number;
    periods?: PeriodExecution[];
  }

  export interface ExecutionDetailPageReqVO {
    budgetYear: number;
    periodId?: number;
    startDate?: string;
    endDate?: string;
    pageNo?: number;
    pageSize?: number;
  }

  export interface ExecutionDetailItem {
    paymentRequestId?: number;
    billCode?: string;
    title?: string;
    activityId?: number;
    activityName?: string;
    applicantUserId?: number;
    applicantUserName?: string;
    approveTime?: string;
    totalAmount?: number;
    currency?: string;
    exchangeRate?: number;
    amountCny?: number;
  }

  export interface ExecutionDetailPage {
    budgetYear?: number;
    periodId?: number;
    periodName?: string;
    startDate?: string;
    endDate?: string;
    executedAmountCny?: number;
    total?: number;
    list?: ExecutionDetailItem[];
  }
}

/** 年度预算列表 */
export function getBudgetYearList() {
  return requestClient.get<RewardPoolApi.BudgetYear[]>(
    '/edu/reward-pool/budget/year/list',
  );
}

/** 创建年度预算 */
export function createBudgetYear(data: RewardPoolApi.BudgetYearCreateReqVO) {
  return requestClient.post<number>('/edu/reward-pool/budget/year/create', data);
}

/** 更新年度预算 */
export function updateBudgetYear(data: RewardPoolApi.BudgetYearUpdateReqVO) {
  return requestClient.put<boolean>('/edu/reward-pool/budget/year/update', data);
}

/** 更新时段预算 */
export function updateBudgetPeriod(
  data: RewardPoolApi.BudgetPeriodUpdateReqVO,
) {
  return requestClient.put<boolean>(
    '/edu/reward-pool/budget/period/update',
    data,
  );
}

/** 年度执行率 */
export function getBudgetExecution(budgetYear: number) {
  return requestClient.get<RewardPoolApi.BudgetExecution>(
    '/edu/reward-pool/budget/execution',
    { params: { budgetYear } },
  );
}

/** 预算执行明细 */
export function getBudgetExecutionDetail(
  params: RewardPoolApi.ExecutionDetailPageReqVO,
) {
  return requestClient.get<RewardPoolApi.ExecutionDetailPage>(
    '/edu/reward-pool/budget/execution/detail',
    { params },
  );
}

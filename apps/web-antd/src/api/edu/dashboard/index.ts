import { requestClient } from '#/api/request';

export namespace EduDashboardApi {
  export interface Overview {
    studentCount?: number | null;
    teacherCount?: number | null;
    /** 专项活动数 */
    activityCount?: number | null;
    /** 预算年度 */
    budgetYear?: number | null;
    /** 时段模式 QUARTER/MONTH/CUSTOM */
    budgetPeriodMode?: string | null;
    /** 当前展示时段名称 */
    budgetPeriodName?: string | null;
    /** 当前时段执行率 0~1 */
    budgetExecRate?: number | null;
  }
}

/** 信息总览 */
export function getEduOverview() {
  return requestClient.get<EduDashboardApi.Overview>('/edu/dashboard/overview');
}

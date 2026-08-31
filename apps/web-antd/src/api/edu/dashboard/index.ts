import { requestClient } from '#/api/request';

export namespace EduDashboardApi {
  export interface Overview {
    studentCount?: number | null;
    teacherCount?: number | null;
    /** 专项活动数 */
    activityCount?: number | null;
    /** 预算执行率（暂未接入） */
    budgetExecRate?: number | null;
  }
}

/** 信息总览 */
export function getEduOverview() {
  return requestClient.get<EduDashboardApi.Overview>('/edu/dashboard/overview');
}

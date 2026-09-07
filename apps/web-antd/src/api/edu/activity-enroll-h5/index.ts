import { requestClient } from '#/api/request';

export namespace ActivityH5EnrollApi {
  export interface EnrollInfo {
    tenantId?: number;
    instanceId?: number;
    instanceCode?: string;
    periodNo?: number;
    plannedDate?: Date | number[] | string;
    activityName?: string;
    content?: string;
    activityType?: string;
    enrollStartTime?: Date | number[] | string;
    enrollEndTime?: Date | number[] | string;
    userName?: string;
    enrolled?: boolean;
    canEnroll?: boolean;
    message?: string;
    enrollCount?: number;
    enrollLimit?: number;
  }
}

/** H5 免登：查询报名信息 */
export function getH5EnrollInfo(c: string) {
  return requestClient.get<ActivityH5EnrollApi.EnrollInfo>(
    '/edu/activity-instance/h5/enroll-info',
    { params: { c } },
  );
}

/** H5 免登：提交报名 */
export function enrollByH5Token(c: string) {
  return requestClient.post<boolean>('/edu/activity-instance/h5/enroll', { c });
}

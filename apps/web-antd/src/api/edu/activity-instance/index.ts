import type { PageParam, PageResult } from '@vben/request';

import type { ActivityApi } from '#/api/edu/activity';

import { requestClient } from '#/api/request';

export namespace ActivityInstanceApi {
  export interface Attachment {
    fileName: string;
    fileUrl: string;
  }

  export interface ActivityRecord {
    id?: number;
    instanceId?: number;
    /** 后端 LocalDateTime，可能是字符串或数组 */
    actualStartTime?: number[] | string;
    actualEndTime?: number[] | string;
    absentUserIds?: number[];
    absentUserNames?: string;
    summary?: string;
    attachments?: Attachment[];
  }

  export interface Enrollment {
    id?: number;
    instanceId?: number;
    userId?: number;
    userName?: string;
    enrollTime?: Date | number[] | string;
  }

  /** 参与人报名状态（提醒报名 Tab） */
  export interface EnrollmentParticipant {
    userId?: number;
    userName?: string;
    roleType?: 'other' | 'student' | 'teacher';
    roleLabel?: string;
    enrolled?: boolean;
    enrollTime?: Date | number[] | string;
  }

  /** 专项活动实例 */
  export interface ActivityInstance {
    id?: number;
    instanceCode?: string;
    activityId?: number;
    activityBillCode?: string;
    activityName?: string;
    periodNo?: number;
    plannedDate?: string;
    actualDate?: string;
    status?: string;
    enrollCount?: number;
    enrollLimit?: number;
    attendanceCount?: number;
    createTime?: Date | string;
    activity?: ActivityApi.Activity;
    record?: ActivityRecord;
    recordEditable?: boolean;
    enrollmentParticipants?: EnrollmentParticipant[];
    enrolling?: boolean;
    feedback?: ActivityFeedback;
  }

  export interface StudentFeedback {
    id?: number;
    userId?: number;
    userName?: string;
    satisfaction?: number;
    harvest?: string;
    content?: string;
    submitTime?: Date | number[] | string;
    submitted?: boolean;
  }

  export interface TeacherFeedback {
    id?: number;
    userId?: number;
    userName?: string;
    summary?: string;
    problem?: string;
    suggestion?: string;
    submitTime?: Date | number[] | string;
    submitted?: boolean;
  }

  export interface AdminFeedback {
    id?: number;
    submitterUserId?: number;
    submitterUserName?: string;
    qualityScore?: number;
    closingOpinion?: string;
    submitTime?: Date | number[] | string;
    submitted?: boolean;
  }

  export interface ActivityFeedback {
    feedbackEditable?: boolean;
    canSubmitStudentFeedback?: boolean;
    canSubmitTeacherFeedback?: boolean;
    canSubmitAdminFeedback?: boolean;
    expectedStudentCount?: number;
    submittedStudentCount?: number;
    expectedTeacherCount?: number;
    submittedTeacherCount?: number;
    adminFeedbackSubmitted?: boolean;
    allFeedbackCompleted?: boolean;
    studentFeedbacks?: StudentFeedback[];
    teacherFeedbacks?: TeacherFeedback[];
    adminFeedback?: AdminFeedback;
  }

  /** 可报名实例 */
  export interface EnrollableInstance extends ActivityInstance {
    enrolled?: boolean;
    canEnroll?: boolean;
    canCancel?: boolean;
    canSubmitStudentFeedback?: boolean;
    studentFeedbackSubmitted?: boolean;
    /** pending/submitted/waiting/none */
    myFeedbackStatus?: string;
    activityType?: string;
    feedbackCount?: number;
    enrollStartTime?: Date | number[] | string;
    enrollEndTime?: Date | number[] | string;
  }

  /** 我的活动分页查询 */
  export interface MyActivityPageReq extends PageParam {
    instanceCode?: string;
    activityName?: string;
    enrolled?: boolean;
    canEnroll?: boolean;
    myFeedback?: string;
  }

  export interface ActivityInstancePageReqVO extends PageParam {
    instanceCode?: string;
    activityName?: string;
    activityId?: number;
    status?: string;
    plannedDate?: string[];
  }

  export interface ActivityRecordSaveReq {
    instanceId: number;
    actualDate: string;
    actualStartTime?: string;
    actualEndTime?: string;
    absentUserIds?: number[];
    summary: string;
    attachments?: Attachment[];
  }

  export interface StudentFeedbackSaveReq {
    instanceId: number;
    satisfaction: number;
    harvest?: string;
    content?: string;
  }

  export interface TeacherFeedbackSaveReq {
    instanceId: number;
    summary: string;
    problem?: string;
    suggestion?: string;
  }

  export interface AdminFeedbackSaveReq {
    instanceId: number;
    qualityScore: number;
    closingOpinion?: string;
  }

  /** 实例费用明细 */
  export interface FeeItem {
    id?: number;
    feeCode?: string;
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
    generateTime?: Date | number[] | string;
    payTime?: Date | number[] | string;
    remark?: string;
  }
}

/** 查询活动实例分页 */
export function getActivityInstancePage(
  params: ActivityInstanceApi.ActivityInstancePageReqVO,
) {
  return requestClient.get<PageResult<ActivityInstanceApi.ActivityInstance>>(
    '/edu/activity-instance/page',
    { params },
  );
}

/** 查询活动实例详情 */
export function getActivityInstance(id: number) {
  return requestClient.get<ActivityInstanceApi.ActivityInstance>(
    `/edu/activity-instance/get?id=${id}`,
  );
}

/** 保存活动记录 */
export function saveActivityInstanceRecord(
  data: ActivityInstanceApi.ActivityRecordSaveReq,
) {
  return requestClient.post<boolean>('/edu/activity-instance/save-record', data);
}

/** 当前用户我的活动分页 */
export function getMyEnrollableInstancePage(
  params: ActivityInstanceApi.MyActivityPageReq,
) {
  return requestClient.get<
    PageResult<ActivityInstanceApi.EnrollableInstance>
  >('/edu/activity-instance/my-enrollable-page', { params });
}

/** 实例报名列表 */
export function getInstanceEnrollmentList(instanceId: number) {
  return requestClient.get<ActivityInstanceApi.Enrollment[]>(
    '/edu/activity-instance/enrollment-list',
    { params: { instanceId } },
  );
}

/** 报名 */
export function enrollActivityInstance(instanceId: number) {
  return requestClient.post<boolean>('/edu/activity-instance/enroll', {
    instanceId,
  });
}

/** 取消报名 */
export function cancelEnrollActivityInstance(instanceId: number) {
  return requestClient.post<boolean>('/edu/activity-instance/cancel-enroll', {
    instanceId,
  });
}

/** 提交学生反馈 */
export function saveStudentFeedback(
  data: ActivityInstanceApi.StudentFeedbackSaveReq,
) {
  return requestClient.post<boolean>(
    '/edu/activity-instance/save-student-feedback',
    data,
  );
}

/** 当前用户的学生反馈（未提交返回 null） */
export function getMyStudentFeedback(instanceId: number) {
  return requestClient.get<ActivityInstanceApi.StudentFeedback | null>(
    '/edu/activity-instance/my-student-feedback',
    { params: { instanceId } },
  );
}

/** 提交教培反馈 */
export function saveTeacherFeedback(
  data: ActivityInstanceApi.TeacherFeedbackSaveReq,
) {
  return requestClient.post<boolean>(
    '/edu/activity-instance/save-teacher-feedback',
    data,
  );
}

/** 提交班务评价 */
export function saveAdminFeedback(data: ActivityInstanceApi.AdminFeedbackSaveReq) {
  return requestClient.post<boolean>(
    '/edu/activity-instance/save-admin-feedback',
    data,
  );
}

/** 实例费用明细列表 */
export function getInstanceFeeList(instanceId: number) {
  return requestClient.get<ActivityInstanceApi.FeeItem[]>(
    '/edu/activity-instance/fee-list',
    { params: { instanceId } },
  );
}

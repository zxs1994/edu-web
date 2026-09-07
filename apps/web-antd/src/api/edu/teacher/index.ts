import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace TeacherApi {
  /** 教培档案 */
  export interface Teacher {
    id?: number;
    username?: string;
    name?: string;
    sex?: number;
    title?: string;
    mobile?: string;
    rewardStandard?: null | number;
    userId?: number;
    userGenerated?: boolean;
    remark?: string;
    createTime?: Date | string;
  }

  export interface TeacherPageReqVO extends PageParam {
    username?: string;
    name?: string;
    title?: string;
    rewardStandard?: null | number;
    mobile?: string;
    createTime?: Date[];
  }

  export interface TeacherCreateRespVO {
    id: number;
    username: string;
    initPassword: string;
  }
}

/** 查询教培档案分页 */
export function getTeacherPage(params: TeacherApi.TeacherPageReqVO) {
  return requestClient.get<PageResult<TeacherApi.Teacher>>('/edu/teacher/page', {
    params,
  });
}

/** 查询教培档案详情 */
export function getTeacher(id: number) {
  return requestClient.get<TeacherApi.Teacher>(`/edu/teacher/get?id=${id}`);
}

/** 按关联用户ID查询教培档案 */
export function getTeacherByUserId(userId: number) {
  return requestClient.get<TeacherApi.Teacher>(
    `/edu/teacher/get-by-user-id?userId=${userId}`,
  );
}

/** 新增教培档案 */
export function createTeacher(data: TeacherApi.Teacher) {
  return requestClient.post<TeacherApi.TeacherCreateRespVO>(
    '/edu/teacher/create',
    data,
  );
}

/** 修改教培档案 */
export function updateTeacher(data: TeacherApi.Teacher) {
  return requestClient.put<boolean>('/edu/teacher/update', data);
}

/** 删除教培档案 */
export function deleteTeacher(id: number) {
  return requestClient.delete<boolean>(`/edu/teacher/delete?id=${id}`);
}

/** 批量删除教培档案 */
export function deleteTeacherList(ids: number[]) {
  return requestClient.delete<boolean>('/edu/teacher/delete-list', {
    params: { ids: ids.join(',') },
  });
}

/** 导出教培档案 Excel */
export function exportTeacherExcel(params: TeacherApi.TeacherPageReqVO) {
  return requestClient.download('/edu/teacher/export-excel', { params });
}

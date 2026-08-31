import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace StudentApi {
  /** 学生档案 */
  export interface Student {
    id?: number;
    name?: string;
    sex?: number;
    birthday?: string;
    studentNo?: string;
    username?: string;
    enrollYear?: number;
    college?: string;
    major?: string;
    className?: string;
    mobile?: string;
    schoolStatus?: number;
    userId?: number;
    userGenerated?: boolean;
    remark?: string;
    createTime?: Date | string;
  }

  /** 学生档案分页请求 */
  export interface StudentPageReqVO extends PageParam {
    studentNo?: string;
    username?: string;
    name?: string;
    college?: string;
    major?: string;
    className?: string;
    schoolStatus?: number;
    enrollYear?: number;
    createTime?: Date[];
  }

  /** 创建学生档案结果 */
  export interface StudentCreateRespVO {
    id: number;
    username: string;
    initPassword: string;
  }
}

/** 查询学生档案分页 */
export function getStudentPage(params: StudentApi.StudentPageReqVO) {
  return requestClient.get<PageResult<StudentApi.Student>>('/edu/student/page', {
    params,
  });
}

/** 查询学生档案详情 */
export function getStudent(id: number) {
  return requestClient.get<StudentApi.Student>(`/edu/student/get?id=${id}`);
}

/** 新增学生档案 */
export function createStudent(data: StudentApi.Student) {
  return requestClient.post<StudentApi.StudentCreateRespVO>(
    '/edu/student/create',
    data,
  );
}

/** 修改学生档案 */
export function updateStudent(data: StudentApi.Student) {
  return requestClient.put<boolean>('/edu/student/update', data);
}

/** 删除学生档案 */
export function deleteStudent(id: number) {
  return requestClient.delete<boolean>(`/edu/student/delete?id=${id}`);
}

/** 批量删除学生档案 */
export function deleteStudentList(ids: number[]) {
  return requestClient.delete<boolean>('/edu/student/delete-list', {
    params: { ids: ids.join(',') },
  });
}

/** 导出学生档案 Excel */
export function exportStudentExcel(params: StudentApi.StudentPageReqVO) {
  return requestClient.download('/edu/student/export-excel', { params });
}

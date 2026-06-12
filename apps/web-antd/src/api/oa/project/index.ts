import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace ProjectInitiationBillApi {
  export interface ProjectInitiationBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    projectName: string;
    projectType: number;
    projectDescription: string;
    budgetAmount: number;
    startDate: string;
    endDate: string;
    expectedOutcome: string;
    isMajor: number;
    majorRemark: string;
    cause: string;
    creator?: number;
    creatorName?: string;
    companyId: number;
    companyName: string;
    deptId: number;
    deptName: string;
    remark?: string;
    createTime?: Date;
    attachments?: AttachmentApi.AttachmentSaveReq[];
  }

  export interface ProjectInitiationBillPageReqVO extends PageParam {
    billCode?: string;
    processStatus?: number;
    projectType?: number;
    isMajor?: number;
    createTime?: Date[];
  }
}

export function getProjectInitiationBillPage(
  params: ProjectInitiationBillApi.ProjectInitiationBillPageReqVO,
) {
  return requestClient.get<
    PageResult<ProjectInitiationBillApi.ProjectInitiationBill>
  >('/oa/project-initiation-bill/page', { params });
}

export function getProjectInitiationBill(id: number) {
  return requestClient.get<ProjectInitiationBillApi.ProjectInitiationBill>(
    `/oa/project-initiation-bill/get?id=${id}`,
  );
}

export function saveProjectInitiationBill(
  data: ProjectInitiationBillApi.ProjectInitiationBill,
) {
  return requestClient.post('/oa/project-initiation-bill/save', data);
}

export function submitProjectInitiationBill(
  data: ProjectInitiationBillApi.ProjectInitiationBill,
) {
  return requestClient.post('/oa/project-initiation-bill/submit', data);
}

export function updateProjectInitiationBill(
  data: ProjectInitiationBillApi.ProjectInitiationBill,
) {
  return requestClient.put('/oa/project-initiation-bill/update', data);
}

export function deleteProjectInitiationBill(id: number) {
  return requestClient.delete(`/oa/project-initiation-bill/delete?id=${id}`);
}

export function deleteProjectInitiationBillList(ids: number[]) {
  return requestClient.delete(
    `/oa/project-initiation-bill/delete-list?ids=${ids.join(',')}`,
  );
}

export function exportProjectInitiationBill(params: any) {
  return requestClient.download('/oa/project-initiation-bill/export-excel', {
    params,
  });
}

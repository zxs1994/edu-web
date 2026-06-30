import type { PageParam, PageResult } from '@vben/request';
import type { AttachmentApi } from '#/api/common/attachment';

import { requestClient } from '#/api/request';

export namespace ProjectInitiationBillApi {
  export interface ProjectInitiationBill {
    id?: number;
    billCode: string;
    processInstanceId?: string;
    processStatus?: number;
    presidentCorrectionDisplay?: boolean;
    presidentCorrectionAwaitingResubmit?: boolean;
    projectName: string;
    projectType: number;
    priority?: number;
    projectCategory?: number;
    projectSetId?: number;
    projectSetName?: string;
    projectDescription?: string;
    budgetAmount?: number;
    startDate?: string;
    endDate?: string;
    relatedContractId?: number;
    contractCode?: string;
    contractName?: string;
    projectManagerId?: number;
    projectManagerName?: string;
    counterpartyType?: number;
    counterpartyId?: number;
    counterpartyName?: string;
    counterpartyContact?: string;
    counterpartyPhone?: string;
    creator?: number | string;
    creatorName?: string;
    companyId: number;
    companyName: string;
    deptId: number;
    deptName: string;
    remark?: string;
    createTime?: Date | string;
    attachments?: AttachmentApi.AttachmentSaveReq[];
  }

  export interface ProjectInitiationBillPageReqVO extends PageParam {
    billCode?: string;
    projectName?: string;
    projectType?: number;
    processStatus?: number;
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

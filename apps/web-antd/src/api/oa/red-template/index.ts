import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace RedTemplateApi {
  export interface RedTemplate {
    id?: number;
    templateName: string;
    orgName: string;
    nameFontSize?: number;
    docNumberPrefix?: string;
    sealImage?: string;
    separatorStyle?: string;
    status?: number;
    sort?: number;
    remark?: string;
    createTime?: Date;
  }

  export interface RedTemplatePageReqVO extends PageParam {
    templateName?: string;
    orgName?: string;
    status?: number;
    createTime?: Date[];
  }
}

/** 查询套红模板分页 */
export function getRedTemplatePage(params: RedTemplateApi.RedTemplatePageReqVO) {
  return requestClient.get<PageResult<RedTemplateApi.RedTemplate>>(
    '/oa/red-template/page',
    { params },
  );
}

/** 查询套红模板详情 */
export function getRedTemplate(id: number) {
  return requestClient.get<RedTemplateApi.RedTemplate>(
    `/oa/red-template/get?id=${id}`,
  );
}

/** 查询套红模板精简列表（下拉选择用） */
export function getRedTemplateSimpleList() {
  return requestClient.get<RedTemplateApi.RedTemplate[]>(
    '/oa/red-template/simple-list',
  );
}

/** 新增套红模板 */
export function createRedTemplate(data: RedTemplateApi.RedTemplate) {
  return requestClient.post('/oa/red-template/create', data);
}

/** 修改套红模板 */
export function updateRedTemplate(data: RedTemplateApi.RedTemplate) {
  return requestClient.put('/oa/red-template/update', data);
}

/** 删除套红模板 */
export function deleteRedTemplate(id: number) {
  return requestClient.delete(`/oa/red-template/delete?id=${id}`);
}

/** 批量删除套红模板 */
export function deleteRedTemplateList(ids: number[]) {
  return requestClient.delete(
    `/oa/red-template/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出套红模板 */
export function exportRedTemplate(params: any) {
  return requestClient.download('/oa/red-template/export-excel', { params });
}

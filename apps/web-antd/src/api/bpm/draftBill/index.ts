import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace BpmDraftBillApi {
  export interface DraftBill {
    billId: number;
    billCode?: string;
    processDefinitionKey: string;
    billTypeName?: string;
    category?: string;
    categoryName?: string;
    summary?: string;
    createTime?: string;
    deptName?: string;
    infoPath?: string;
  }

  export interface DraftBillPageReq extends PageParam {
    category?: string;
    billType?: string;
    billCode?: string;
    companyId?: number;
    deptId?: number;
    createTime?: string[];
  }
}

/** 我的草稿箱分页 */
export function getMyDraftBillPage(params: BpmDraftBillApi.DraftBillPageReq) {
  return requestClient.get<PageResult<BpmDraftBillApi.DraftBill>>(
    '/bpm/draft-bill/my-page',
    { params },
  );
}

import { requestClient } from '#/api/request';

/** OA 业务已移除；保留空实现供 BPM/会长纠错相关页面编译通过 */

export namespace PresidentCorrectionApi {
  export interface BillHistoryItem {
    newProcessInstanceId?: string;
    [key: string]: any;
  }
  export interface BillHistory {
    items?: BillHistoryItem[];
    freezeStatus?: number;
  }
  export interface PageReq {
    [key: string]: any;
  }
  export interface InitiateReq {
    [key: string]: any;
  }
}

export async function getBillCorrectionHistory(_params: {
  sourceBillType: string;
  sourceBillId: number;
}): Promise<PresidentCorrectionApi.BillHistory> {
  return { items: [], freezeStatus: 0 };
}

export async function getPresidentCorrectionPage(_params: any) {
  return { list: [], total: 0 };
}

export async function initiatePresidentCorrection(
  _data: PresidentCorrectionApi.InitiateReq,
) {
  return requestClient.post('/oa/president-correction/initiate', _data);
}

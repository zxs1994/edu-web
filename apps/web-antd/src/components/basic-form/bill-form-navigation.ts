/** 会长纠错中单据提交成功后留在详情页，便于查看新审批 Tab */
export async function finishBillFormAfterSaveSubmit(options: {
  closeTab: () => void;
  isSubmit: boolean;
  onReloaded?: () => void;
  presidentCorrectionDisplay?: boolean;
  reload: () => Promise<void>;
}) {
  const stayOnPage =
    options.isSubmit && options.presidentCorrectionDisplay === true;
  if (stayOnPage) {
    await options.reload();
    options.onReloaded?.();
    return;
  }
  options.closeTab();
}

/** 从接口错误中解析业务提示文案 */
function getApiErrorMessage(error: unknown): string {
  const err = error as {
    data?: { msg?: string; message?: string };
    message?: string;
    response?: { data?: { msg?: string; message?: string } };
  };
  const responseData = err?.response?.data ?? err?.data ?? {};
  return String(
    responseData.msg ?? responseData.message ?? err?.message ?? '',
  );
}

/** 判断是否为单据不存在/已删除类错误 */
export function isBillNotFoundError(error: unknown): boolean {
  const msg = getApiErrorMessage(error);
  return msg.includes('不存在') || msg.includes('已删除');
}

/** 单据详情加载失败且单据已不存在时，关闭当前 Tab */
export function handleBillNotFoundAfterLoad(
  error: unknown,
  closeTab: () => void,
): boolean {
  if (!isBillNotFoundError(error)) {
    return false;
  }
  closeTab();
  return true;
}

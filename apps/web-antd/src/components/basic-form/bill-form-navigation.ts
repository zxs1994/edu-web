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

import { BpmProcessInstanceStatus } from '@vben/constants';

/**
 * 业务列表页详情路由解析器
 *
 * 当单据流程状态为 RUNNING（审批中）时，跳转到 BPM 详情页；
 * 否则跳转到业务 info 页。
 */

/** BPM 详情页路由路径 */
const BPM_DETAIL_PATH = '/bpm/process-instance/detail';

/** 从 info 页路径推导列表页路径，用于混合导航保留左侧菜单上下文 */
function deriveMenuActivePath(
  infoPath: string,
  menuActivePath?: string,
): string | undefined {
  if (menuActivePath) {
    return menuActivePath;
  }
  if (infoPath.endsWith('/info')) {
    return infoPath.replace(/\/info$/, '/list');
  }
  return undefined;
}

function buildBpmDetailQuery(
  processInstanceId: string | number,
  infoPath: string,
  menuActivePath?: string,
) {
  const query: Record<string, string> = { id: String(processInstanceId) };
  const activePath = deriveMenuActivePath(infoPath, menuActivePath);
  if (activePath) {
    query.menuActivePath = activePath;
  }
  return query;
}

/**
 * createRouterLinkColumn 的 resolveRoute 回调
 * @param menuActivePath 进入 BPM 详情时用于激活左侧菜单的路径（默认由 infoPath 推导）
 */
export function resolveOaDetailRoute(
  infoPath: string,
  menuActivePath?: string,
) {
  return (row: any) => {
    if (
      row.processStatus === BpmProcessInstanceStatus.RUNNING &&
      row.processInstanceId
    ) {
      return {
        path: BPM_DETAIL_PATH,
        query: buildBpmDetailQuery(
          row.processInstanceId,
          infoPath,
          menuActivePath,
        ),
      };
    }
    return {
      path: infoPath,
      query: { id: row.id },
    };
  };
}

/**
 * handleDetail 使用的路由解析函数
 */
export function getOaDetailRoute(
  row: any,
  infoPath: string,
  menuActivePath?: string,
): { path: string; query: Record<string, any> } {
  if (
    row.processStatus === BpmProcessInstanceStatus.RUNNING &&
    row.processInstanceId
  ) {
    return {
      path: BPM_DETAIL_PATH,
      query: buildBpmDetailQuery(
        row.processInstanceId,
        infoPath,
        menuActivePath,
      ),
    };
  }
  return {
    path: infoPath,
    query: { id: row.id },
  };
}

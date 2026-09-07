import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

/** 活动实例生成站内信模板编码 */
export const EDU_ACTIVITY_INSTANCE_CREATED = 'EDU_ACTIVITY_INSTANCE_CREATED';

/** 学生报名页路由 */
export const ACTIVITY_INSTANCE_ENROLL_PATH = '/edu/activity/instance/enroll';

export function parseNotifyTemplateParams(
  params: SystemNotifyMessageApi.NotifyMessage['templateParams'],
): Record<string, any> {
  if (!params) {
    return {};
  }
  if (typeof params === 'string') {
    try {
      return JSON.parse(params) as Record<string, any>;
    } catch {
      return {};
    }
  }
  if (typeof params === 'object') {
    return params as Record<string, any>;
  }
  return {};
}

/**
 * 解析站内信中的「去报名」跳转；无报名意图时返回 undefined。
 */
export function resolveActivityEnrollAction(
  message: Pick<
    SystemNotifyMessageApi.NotifyMessage,
    'templateCode' | 'templateParams'
  >,
): { link: string; query?: Record<string, string>; actionText: string } | undefined {
  if (message.templateCode !== EDU_ACTIVITY_INSTANCE_CREATED) {
    return undefined;
  }
  const params = parseNotifyTemplateParams(message.templateParams);
  const instanceCode =
    params.instanceCode != null && String(params.instanceCode).length > 0
      ? String(params.instanceCode)
      : undefined;
  return {
    link: ACTIVITY_INSTANCE_ENROLL_PATH,
    query: instanceCode ? { instanceCode } : undefined,
    actionText: '去报名',
  };
}

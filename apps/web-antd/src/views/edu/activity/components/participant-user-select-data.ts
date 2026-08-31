import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { CommonStatusEnum } from '@vben/constants';

import { getUserPage } from '#/api/system/user';

/** 参与人候选角色 */
export const PARTICIPANT_INCLUDE_ROLE_CODES = 'student,teacher';

/** 选择弹窗 - 搜索条件 */
export function useParticipantUserSelectFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'username',
      label: '用户账号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户账号',
      },
    },
    {
      fieldName: 'nickname',
      label: '姓名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入姓名',
      },
    },
    // {
    //   fieldName: 'mobile',
    //   label: '手机号码',
    //   component: 'Input',
    //   componentProps: {
    //     allowClear: true,
    //     placeholder: '请输入手机号码',
    //   },
    // },
  ];
}

/** 选择弹窗 - 表格列 */
export function useParticipantUserSelectColumns(): VxeGridProps['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
      align: 'center',
    },
    // {
    //   title: 'ID',
    //   field: 'id',
    //   minWidth: 50,
    // },
    {
      title: '用户账号',
      field: 'username',
      minWidth: 120,
    },
    {
      title: '姓名',
      field: 'nickname',
      minWidth: 120,
    },
    {
      title: '手机号码',
      field: 'mobile',
      minWidth: 130,
    },
  ];
}

/** 按 ID 批量加载参与人（回显用） */
export async function fetchParticipantUsersByIds(userIds: number[]) {
  const normalizedIds = userIds
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));
  if (normalizedIds.length === 0) {
    return [];
  }
  const { list } = await getUserPage({
    pageNo: 1,
    pageSize: normalizedIds.length,
    userIds: normalizedIds,
    status: CommonStatusEnum.ENABLE,
    includeRoleCodes: PARTICIPANT_INCLUDE_ROLE_CODES,
  });
  return list ?? [];
}

/** 选择弹窗 - 分页查询 */
export async function queryParticipantUserSelectPage(
  page: { currentPage: number; pageSize: number },
  formValues: Record<string, unknown>,
) {
  return await getUserPage({
    pageNo: page.currentPage,
    pageSize: page.pageSize,
    status: CommonStatusEnum.ENABLE,
    includeRoleCodes: PARTICIPANT_INCLUDE_ROLE_CODES,
    ...formValues,
  });
}

/** 合并跨页已选用户并去重 */
export function mergeSelectedUsers(
  users: SystemUserApi.User[],
): SystemUserApi.User[] {
  const map = new Map<number, SystemUserApi.User>();
  users.forEach((user) => {
    if (user.id != null) {
      map.set(user.id, user);
    }
  });
  return [...map.values()];
}

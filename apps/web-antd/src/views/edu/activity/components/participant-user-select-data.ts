import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { CommonStatusEnum } from '@vben/constants';

import { getUserPage } from '#/api/system/user';

/** 参与人展示名：姓名(账号) */
export function formatParticipantDisplayName(user: SystemUserApi.User) {
  const nickname = user.nickname?.trim();
  const username = user.username?.trim();
  if (nickname && username) {
    return `${nickname}(${username})`;
  }
  return nickname || username || '';
}

/** 是否学生账号（S 开头） */
export function isStudentAccount(account?: string) {
  return /^S/i.test(account?.trim() ?? '');
}

/** 是否教培账号（T 开头） */
export function isTeacherAccount(account?: string) {
  return /^T/i.test(account?.trim() ?? '');
}

export function formatParticipantNameList(users: SystemUserApi.User[]) {
  return users
    .map((user) => formatParticipantDisplayName(user))
    .filter(Boolean)
    .join('、');
}

/** 按账号前缀拆分参与人：T=教培，S=学生 */
export function splitParticipantUsersByAccount(users: SystemUserApi.User[]) {
  const teachers: SystemUserApi.User[] = [];
  const students: SystemUserApi.User[] = [];
  users.forEach((user) => {
    const account = user.username?.trim() ?? '';
    if (isStudentAccount(account)) {
      students.push(user);
    } else if (isTeacherAccount(account)) {
      teachers.push(user);
    }
  });
  return { teachers, students };
}

/** 从展示名解析账号，如 小王(S002) → S002 */
function extractAccountFromDisplayName(item: string) {
  return item.match(/\(([^)]+)\)$/)?.[1]?.trim() ?? '';
}

/** 参与人 Tag 默认展示上限（超出部分通过 Popover 查看） */
export const PARTICIPANT_TAG_VISIBLE_LIMIT = {
  teachers: 20,
  students: 20,
} as const;

/** 截取可见 Tag，其余放入 overflow */
export function sliceTagsForDisplay(tags: string[], maxVisible: number) {
  if (tags.length <= maxVisible) {
    return { visible: tags, overflow: [] as string[] };
  }
  return {
    visible: tags.slice(0, maxVisible),
    overflow: tags.slice(maxVisible),
  };
}

/** 将展示名按账号前缀拆分：T=教培，S=学生 */
export function splitParticipantDisplayNames(names: string) {
  const teachers: string[] = [];
  const students: string[] = [];
  names
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const account = extractAccountFromDisplayName(item);
      if (isStudentAccount(account)) {
        students.push(item);
      } else if (isTeacherAccount(account)) {
        teachers.push(item);
      }
    });
  return { teachers, students };
}

/** 参与人候选角色 */
export const PARTICIPANT_INCLUDE_ROLE_CODES = 'student,teacher';

/** 选择弹窗 - 搜索条件 */
export function useParticipantUserSelectFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'roleCode',
      label: '角色',
      component: 'Select',
      componentProps: {
        allowClear: true,
        placeholder: '全部（教培/学生）',
        options: [
          { label: '教培', value: 'teacher' },
          { label: '学生', value: 'student' },
        ],
      },
    },
    {
      fieldName: 'username',
      label: '用户账号',
      component: 'Input',
      formItemClass: 'col-span-1',
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
  const { roleCode, ...rest } = formValues;
  const includeRoleCodes =
    typeof roleCode === 'string' && roleCode.trim()
      ? roleCode.trim()
      : PARTICIPANT_INCLUDE_ROLE_CODES;
  return await getUserPage({
    pageNo: page.currentPage,
    pageSize: page.pageSize,
    status: CommonStatusEnum.ENABLE,
    includeRoleCodes,
    ...rest,
  });
}

/** 校验参与人须同时包含教培与学生 */
export function validateParticipantTeacherAndStudent(users: SystemUserApi.User[]) {
  const { teachers, students } = splitParticipantUsersByAccount(users);
  if (teachers.length === 0) {
    return { valid: false, message: '请至少选择一名教培参与人' };
  }
  if (students.length === 0) {
    return { valid: false, message: '请至少选择一名学生参与人' };
  }
  return { valid: true };
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

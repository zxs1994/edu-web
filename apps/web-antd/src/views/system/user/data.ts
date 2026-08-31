import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemPostApi } from '#/api/system/post';
import type { SystemRoleApi } from '#/api/system/role';
import type { SystemUserApi } from '#/api/system/user';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { $t } from '@vben/locales';
import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getDeptList } from '#/api/system/dept';
import { getSimplePostList } from '#/api/system/post';
import { getSimpleRoleList } from '#/api/system/role';
import { getRangePickerDefaultProps } from '#/utils';

/** 是否为学生/教培身份账号 */
export function isFixedIdentityUser(
  roleIds: (number | string)[] | undefined,
  roleList?: SystemRoleApi.Role[],
) {
  const ids = (roleIds ?? []).map(Number);
  if (ids.length === 0 || !roleList?.length) {
    return false;
  }
  return roleList.some(
    (role) =>
      ids.includes(Number(role.id)) &&
      (role.code === 'student' || role.code === 'teacher'),
  );
}

export interface UserFormSchemaOptions {
  /** 编辑学生/教培用户时为 true */
  isFixedIdentity?: boolean;
}

/** 新增/修改的表单 */
export function useFormSchema(options?: UserFormSchemaOptions): VbenFormSchema[] {
  const isFixedIdentity = options?.isFixedIdentity ?? false;

  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'username',
      label: '用户账号',
      component: 'Input',
      rules: 'required',
      dependencies: {
        triggerFields: ['id'],
        componentProps() {
          return {
            placeholder: isFixedIdentity
              ? '账号由档案维护，不可修改'
              : '请输入用户账号',
            disabled: isFixedIdentity,
          };
        },
      },
    },
    {
      label: '用户密码',
      fieldName: 'password',
      component: 'InputPassword',
      rules: 'required',
      dependencies: {
        triggerFields: ['id'],
        show: (values) => !values.id,
      },
    },
    {
      fieldName: 'nickname',
      label: '用户昵称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户昵称',
      },
      rules: 'required',
    },
    {
      fieldName: 'deptId',
      label: '归属部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const data = await getDeptList();
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择归属部门',
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'postIds',
      label: '岗位',
      component: 'ApiSelect',
      componentProps: {
        api: getSimplePostList,
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择岗位',
      },
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
      rules: z.string().email('邮箱格式不正确').or(z.literal('')).optional(),
      componentProps: {
        placeholder: '请输入邮箱',
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号码',
      },
      dependencies: {
        triggerFields: ['id'],
        rules() {
          if (isFixedIdentity) {
            return 'mobileRequired';
          }
          return z.string().optional();
        },
      },
    },
    {
      fieldName: 'sex',
      label: '用户性别',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'status',
      label: '用户状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 重置密码的表单 */
export function useResetPasswordFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
      dependencies: {
        rules(values) {
          return z
            .string({ message: '请输入新密码' })
            .min(5, '密码长度不能少于 5 个字符')
            .max(20, '密码长度不能超过 20 个字符')
            .refine(
              (value) => value !== values.oldPassword,
              '新旧密码不能相同',
            );
        },
        triggerFields: ['newPassword', 'oldPassword'],
      },
      fieldName: 'newPassword',
      label: '新密码',
      rules: 'required',
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.confirmPassword'),
      },
      dependencies: {
        rules(values) {
          return z
            .string({ message: '请输入确认密码' })
            .min(5, '密码长度不能少于 5 个字符')
            .max(20, '密码长度不能超过 20 个字符')
            .refine(
              (value) => value === values.newPassword,
              '新密码和确认密码不一致',
            );
        },
        triggerFields: ['newPassword', 'confirmPassword'],
      },
      fieldName: 'confirmPassword',
      label: '确认密码',
      rules: 'required',
    },
  ];
}

/** 分配角色的表单 */
export function useAssignRoleFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'username',
      label: '用户账号',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'nickname',
      label: '用户昵称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'roleIds',
      label: '角色',
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const list = await getSimpleRoleList();
          return list.filter(
            (role) => role.code !== 'student' && role.code !== 'teacher',
          );
        },
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择角色',
      },
    },
  ];
}

/** 用户导入的表单 */
export function useImportFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'file',
      label: '用户数据',
      component: 'Upload',
      rules: 'required',
      help: '仅允许导入 xls、xlsx 格式文件',
    },
    {
      fieldName: 'updateSupport',
      label: '是否覆盖',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
      help: '是否更新已经存在的用户数据',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'username',
      label: '用户账号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户账号',
        allowClear: true,
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号码',
        allowClear: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  onStatusChange?: (
    newStatus: number,
    row: SystemUserApi.User,
  ) => PromiseLike<boolean | undefined>,
  postList?: SystemPostApi.Post[],
  roleList?: SystemRoleApi.Role[],
): VxeTableGridOptions['columns'] {
  const postMap = new Map(
    (postList ?? []).map((p) => [Number(p.id), p]),
  );
  const roleMap = new Map(
    (roleList ?? []).map((r) => [Number(r.id), r]),
  );
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'username',
      title: '用户账号',
      minWidth: 120,
    },
    {
      field: 'nickname',
      title: '用户昵称',
      minWidth: 120,
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 120,
    },
    {
      field: 'postIds',
      title: '岗位',
      minWidth: 140,
      sortable: true,
      formatter({ row }) {
        const ids: (number | string)[] = row.postIds ?? [];
        return ids
          .map((id: number | string) => postMap.get(Number(id))?.name ?? '')
          .filter(Boolean)
          .join('、');
      },
      sortType: 'number',
      sortBy({ row }) {
        const ids: (number | string)[] = row.postIds ?? [];
        if (ids.length === 0) return Number.MAX_SAFE_INTEGER;
        const post = postMap.get(Number(ids[0]));
        return post?.sort ?? Number.MAX_SAFE_INTEGER;
      },
    },
    {
      field: 'roleIds',
      title: '角色',
      minWidth: 140,
      formatter({ row }) {
        const ids: (number | string)[] = row.roleIds ?? [];
        return ids
          .map((id: number | string) => roleMap.get(Number(id))?.name ?? '')
          .filter(Boolean)
          .join('、');
      },
    },
    // {
    //   field: 'mobile',
    //   title: '手机号码',
    //   minWidth: 120,
    // },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          checkedValue: CommonStatusEnum.ENABLE,
          unCheckedValue: CommonStatusEnum.DISABLE,
        },
      },
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

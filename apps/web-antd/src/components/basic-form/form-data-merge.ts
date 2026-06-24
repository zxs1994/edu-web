/**
 * 由父组件 formData ref 直接维护、不在 Vben 表单 schema 内的字段。
 * 这些字段通过插槽 v-model 更新时，不应触发整表 setValues 覆盖用户已填写的表单项。
 */
export const PARENT_MANAGED_FORM_DATA_KEYS = [
  'attachments',
  'details',
  'itineraries',
  'contractDetails',
  'paymentPlans',
  'files',
] as const;

export type ParentManagedFormDataKey =
  (typeof PARENT_MANAGED_FORM_DATA_KEYS)[number];

function isParentManagedKey(key: string): key is ParentManagedFormDataKey {
  return (PARENT_MANAGED_FORM_DATA_KEYS as readonly string[]).includes(key);
}

/** 对比 formData 前后变化字段 */
export function getFormDataChangedKeys(
  newData: Record<string, any>,
  oldData?: Record<string, any>,
): string[] {
  if (!oldData) {
    return Object.keys(newData);
  }
  const keys = new Set([...Object.keys(newData), ...Object.keys(oldData)]);
  return [...keys].filter((key) => newData[key] !== oldData[key]);
}

/** 是否仅为插槽子表/附件等父级托管字段变更 */
export function isOnlyParentManagedFormDataChange(
  newData: Record<string, any>,
  oldData?: Record<string, any>,
): boolean {
  if (!oldData) {
    return false;
  }
  const changedKeys = getFormDataChangedKeys(newData, oldData);
  return (
    changedKeys.length > 0 &&
    changedKeys.every((key) => isParentManagedKey(key))
  );
}

/** 合并 formData 与表单当前值：父级托管字段以 formData 为准；formData 空值不覆盖用户已填表单项 */
export function mergeFormDataProp(
  newData: Record<string, any>,
  currentValues: Record<string, any>,
): Record<string, any> {
  const merged = { ...currentValues, ...newData };

  for (const key of PARENT_MANAGED_FORM_DATA_KEYS) {
    if (key in newData) {
      merged[key] = newData[key];
    }
  }

  for (const key of Object.keys(newData)) {
    if (isParentManagedKey(key)) {
      continue;
    }
    const formVal = currentValues[key];
    const propVal = newData[key];
    const formHasValue =
      formVal !== undefined && formVal !== null && formVal !== '';
    const propIsEmpty =
      propVal === undefined || propVal === null || propVal === '';
    if (formHasValue && propIsEmpty) {
      merged[key] = formVal;
    }
  }

  return merged;
}

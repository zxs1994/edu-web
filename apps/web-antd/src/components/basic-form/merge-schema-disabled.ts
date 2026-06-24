import type { VbenFormSchema } from '#/adapter/form';

/** 合并表单 disabled 状态，保留函数式 componentProps 的 options 等配置 */
export function mergeSchemaDisabled(
  schema: VbenFormSchema[],
  disabled: boolean,
): VbenFormSchema[] {
  return schema.map((item) => {
    const componentProps = item.componentProps;

    if (typeof componentProps === 'function') {
      return {
        ...item,
        componentProps: (values: any, formApi: any) => {
          const originalProps = componentProps(values, formApi) || {};
          const hasCustomDisabled =
            'disabled' in originalProps &&
            typeof originalProps.disabled === 'function';
          return {
            ...originalProps,
            disabled: hasCustomDisabled
              ? originalProps.disabled()
              : disabled,
          };
        },
      };
    }

    const hasCustomDisabled =
      componentProps &&
      typeof componentProps === 'object' &&
      'disabled' in componentProps &&
      typeof componentProps.disabled === 'function';

    return {
      ...item,
      componentProps: {
        ...(typeof componentProps === 'object' ? componentProps : {}),
        disabled: hasCustomDisabled ? componentProps.disabled() : disabled,
      },
    };
  });
}

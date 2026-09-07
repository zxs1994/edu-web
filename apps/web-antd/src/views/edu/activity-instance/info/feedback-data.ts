import type { VbenFormSchema } from '@vben/common-ui';

const rateProps = (readonly: boolean) => ({
  count: 5,
  allowClear: !readonly,
  disabled: readonly,
});

/** 学生反馈表单 */
export function useStudentFeedbackFormSchema(readonly: boolean): VbenFormSchema[] {
  return [
    {
      fieldName: 'satisfaction',
      label: '满意度',
      component: 'Rate',
      rules: readonly ? undefined : 'required',
      componentProps: rateProps(readonly),
    },
    {
      fieldName: 'harvest',
      label: '收获',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: readonly ? undefined : '请输入收获（可选）',
        maxlength: 500,
        showCount: !readonly,
        disabled: readonly,
      },
    },
    {
      fieldName: 'content',
      label: '文字评价',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: readonly ? undefined : '请输入文字评价（可选）',
        maxlength: 2000,
        showCount: !readonly,
        disabled: readonly,
      },
    },
  ];
}

/** 教培反馈表单 */
export function useTeacherFeedbackFormSchema(readonly: boolean): VbenFormSchema[] {
  return [
    {
      fieldName: 'summary',
      label: '执行总结',
      rules: 'required',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: '请输入执行总结',
        maxlength: 2000,
        showCount: true,
        disabled: readonly,
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'problem',
      label: '问题',
      component: 'Textarea',
      componentProps: {
        rows: 2,
        placeholder: '请输入问题（可选）',
        maxlength: 2000,
        showCount: true,
        disabled: readonly,
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'suggestion',
      label: '建议',
      component: 'Textarea',
      componentProps: {
        rows: 2,
        placeholder: '请输入建议（可选）',
        maxlength: 2000,
        showCount: true,
        disabled: readonly,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 班务评价表单 */
export function useAdminFeedbackFormSchema(readonly: boolean): VbenFormSchema[] {
  return [
    {
      fieldName: 'qualityScore',
      label: '质量评分',
      component: 'Rate',
      rules: 'required',
      componentProps: rateProps(readonly),
    },
    {
      fieldName: 'closingOpinion',
      label: '结项意见',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: '请输入结项意见（可选）',
        maxlength: 2000,
        showCount: true,
        disabled: readonly,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

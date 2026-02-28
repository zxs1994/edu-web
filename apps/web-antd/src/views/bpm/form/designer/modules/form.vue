<script lang="ts" setup>
import type { FcDesigner } from '@form-create/antd-designer';

import type { BpmFormApi } from '#/api/bpm/form';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createForm, updateForm } from '#/api/bpm/form';
import { encodeConf, encodeFields } from '#/components/form-create';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const designerComponent = ref<InstanceType<typeof FcDesigner>>();
const formData = ref<BpmFormApi.Form>();
const editorAction = ref<string>();

const getTitle = computed(() => {
  if (!formData.value?.id) {
    return $t('ui.actionTitle.create', ['流程表单']);
  }
  return editorAction.value === 'copy'
    ? $t('ui.actionTitle.copy', ['流程表单'])
    : $t('ui.actionTitle.edit', ['流程表单']);
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 从设计器规则中递归提取字段信息（field、title） */
function extractDesignerFields(ruleList: any[]) {
  const options: Array<{ label: string; value: string }> = [];

  function traverse(rules: any[]) {
    for (const rule of rules) {
      if (rule.field && rule.title) {
        options.push({ label: rule.title, value: rule.field });
      }
      if (rule.children && Array.isArray(rule.children)) {
        traverse(rule.children);
      }
    }
  }

  traverse(ruleList);
  return { options };
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    try {
      // 获取表单数据
      const data = (await formApi.getValues()) as BpmFormApi.Form;

      // 获取摘要字段选择
      const summaryFields: string[] = (data as any).summaryFields || [];

      // 编码表单配置和表单字段
      data.conf = encodeConf(designerComponent);
      data.fields = encodeFields(designerComponent);

      // 将 showInSummary 注入到每个 field JSON 中（因为 formCreate.toJson 不会序列化自定义属性）
      // 无论是否选择了摘要字段，都需要注入，以便清空时能正确移除旧的 showInSummary: true
      data.fields = data.fields.map((fieldJson: string) => {
        try {
          const fieldObj = JSON.parse(fieldJson);
          if (fieldObj.field) {
            fieldObj.showInSummary = summaryFields.includes(fieldObj.field);
          }
          return JSON.stringify(fieldObj);
        } catch {
          return fieldJson;
        }
      });

      // 移除 summaryFields（非后端字段，仅用于前端控制）
      delete (data as any).summaryFields;

      // 保存表单数据
      if (formData.value?.id) {
        await (editorAction.value === 'copy'
          ? createForm(data)
          : updateForm(data));
      } else {
        await createForm(data);
      }
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },

  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      designerComponent.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<any>();
    if (!data) {
      return;
    }
    modalApi.lock();
    // 设置表单设计器组件
    designerComponent.value = data.designer;
    formData.value = data.formConfig;
    editorAction.value = data.action;
    // 如果是复制，表单名称后缀添加 _copy ，id 置空
    if (editorAction.value === 'copy' && formData.value) {
      formData.value = {
        ...formData.value,
        name: `${formData.value.name}_copy`,
        id: undefined,
      };
    }
    try {
      // 设置到 values
      if (formData.value) {
        await formApi.setValues(formData.value);
      }

      // 解析设计器中的表单字段，动态填充「摘要字段」多选选项
      if (designerComponent.value) {
        const rules = designerComponent.value.getRule();
        const { options } = extractDesignerFields(rules);

        // 从原始 fields JSON 中解析已保存的 showInSummary 状态（更可靠）
        const selectedFields: string[] = [];
        if (formData.value?.fields) {
          for (const fieldJson of formData.value.fields) {
            try {
              const fieldObj = JSON.parse(fieldJson);
              if (fieldObj.field && fieldObj.showInSummary === true) {
                selectedFields.push(fieldObj.field);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }

        // 更新摘要字段的下拉选项
        await formApi.updateSchema([
          {
            fieldName: 'summaryFields',
            componentProps: { options },
          },
        ]);
        // 回显已选中的摘要字段
        if (selectedFields.length > 0) {
          await formApi.setValues({ summaryFields: selectedFields });
        }
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>

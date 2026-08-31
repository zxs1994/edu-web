<script lang="ts" setup>
import type { TeacherApi } from '#/api/edu/teacher';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, message, Space } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createTeacher, getTeacher, updateTeacher } from '#/api/edu/teacher';
import { CardContainer } from '#/components/basic-form';

import { useBasicFormSchema } from './data';

defineOptions({ name: 'EduTeacherInfo' });

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();

const formData = ref<Partial<TeacherApi.Teacher>>({});
const readonly = ref(false);
const loading = ref(false);

const [BasicForm, basicFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 120,
  },
  wrapperClass: 'grid grid-cols-2 gap-4',
  layout: 'horizontal',
  schema: useBasicFormSchema({ isCreate: true }),
  showDefaultActions: false,
});

const pageTitle = computed(() => {
  if (readonly.value) {
    return '查看教培档案';
  }
  return formData.value.id ? '编辑教培档案' : '新增教培档案';
});

function refreshSchema() {
  const id = formData.value.id ?? route.query.id;
  const isCreate = !id;
  const schema = useBasicFormSchema({ isCreate, readonly: readonly.value }).map(
    (item) => ({
      ...item,
      componentProps: {
        ...(typeof item.componentProps === 'object' ? item.componentProps : {}),
        disabled: readonly.value || (item.componentProps as { disabled?: boolean })?.disabled,
      },
    }),
  );
  basicFormApi.updateSchema(schema);
}

async function loadData(newId?: string | number) {
  const id = newId || (route.query.id as string);
  if (!id) {
    formData.value = {};
    await basicFormApi.setValues({ sex: 1 });
    refreshSchema();
    return;
  }

  loading.value = true;
  try {
    const data = await getTeacher(Number(id));
    formData.value = data;
    await basicFormApi.setValues(data);
    refreshSchema();
  } catch (error) {
    console.error('加载教培档案失败', error);
    message.error('加载教培档案失败');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  const basicValid = await basicFormApi.validate();
  if (!basicValid.valid) {
    return;
  }

  loading.value = true;
  try {
    const values = (await basicFormApi.getValues()) as TeacherApi.Teacher;

    if (formData.value.id) {
      values.id = formData.value.id;
      await updateTeacher(values);
      message.success('保存成功');
    } else {
      const result = await createTeacher(values);
      message.success(
        `新增成功，登录账号：${result.username}，初始密码：${result.initPassword}`,
      );
    }
    closeCurrentTab();
    await router.push({ path: '/edu/teacher-list' });
  } catch (error) {
    console.error('保存失败', error);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  closeCurrentTab();
  router.go(-1);
}

watch(readonly, () => refreshSchema());

onMounted(async () => {
  readonly.value = route.query.readonly === 'true';
  await loadData();
});
</script>

<template>
  <Page :loading="loading" :title="pageTitle" auto-content-height>
    <template #extra>
      <Space>
        <Button @click="handleClose">关闭</Button>
        <Button v-if="!readonly" type="primary" @click="handleSave">
          保存
        </Button>
      </Space>
    </template>

    <div class="mb-4 rounded-lg bg-white p-4 shadow-sm">
      <CardContainer title="基本信息">
        <BasicForm />
      </CardContainer>
    </div>
  </Page>
</template>

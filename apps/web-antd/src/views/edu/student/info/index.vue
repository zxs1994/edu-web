<script lang="ts" setup>
import type { StudentApi } from '#/api/edu/student';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, message, Space } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createStudent, getStudent, updateStudent } from '#/api/edu/student';
import { CardContainer } from '#/components/basic-form';

import { useBasicFormSchema } from './data';

defineOptions({ name: 'EduStudentInfo' });

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();

const formData = ref<Partial<StudentApi.Student>>({});
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
    return '查看学生档案';
  }
  return formData.value.id ? '编辑学生档案' : '新增学生档案';
});

function refreshSchema() {
  const isCreate = !formData.value.id;
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
    await basicFormApi.setValues({ sex: 1, schoolStatus: 1 });
    refreshSchema();
    return;
  }

  loading.value = true;
  try {
    const data = await getStudent(Number(id));
    formData.value = data;
    await basicFormApi.setValues(data);
    refreshSchema();
  } catch (error) {
    console.error('加载学生档案失败', error);
    message.error('加载学生档案失败');
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
    const values = (await basicFormApi.getValues()) as StudentApi.Student;
    if (!values.birthday || values.birthday === '') {
      values.birthday = undefined;
    }

    if (formData.value.id) {
      values.id = formData.value.id;
      await updateStudent(values);
      message.success('保存成功');
    } else {
      const result = await createStudent(values);
      message.success(
        `新增成功，登录账号：${result.username}，初始密码：${result.initPassword}`,
      );
    }
    closeCurrentTab();
    await router.push({ path: '/edu/student-list' });
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

watch(readonly, () => refreshSchema(), { immediate: true });

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

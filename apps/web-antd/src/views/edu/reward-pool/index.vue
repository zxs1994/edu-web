<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RewardPoolApi } from '#/api/edu/reward-pool';

import { computed, onActivated, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Button, Card, Col, Modal, Row, Space, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  adjustRewardPool,
  getRewardPool,
  getRewardPoolTxnPage,
  updateRewardPool,
  updateRewardPoolStatus,
} from '#/api/edu/reward-pool';
import { DictTag } from '#/components/dict-tag';

import {
  formatMoney,
  useAdjustFormSchema,
  useTxnGridColumns,
  useTxnGridFormSchema,
  useUpdateFormSchema,
} from './data';

defineOptions({ name: 'EduRewardPool' });

const { hasAccessByCodes } = useAccess();
const canUpdate = computed(() => hasAccessByCodes(['edu:reward-pool:update']));

const loading = ref(false);
const pool = ref<RewardPoolApi.RewardPool>();
const adjustDirection = ref<'DOWN' | 'UP'>('UP');

const adjustModalTitle = computed(() =>
  adjustDirection.value === 'UP' ? '充值' : '调减',
);

const [UpdateForm, updateFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 80,
  },
  wrapperClass: 'grid grid-cols-1 gap-4',
  layout: 'vertical',
  schema: useUpdateFormSchema(),
  showDefaultActions: false,
});

const [UpdateModal, updateModalApi] = useVbenModal({
  class: 'w-[520px]',
  async onConfirm() {
    if (!pool.value?.id) {
      return;
    }
    const { valid } = await updateFormApi.validate();
    if (!valid) {
      return;
    }
    updateModalApi.lock();
    try {
      const values = await updateFormApi.getValues();
      await updateRewardPool({
        id: pool.value.id,
        name: values.name,
        remark: values.remark,
      });
      message.success('保存成功');
      await updateModalApi.close();
      await loadPool();
    } finally {
      updateModalApi.unlock();
    }
  },
});

const [AdjustForm, adjustFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 80,
  },
  wrapperClass: 'grid grid-cols-1 gap-4',
  layout: 'vertical',
  schema: useAdjustFormSchema(),
  showDefaultActions: false,
});

const [AdjustModal, adjustModalApi] = useVbenModal({
  class: 'w-[520px]',
  async onConfirm() {
    const { valid } = await adjustFormApi.validate();
    if (!valid) {
      return;
    }
    adjustModalApi.lock();
    try {
      const values = await adjustFormApi.getValues();
      await adjustRewardPool({
        direction: adjustDirection.value,
        amount: Number(values.amount),
        remark: values.remark,
      });
      message.success(adjustDirection.value === 'UP' ? '充值成功' : '调减成功');
      await adjustModalApi.close();
      await loadPool();
      gridApi.query();
    } finally {
      adjustModalApi.unlock();
    }
  },
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useTxnGridFormSchema(),
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    collapsed: false,
  },
  gridOptions: {
    id: 'edu-reward-pool-txn',
    columns: useTxnGridColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRewardPoolTxnPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            poolId: pool.value?.id,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      refreshOptions: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<RewardPoolApi.RewardPoolTxn>,
});

async function loadPool() {
  loading.value = true;
  try {
    pool.value = await getRewardPool();
  } finally {
    loading.value = false;
  }
}

function openUpdateModal() {
  if (!pool.value) {
    return;
  }
  updateFormApi.setValues({
    name: pool.value.name,
    remark: pool.value.remark ?? '',
  });
  updateModalApi.open();
}

function openAdjustModal(direction: 'DOWN' | 'UP') {
  adjustDirection.value = direction;
  adjustFormApi.resetForm();
  adjustFormApi.setValues({ amount: undefined, remark: '' });
  adjustModalApi.open();
}

function handleToggleStatus() {
  if (!pool.value?.id) {
    return;
  }
  const disable = pool.value.status === 0;
  Modal.confirm({
    title: disable ? '确认停用奖金池？' : '确认启用奖金池？',
    content: disable
      ? '停用后将无法充值或调减，仍可查看流水。'
      : '启用后可继续充值或调减。',
    async onOk() {
      await updateRewardPoolStatus({
        id: pool.value!.id!,
        status: disable ? 1 : 0,
      });
      message.success(disable ? '已停用' : '已启用');
      await loadPool();
    },
  });
}

onActivated(async () => {
  await loadPool();
  gridApi.query();
});
</script>

<template>
  <Page auto-content-height content-class="flex flex-col gap-4 overflow-hidden">
    <Card :loading="loading" class="shrink-0">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-xl font-semibold">{{ pool?.name || '奖金池' }}</span>
          <DictTag
            v-if="pool?.status != null"
            :value="pool.status"
            :type="DICT_TYPE.EDU_REWARD_POOL_STATUS"
          />
        </div>
        <Space wrap v-if="canUpdate">
          <Button @click="openUpdateModal">改名</Button>
          <Button
            type="primary"
            :disabled="pool?.status === 1"
            @click="openAdjustModal('UP')"
          >
            充值
          </Button>
          <Button
            :disabled="pool?.status === 1"
            @click="openAdjustModal('DOWN')"
          >
            调减
          </Button>
          <Button @click="handleToggleStatus">
            {{ pool?.status === 0 ? '停用' : '启用' }}
          </Button>
        </Space>
      </div>

      <Row :gutter="[16, 16]">
        <Col :xs="24" :sm="12" :lg="6">
          <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <div class="mb-1 text-sm text-gray-500">总预算</div>
            <div class="text-2xl font-semibold">
              {{ formatMoney(pool?.totalBudget) }}
            </div>
          </div>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <div class="mb-1 text-sm text-gray-500">已冻结</div>
            <div class="text-2xl font-semibold">
              {{ formatMoney(pool?.frozenAmount) }}
            </div>
          </div>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <div class="mb-1 text-sm text-gray-500">已实发</div>
            <div class="text-2xl font-semibold">
              {{ formatMoney(pool?.paidAmount) }}
            </div>
          </div>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <div class="mb-1 text-sm text-gray-500">可用余额</div>
            <div class="text-2xl font-semibold">
              {{ formatMoney(pool?.availableAmount) }}
            </div>
          </div>
        </Col>
      </Row>
      <div v-if="pool?.remark" class="mt-3 text-sm text-gray-500">
        备注：{{ pool.remark }}
      </div>
    </Card>

    <Grid class="min-h-0 flex-1" table-title="资金流水" />

    <UpdateModal title="修改奖金池">
      <UpdateForm />
    </UpdateModal>
    <AdjustModal :title="adjustModalTitle">
      <AdjustForm />
    </AdjustModal>
  </Page>
</template>

<script lang="ts" setup>
import type { RewardPoolApi } from '#/api/edu/reward-pool';

import { computed, onActivated, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Col,
  Drawer,
  Modal,
  Row,
  Select,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createBudgetYear,
  getBudgetExecution,
  getBudgetExecutionDetail,
  getBudgetYearList,
  updateBudgetPeriod,
  updateBudgetYear,
} from '#/api/edu/reward-pool';
import { DictTag } from '#/components/dict-tag';

import {
  formatMoney,
  formatRate,
  resolveDefaultBudgetYear,
  useCreateYearFormSchema,
  usePeriodEditFormSchema,
  useResetBudgetFormSchema,
  useSwitchModeFormSchema,
} from './data';

defineOptions({ name: 'EduRewardPool' });

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const canUpdate = computed(() => hasAccessByCodes(['edu:reward-pool:update']));
const canQuery = computed(() => hasAccessByCodes(['edu:reward-pool:query']));

const budgetLoading = ref(false);
const yearList = ref<RewardPoolApi.BudgetYear[]>([]);
const selectedYear = ref<number>();
const execution = ref<RewardPoolApi.BudgetExecution>();
const editingPeriod = ref<RewardPoolApi.PeriodExecution>();

const currentYearMeta = computed(() =>
  yearList.value.find((item) => item.budgetYear === selectedYear.value),
);

const isCustomMode = computed(
  () =>
    (execution.value?.periodMode ?? currentYearMeta.value?.periodMode) ===
    'CUSTOM',
);

const yearOptions = computed(() =>
  yearList.value.map((item) => ({
    label: `${item.budgetYear} 年`,
    value: item.budgetYear!,
  })),
);

const periodColumns = computed(() => {
  const cols: any[] = [
    { title: '时段', dataIndex: 'name', key: 'name', width: 100 },
    {
      title: '开始',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: '结束',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
    },
    {
      title: '预算',
      dataIndex: 'budgetAmount',
      key: 'budgetAmount',
      width: 120,
    },
    {
      title: '已执行',
      dataIndex: 'executedAmount',
      key: 'executedAmount',
      width: 140,
    },
    {
      title: '执行率',
      dataIndex: 'executionRate',
      key: 'executionRate',
      width: 100,
    },
  ];
  if (canUpdate.value) {
    cols.push({
      title: '操作',
      key: 'action',
      width: isCustomMode.value ? 140 : 90,
      fixed: 'right',
    });
  }
  return cols;
});

const detailOpen = ref(false);
const detailLoading = ref(false);
const detailPeriod = ref<RewardPoolApi.PeriodExecution>();
const detailPage = ref<RewardPoolApi.ExecutionDetailPage>();
const detailPageNo = ref(1);
const detailPageSize = ref(10);

const detailColumns = [
  { title: '单据编号', dataIndex: 'billCode', key: 'billCode', width: 160 },
  { title: '申请事由', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '活动', dataIndex: 'activityName', key: 'activityName', width: 140 },
  {
    title: '申请人',
    dataIndex: 'applicantUserName',
    key: 'applicantUserName',
    width: 100,
  },
  {
    title: '审批通过时间',
    dataIndex: 'approveTime',
    key: 'approveTime',
    width: 170,
  },
  { title: '原币金额', key: 'totalAmount', width: 130 },
  { title: '锁定汇率', key: 'exchangeRate', width: 110 },
  { title: '折合人民币', dataIndex: 'amountCny', key: 'amountCny', width: 120 },
];

async function loadExecutionDetail() {
  if (!selectedYear.value || !detailPeriod.value?.id) {
    return;
  }
  detailLoading.value = true;
  try {
    detailPage.value = await getBudgetExecutionDetail({
      budgetYear: selectedYear.value,
      periodId: detailPeriod.value.id,
      pageNo: detailPageNo.value,
      pageSize: detailPageSize.value,
    });
  } finally {
    detailLoading.value = false;
  }
}

function openExecutionDetail(row: RewardPoolApi.PeriodExecution) {
  if (!canQuery.value || !row.id || selectedYear.value == null) {
    return;
  }
  detailPeriod.value = row;
  detailPageNo.value = 1;
  detailOpen.value = true;
  loadExecutionDetail();
}

function onDetailPageChange(page: number, pageSize: number) {
  detailPageNo.value = page;
  detailPageSize.value = pageSize;
  loadExecutionDetail();
}

function goPaymentDetail(row: RewardPoolApi.ExecutionDetailItem) {
  if (!row.paymentRequestId) {
    return;
  }
  router.push({
    path: '/edu/activity/payment/info',
    query: {
      id: String(row.paymentRequestId),
      t: String(Date.now()),
    },
  });
}

const [CreateYearForm, createYearFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 90,
  },
  wrapperClass: 'grid grid-cols-1 gap-4',
  layout: 'vertical',
  schema: useCreateYearFormSchema(),
  showDefaultActions: false,
});

const [CreateYearModal, createYearModalApi] = useVbenModal({
  class: 'w-[520px]',
  async onConfirm() {
    const { valid } = await createYearFormApi.validate();
    if (!valid) {
      return;
    }
    createYearModalApi.lock();
    try {
      const values = await createYearFormApi.getValues();
      const year = Number(values.budgetYear);
      const payload: RewardPoolApi.BudgetYearCreateReqVO = {
        budgetYear: year,
        periodMode: values.periodMode,
      };
      if (
        values.periodMode === 'QUARTER' ||
        values.periodMode === 'MONTH'
      ) {
        payload.totalBudget = Number(values.totalBudget) || 0;
      }
      await createBudgetYear(payload);
      message.success('年度预算已创建');
      await createYearModalApi.close();
      await loadBudgetYears(year);
    } finally {
      createYearModalApi.unlock();
    }
  },
});

const [SwitchModeForm, switchModeFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 90,
  },
  wrapperClass: 'grid grid-cols-1 gap-4',
  layout: 'vertical',
  schema: useSwitchModeFormSchema(),
  showDefaultActions: false,
});

const [SwitchModeModal, switchModeModalApi] = useVbenModal({
  class: 'w-[520px]',
  async onConfirm() {
    if (!currentYearMeta.value?.id) {
      return;
    }
    const { valid } = await switchModeFormApi.validate();
    if (!valid) {
      return;
    }
    const values = await switchModeFormApi.getValues();
    const nextMode = values.periodMode as string;
    if (nextMode === currentYearMeta.value.periodMode) {
      message.info('时段模式未变化');
      await switchModeModalApi.close();
      return;
    }
    switchModeModalApi.lock();
    try {
      await updateBudgetYear({
        id: currentYearMeta.value.id,
        remark: currentYearMeta.value.remark,
        periodMode: nextMode,
      });
      message.success('时段模式已切换');
      await switchModeModalApi.close();
      await loadBudgetYears(selectedYear.value);
      await loadExecution();
    } finally {
      switchModeModalApi.unlock();
    }
  },
});

const [ResetBudgetForm, resetBudgetFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 90,
  },
  wrapperClass: 'grid grid-cols-1 gap-4',
  layout: 'vertical',
  schema: useResetBudgetFormSchema(),
  showDefaultActions: false,
});

const [ResetBudgetModal, resetBudgetModalApi] = useVbenModal({
  class: 'w-[520px]',
  async onConfirm() {
    if (!currentYearMeta.value?.id) {
      return;
    }
    const { valid } = await resetBudgetFormApi.validate();
    if (!valid) {
      return;
    }
    resetBudgetModalApi.lock();
    try {
      const values = await resetBudgetFormApi.getValues();
      await updateBudgetYear({
        id: currentYearMeta.value.id,
        remark: currentYearMeta.value.remark,
        totalBudget: Number(values.totalBudget) || 0,
      });
      message.success('已按全年预算均分到各时段');
      await resetBudgetModalApi.close();
      await loadBudgetYears(selectedYear.value);
      await loadExecution();
    } finally {
      resetBudgetModalApi.unlock();
    }
  },
});

const periodEditCustom = ref(false);
const isCreatingPeriod = ref(false);
const periodModalTitle = computed(() =>
  isCreatingPeriod.value ? '新增时段' : '编辑时段预算',
);
/** 弹窗打开后再灌入表单，避免 destroyOnClose / 未挂载时 await resetForm 卡死 */
const pendingPeriodForm = ref<{
  custom: boolean;
  values: Record<string, unknown>;
} | null>(null);

const [PeriodForm, periodFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 90,
  },
  wrapperClass: 'grid grid-cols-1 gap-4',
  layout: 'vertical',
  schema: usePeriodEditFormSchema(false),
  showDefaultActions: false,
});

const [PeriodModal, periodModalApi] = useVbenModal({
  class: 'w-[520px]',
  // 保持表单挂载，避免再次打开时卡在 waitForCondition
  destroyOnClose: false,
  async onOpened() {
    const pending = pendingPeriodForm.value;
    if (!pending) {
      return;
    }
    periodEditCustom.value = pending.custom;
    await periodFormApi.setState({
      schema: usePeriodEditFormSchema(pending.custom),
    });
    await periodFormApi.resetForm();
    await periodFormApi.setValues(pending.values);
    pendingPeriodForm.value = null;
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      editingPeriod.value = undefined;
      isCreatingPeriod.value = false;
      pendingPeriodForm.value = null;
    }
  },
  async onConfirm() {
    const editingId = editingPeriod.value?.id;
    const creating = isCreatingPeriod.value;
    if (!creating && !editingId) {
      message.warning('时段信息已失效，请重新点击编辑');
      return;
    }
    const { valid } = await periodFormApi.validate();
    if (!valid) {
      return;
    }
    periodModalApi.lock();
    try {
      const values = await periodFormApi.getValues();
      const name = values.name as string;
      const budgetAmount = Number(values.budgetAmount);
      const startDate =
        periodEditCustom.value && values.dateRange?.length === 2
          ? (values.dateRange[0] as string)
          : undefined;
      const endDate =
        periodEditCustom.value && values.dateRange?.length === 2
          ? (values.dateRange[1] as string)
          : undefined;

      if (creating) {
        if (!currentYearMeta.value?.id || !startDate || !endDate) {
          message.warning('请完善时段信息');
          return;
        }
        const existing = (execution.value?.periods ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          startDate: p.startDate,
          endDate: p.endDate,
          budgetAmount: Number(p.budgetAmount) || 0,
        }));
        existing.push({
          name,
          startDate,
          endDate,
          budgetAmount,
        });
        await updateBudgetYear({
          id: currentYearMeta.value.id,
          remark: currentYearMeta.value.remark,
          periods: existing,
        });
        message.success('已新增时段');
      } else {
        const payload: RewardPoolApi.BudgetPeriodUpdateReqVO = {
          id: editingId!,
          name,
          budgetAmount,
        };
        if (startDate && endDate) {
          payload.startDate = startDate;
          payload.endDate = endDate;
        }
        await updateBudgetPeriod(payload);
        message.success('时段预算已更新');
      }
      await periodModalApi.close();
      await loadBudgetYears(selectedYear.value);
      await loadExecution();
    } finally {
      periodModalApi.unlock();
    }
  },
});

async function loadBudgetYears(preferYear?: number) {
  budgetLoading.value = true;
  try {
    yearList.value = await getBudgetYearList();
    const years = yearList.value
      .map((item) => item.budgetYear)
      .filter((y): y is number => y != null);
    const currentYear = new Date().getFullYear();
    if (preferYear && years.includes(preferYear)) {
      selectedYear.value = preferYear;
    } else if (
      selectedYear.value != null &&
      years.includes(selectedYear.value)
    ) {
      // keep
    } else if (years.includes(currentYear)) {
      selectedYear.value = currentYear;
    } else if (years.length > 0) {
      selectedYear.value = years[0];
    } else {
      selectedYear.value = undefined;
      execution.value = undefined;
    }
  } finally {
    budgetLoading.value = false;
  }
}

async function loadExecution() {
  if (selectedYear.value == null) {
    execution.value = undefined;
    return;
  }
  budgetLoading.value = true;
  try {
    execution.value = await getBudgetExecution(selectedYear.value);
  } finally {
    budgetLoading.value = false;
  }
}

watch(selectedYear, () => {
  loadExecution();
});

function openCreateYearModal() {
  const existingYears = yearList.value
    .map((item) => item.budgetYear)
    .filter((y): y is number => y != null);
  createYearFormApi.updateSchema(useCreateYearFormSchema(existingYears));
  createYearFormApi.resetForm();
  createYearFormApi.setValues({
    // DatePicker year + valueFormat=YYYY 需要字符串，数字会被当成时间戳
    budgetYear: String(resolveDefaultBudgetYear(existingYears)),
    periodMode: 'QUARTER',
    totalBudget: undefined,
  });
  createYearModalApi.open();
}

function openSwitchModeModal() {
  if (!currentYearMeta.value?.id) {
    return;
  }
  switchModeFormApi.resetForm();
  switchModeFormApi.setValues({
    periodMode: currentYearMeta.value.periodMode,
  });
  switchModeModalApi.open();
}

function openResetBudgetModal() {
  if (!currentYearMeta.value?.id) {
    return;
  }
  const total =
    execution.value?.totalBudget ?? currentYearMeta.value.totalBudget ?? 0;
  resetBudgetFormApi.resetForm();
  resetBudgetFormApi.setValues({
    totalBudget: Number(total) || 0,
  });
  resetBudgetModalApi.open();
}

function openPeriodEdit(row: RewardPoolApi.PeriodExecution) {
  isCreatingPeriod.value = false;
  editingPeriod.value = row;
  pendingPeriodForm.value = {
    custom: isCustomMode.value,
    values: {
      name: row.name,
      budgetAmount: row.budgetAmount,
      dateRange:
        row.startDate && row.endDate ? [row.startDate, row.endDate] : undefined,
    },
  };
  periodModalApi.open();
}

function handleAddCustomPeriod() {
  if (!currentYearMeta.value?.id || selectedYear.value == null) {
    return;
  }
  isCreatingPeriod.value = true;
  editingPeriod.value = undefined;
  const year = selectedYear.value;
  pendingPeriodForm.value = {
    custom: true,
    values: {
      name: '新时段',
      budgetAmount: 0,
      dateRange: [`${year}-01-01`, `${year}-01-31`],
    },
  };
  periodModalApi.open();
}

function handleDeleteCustomPeriod(row: RewardPoolApi.PeriodExecution) {
  if (!currentYearMeta.value?.id || !row.id) {
    return;
  }
  const remaining = (execution.value?.periods ?? [])
    .filter((p) => p.id !== row.id)
    .map((p) => ({
      id: p.id,
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      budgetAmount: Number(p.budgetAmount) || 0,
    }));
  Modal.confirm({
    title: '删除时段？',
    content: `确认删除「${row.name}」？`,
    async onOk() {
      await updateBudgetYear({
        id: currentYearMeta.value!.id!,
        remark: currentYearMeta.value?.remark,
        periods: remaining,
      });
      message.success('已删除');
      await loadBudgetYears(selectedYear.value);
      await loadExecution();
    },
  });
}

onActivated(async () => {
  await loadBudgetYears();
  await loadExecution();
});
</script>

<template>
  <Page auto-content-height content-class="flex flex-col gap-4 overflow-auto">
    <Card :loading="budgetLoading" class="shrink-0" title="年度预算与执行率">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space wrap>
          <span class="text-sm text-gray-500">预算年度</span>
          <Select
            v-model:value="selectedYear"
            :options="yearOptions"
            allow-clear
            placeholder="请选择年度"
            style="width: 160px"
          />
          <DictTag
            v-if="currentYearMeta?.periodMode"
            :value="currentYearMeta.periodMode"
            :type="DICT_TYPE.EDU_REWARD_BUDGET_PERIOD_MODE"
          />
        </Space>
        <Space wrap v-if="canUpdate">
          <Button type="primary" @click="openCreateYearModal">新建年度</Button>
          <Button
            :disabled="!currentYearMeta?.id"
            @click="openSwitchModeModal"
          >
            切换模式
          </Button>
          <Button
            :disabled="!currentYearMeta?.id"
            @click="openResetBudgetModal"
          >
            重置
          </Button>
          <Button
            v-if="isCustomMode"
            :disabled="!currentYearMeta?.id"
            @click="handleAddCustomPeriod"
          >
            新增时段
          </Button>
        </Space>
      </div>

      <template v-if="execution">
        <Row :gutter="[16, 16]" class="mb-4">
          <Col :xs="24" :sm="8">
            <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <div class="mb-1 text-sm text-gray-500">全年预算</div>
              <div class="text-xl font-semibold">
                {{ formatMoney(execution.totalBudget) }}
              </div>
            </div>
          </Col>
          <Col :xs="24" :sm="8">
            <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <div class="mb-1 text-sm text-gray-500">全年已执行</div>
              <div class="text-xl font-semibold">
                {{ formatMoney(execution.totalExecuted) }}
              </div>
            </div>
          </Col>
          <Col :xs="24" :sm="8">
            <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <div class="mb-1 text-sm text-gray-500">全年执行率</div>
              <div class="text-xl font-semibold">
                {{ formatRate(execution.executionRate) }}
              </div>
            </div>
          </Col>
        </Row>

        <Table
          size="small"
          :columns="periodColumns"
          :data-source="execution.periods || []"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 700 }"
        >
          <template #bodyCell="{ column, text, record }">
            <template v-if="column.key === 'budgetAmount'">
              {{ formatMoney(text) }}
            </template>
            <template v-else-if="column.key === 'executedAmount'">
              <Button
                v-if="canQuery"
                type="link"
                class="!px-0"
                @click="openExecutionDetail(record)"
              >
                {{ formatMoney(record.executedAmount) }}
              </Button>
              <span v-else>{{ formatMoney(record.executedAmount) }}</span>
            </template>
            <template v-else-if="column.key === 'executionRate'">
              {{ formatRate(text) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button type="link" @click="openPeriodEdit(record)">
                  编辑
                </Button>
                <Button
                  v-if="isCustomMode"
                  type="link"
                  danger
                  @click="handleDeleteCustomPeriod(record)"
                >
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>
        <div class="mt-2 text-xs text-gray-400">
          已执行 = 付款申请审批通过金额（审批时锁定折合人民币），按审批通过时间归属时段；点击金额可查看明细
        </div>
      </template>
      <div v-else class="py-8 text-center text-gray-400">
        暂无年度预算，请先「新建年度」
      </div>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      :title="`执行明细 · ${detailPeriod?.name || ''}`"
      width="860"
      :get-container="false"
      destroy-on-close
    >
      <div class="mb-3 text-sm text-gray-500">
        <span>
          区间：{{ detailPage?.startDate || detailPeriod?.startDate }} ~
          {{ detailPage?.endDate || detailPeriod?.endDate }}
        </span>
        <span class="ml-4">
          合计（折人民币）：{{ formatMoney(detailPage?.executedAmountCny) }}
        </span>
      </div>
      <Table
        size="small"
        :columns="detailColumns"
        :data-source="detailPage?.list || []"
        :loading="detailLoading"
        row-key="paymentRequestId"
        :scroll="{ x: 820 }"
        :pagination="{
          current: detailPageNo,
          pageSize: detailPageSize,
          total: detailPage?.total || 0,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
          onChange: onDetailPageChange,
        }"
      >
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.key === 'billCode'">
            <Button type="link" class="!px-0" @click="goPaymentDetail(record)">
              {{ text || '-' }}
            </Button>
          </template>
          <template v-else-if="column.key === 'approveTime'">
            {{ text ? formatDateTime(text) : '-' }}
          </template>
          <template v-else-if="column.key === 'totalAmount'">
            {{
              `${Number(record.totalAmount ?? 0).toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} ${record.currency || ''}`.trim()
            }}
          </template>
          <template v-else-if="column.key === 'exchangeRate'">
            {{
              record.exchangeRate == null
                ? '-'
                : Number(record.exchangeRate).toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })
            }}
          </template>
          <template v-else-if="column.key === 'amountCny'">
            {{ formatMoney(text) }}
          </template>
        </template>
      </Table>
    </Drawer>

    <CreateYearModal title="新建年度预算">
      <CreateYearForm />
    </CreateYearModal>
    <SwitchModeModal title="切换时段模式">
      <SwitchModeForm />
      <div class="mt-2 text-xs text-amber-600">
        切到按季度/按月会重建时段，原全年预算均分到各段；切到自定义会保留现有时段并可自由编辑。
      </div>
    </SwitchModeModal>
    <ResetBudgetModal title="重置全年预算">
      <ResetBudgetForm />
      <div class="mt-2 text-xs text-gray-500">
        保留当前时段结构，仅按填写的全年预算重新均分各段金额。
      </div>
    </ResetBudgetModal>
    <PeriodModal :title="periodModalTitle">
      <PeriodForm />
    </PeriodModal>
  </Page>
</template>

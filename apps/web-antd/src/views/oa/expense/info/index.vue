<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { ExpenseReimburseBillApi } from '#/api/oa/expense';
import type { TravelApplyBillApi } from '#/api/oa/travel';

import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import { Loading } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
} from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { preferences, updatePreferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { Alert, Button, message, Table } from 'ant-design-vue';

import { withdrawProcessToStart } from '#/api/bpm/task';
import {
  deleteExpenseReimburseBill,
  getExpenseReimburseBill,
  saveExpenseReimburseBill,
  submitExpenseReimburseBill,
} from '#/api/oa/expense';
import { getTravelApplyBillPage } from '#/api/oa/travel';
import { AttachmentList } from '#/components/attachment-list';
import { BasicForm, CardContainer } from '#/components/basic-form';
import { ExpenseDetailList } from '#/components/expense-detail-list';
import { filterEmptyExpenseDetails, normalizeExpenseDetail, normalizeTotalAmount } from '#/components/expense-detail-list/data';
import { TravelApplySelectModal } from '#/views/oa/travel/components';
import { $t } from '#/locales';

import { useFormSchema } from './data';

defineOptions({ name: 'OaExpenseReimburseBillInfo' });

const props = defineProps<{
  activityNodes?: any[];
  copyReason?: string;
  id?: number | string;
  isApproval?: boolean;
  isCopy?: boolean;
  nodeKey?: string;
  nodeKeyName?: string;
  processDefinition?: any;
  processInstance?: any;
}>();

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
/** 当前用户是否为单据创建人 */
const isCreator = computed(() => {
  const creator = formData.value?.creator;
  if (!creator) return true;
  return String(userStore.userInfo?.id) === String(creator);
});
const { closeCurrentTab } = useTabs();

const formData = ref<Partial<ExpenseReimburseBillApi.ExpenseReimburseBill>>({});
const readonly = ref(false);
const loading = ref(false);
const basicFormRef = ref();
const attachmentListRef = ref();
const travelApplyModalRef = ref<InstanceType<typeof TravelApplySelectModal>>();
const formSchema = shallowRef<VbenFormSchema[]>([]);

/** 关联的差旅申请单列表（用于列表展示） */
const travelBills = ref<TravelApplyBillApi.TravelApplyBill[]>([]);

/** 差旅申请单列表表格列定义 */
const travelBillColumns = [
  { title: '单据编号', dataIndex: 'billCode', width: 180 },
  { title: '出差事由', dataIndex: 'cause', ellipsis: true },
  { title: '开始日期', dataIndex: 'travelStartDate', width: 170 },
  { title: '结束日期', dataIndex: 'travelEndDate', width: 170 },
  { title: '出差天数', dataIndex: 'travelDays', width: 100, align: 'center' as const },
];

/** 合计出差天数 */
const totalTravelDays = computed(() => {
  return travelBills.value.reduce((sum, bill) => {
    const days = Number(bill.travelDays) || 0;
    return Math.round((sum + days) * 10) / 10;
  }, 0);
});

/** 从差旅申请单列表拼接出差事由 */
function buildTravelCause(
  bills: TravelApplyBillApi.TravelApplyBill[],
): string {
  return [...new Set(bills.map((b) => b.cause).filter(Boolean))].join('；');
}

function initFormSchema() {
  formSchema.value = useFormSchema(travelApplyModalRef, readonly);
}

// 获取当前单据ID（每次调用都重新计算，避免缓存问题）
function getCurrentId(): number | undefined {
  if (props.id) {
    return typeof props.id === 'string' ? Number(props.id) : props.id;
  }
  return route.query.id ? Number(route.query.id) : undefined;
}

let id: number | undefined = getCurrentId();

function handleClose() {
  closeCurrentTab();
}

async function handleSaveAndSubmit(isSubmit: boolean) {
  loading.value = true;

  if (!basicFormRef.value) return;

  if (isSubmit) {
    const { valid } = await basicFormRef.value.validateForm();
    if (!valid) {
      loading.value = false;
      return;
    }
  }

  try {
    const formValues = isSubmit
      ? ((await basicFormRef.value.getFormValues()) as ExpenseReimburseBillApi.ExpenseReimburseBill)
      : ((await basicFormRef.value.getFormValues(
          false,
        )) as ExpenseReimburseBillApi.ExpenseReimburseBill);

    const validDetails = filterEmptyExpenseDetails(formData.value.details);
    formData.value.details = validDetails;
    const totalAmount = normalizeTotalAmount(formValues.totalAmount, validDetails);

    const data = {
      ...formData.value,
      ...formValues,
      totalAmount,
      details: validDetails,
    };

    id = await (isSubmit
      ? submitExpenseReimburseBill(data)
      : saveExpenseReimburseBill(data));
    formData.value.id = id;

    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });

    if (!route.query.id && id) {
      await router.replace({
        path: route.path,
        query: { ...route.query, id: String(id) },
      });
    }

    await loadData();
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleDelete() {
  if (!id) return;
  loading.value = true;
  try {
    await deleteExpenseReimburseBill(id);
    message.success('删除成功');
    closeCurrentTab();
  } catch (error) {
    console.error('删除失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleRevoke(reason: string) {
  if (
    formData.value.processInstanceId !== undefined &&
    formData.value.processInstanceId !== null
  ) {
    loading.value = true;
    try {
      await withdrawProcessToStart({
        processInstanceId: formData.value.processInstanceId,
        reason: reason || '制单人撤回',
      });
      message.success('撤回成功');
      await loadData();
    } catch (error) {
      console.error('撤回失败:', error);
    } finally {
      loading.value = false;
    }
  }
}

async function loadData() {
  // 每次加载前重新计算id，确保从路由或props获取最新值
  id = getCurrentId() ?? id;

  if (id === undefined || id === null) {
    formData.value = {
      creator: userStore.userInfo?.id,
      creatorName: userStore.userInfo?.nickname,
      companyId: userStore.userInfo?.companyId || 0,
      companyName: userStore.userInfo?.companyName || '中国引航协会',
      deptId: userStore.userInfo?.deptId || 0,
      deptName: userStore.userInfo?.deptName || '',
      processStatus: BpmProcessInstanceStatus.NOT_START,
      createTime: new Date(),
      paymentStatus: 0,
      billType: 2,
      totalAmount: 0,
      billCode: '',
      details: [],
      attachments: [],
    };
    travelBills.value = [];
    return;
  }

  loading.value = true;
  try {
    const data = await getExpenseReimburseBill(id);
    readonly.value =
      props.isApproval === true
        ? props.isApproval
        : !BpmProcessInstanceStatusEditValue.includes(
            data.processStatus as number,
          ) || !isCreator.value;

    // 优先使用接口返回的关联差旅申请单，否则按单号查询
    if (data.travelBills?.length) {
      travelBills.value = data.travelBills;
    } else {
      await loadTravelBills(data.travelBillCode);
    }

    const travelCause =
      data.travelCause || buildTravelCause(travelBills.value);
    const details = (data.details || []).map((item, index) =>
      normalizeExpenseDetail(item, index),
    );
    // 先计算总费用，确保从明细重新计算
    const totalAmount = normalizeTotalAmount(undefined, details);

    formData.value = {
      ...data,
      travelCause,
      details,
      totalAmount,
    };

    if (basicFormRef.value) {
      await basicFormRef.value.setFormValues({
        ...data,
        travelCause,
        totalAmount,
      });
    }
  } catch (error) {
    console.error('获取差旅报销单详情失败:', error);
  } finally {
    loading.value = false;
    nextTick(() => {
      basicFormRef.value?.refreshAllData();
    });
  }
}

/**
 * 根据单号加载关联的差旅申请单列表
 */
async function loadTravelBills(travelBillCode?: string) {
  if (!travelBillCode) {
    travelBills.value = [];
    return;
  }

  const codes = travelBillCode.split(',').filter((c) => c.trim());
  if (codes.length === 0) {
    travelBills.value = [];
    return;
  }

  try {
    // 逐个查询差旅申请单信息
    const results: TravelApplyBillApi.TravelApplyBill[] = [];
    for (const code of codes) {
      const pageResult = await getTravelApplyBillPage({
        pageNo: 1,
        pageSize: 1,
        billCode: code,
      });
      const bill = pageResult?.list?.[0];
      if (bill) {
        results.push(bill);
      }
    }
    travelBills.value = results;
  } catch (error) {
    console.error('加载关联差旅申请单失败:', error);
    travelBills.value = [];
  }
}

/**
 * 处理差旅申请单选择 - 支持多选，自动回填关联字段
 */
async function handleTravelApplySelect(bills: TravelApplyBillApi.TravelApplyBill[]) {
  if (!basicFormRef.value || !bills || bills.length === 0) return;

  // 存储关联的差旅申请单
  travelBills.value = bills;

  // 拼接单号
  const billCodes = bills.map((b) => b.billCode).join(',');
  // 拼接出差事由
  const causes = buildTravelCause(bills);

  const values: Record<string, any> = {
    travelBillCode: billCodes,
    travelCause: causes,
  };

  // 同步更新 formData 中的 travelBillCode
  formData.value.travelBillCode = billCodes;
  formData.value.travelCause = causes;

  await basicFormRef.value.setFormValues(values, false);
  await basicFormRef.value.clearFieldError('travelBillCode');
}

function handleUploadAttachment() {
  if (attachmentListRef.value) {
    attachmentListRef.value.handleTriggerUpload();
  }
}

/**
 * 费用明细合计金额变化 → 更新表单中的报销总金额
 */
async function handleTotalAmountChange(total: number) {
  if (!basicFormRef.value) return;
  formData.value.totalAmount = total;
  await basicFormRef.value.setFormValues({ totalAmount: total }, false);
}

async function beforeApproval(): Promise<boolean> {
  return true;
}

defineExpose({
  beforeApproval,
  loadData,
  handleSaveAndSubmit,
});

onMounted(() => {
  // 从发起流程进入时，隐藏侧边栏
  if (route.query.from === 'startProcess') {
    updatePreferences({ sidebar: { hidden: true } });
  }
  initFormSchema();
  loadData();
});

onBeforeUnmount(() => {
  if (preferences.sidebar.hidden) {
    updatePreferences({ sidebar: { hidden: false } });
  }
});

onBeforeRouteLeave(() => {
  if (preferences.sidebar.hidden) {
    updatePreferences({ sidebar: { hidden: false } });
  }
});
</script>

<template>
  <Loading :spinning="loading">
    <BasicForm
      ref="basicFormRef"
      :header-data="{
        ...formData,
        billName: '差旅报销单',
      }"
      :form-data="formData"
      :form-schema="formSchema"
      :disabled="props.isCopy || readonly"
      @close="handleClose"
      @save="handleSaveAndSubmit(false)"
      @submit="handleSaveAndSubmit(true)"
      @revoke="handleRevoke"
      @delete="handleDelete"
      :hide-footer="props.isApproval && !props.isCopy"
      :hide-submit="props.isCopy"
      :hide-save="props.isCopy"
      :hide-delete="props.isCopy"
      :activity-nodes="props.activityNodes"
    >
      <template v-if="props.isCopy && props.copyReason" #footer-extra>
        <div class="copy-reason-text">抄送意见：{{ props.copyReason }}</div>
      </template>
      <template #form-extension>
        <Alert
          v-if="route.query.from === 'startProcess'"
          type="info"
          show-icon
          :closable="false"
          message="提示：大额开支理事会事前审议。"
          style="margin-bottom: 16px;"
        />
        <!-- 关联差旅申请单信息列表 -->
        <CardContainer title="关联出差信息">
          <Table
            :columns="travelBillColumns"
            :data-source="travelBills"
            :pagination="false"
            size="small"
            bordered
            row-key="id"
            :locale="{ emptyText: '请先选择关联的出差申请单' }"
          >
            <template #summary v-if="travelBills.length > 0">
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell :index="0" :col-span="4" align="right">
                    <strong>合计天数</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell :index="1" align="center">
                    <strong>{{ totalTravelDays }}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            </template>
          </Table>
        </CardContainer>

        <CardContainer title="费用明细">
          <ExpenseDetailList
            v-model="formData.details"
            :readonly="readonly"
            @update:total="handleTotalAmountChange"
          />
        </CardContainer>

        <CardContainer :title="$t('common.attachmentInfo')">
          <template #extra>
            <Button
              v-if="!readonly"
              type="primary"
              @click="handleUploadAttachment"
            >
              上传附件
            </Button>
          </template>
          <AttachmentList
            ref="attachmentListRef"
            v-model="formData.attachments"
            :readonly="readonly"
            :max-count="10"
            :max-size="20"
            :hide-upload-button="true"
          />
        </CardContainer>

        <CardContainer title="报销规范">
          <Alert
            type="warning"
            show-icon
            :closable="false"
            message="报销规范提示"
          >
            <template #description>
              <div class="reimbursement-rules">
                <p>1. 每笔费用需对应相应的发票或收据，附件中需包含发票金额。</p>
                <p>2. 发票抬头需与公司名称及报销主体一致。</p>
                <p>3. 发票日期需在报销期间内（前后不超过3个工作日）。</p>
                <p>4. 交通费用需提供火车票、机票或电子客票行程单。</p>
                <p>5. 住宿费用需提供酒店发票，发票上需体现入住/离店日期。</p>
                <p>6. 餐饮费用每日标准按公司制度规定的上限执行。</p>
                <p>7. 同一行程的交通路线不可重复报销，系统会自动校验重复记录。</p>
                <p>8. 发票金额与报销金额需一致，如有差异需在备注中说明原因。</p>
              </div>
            </template>
          </Alert>
        </CardContainer>
      </template>
    </BasicForm>

    <!-- 差旅申请单选择弹窗 -->
    <TravelApplySelectModal
      ref="travelApplyModalRef"
      :exclude-expense-bill-id="formData.id"
      @select="handleTravelApplySelect"
    />
  </Loading>
</template>

<style scoped>
.copy-reason-text {
  width: 100%;
  padding: 8px 16px;
  font-size: 13px;
  color: rgb(0 0 0 / 65%);
  text-align: center;
  background-color: rgb(0 0 0 / 4%);
  border-bottom: 1px solid #f0f0f0;
}

.reimbursement-rules {
  line-height: 2;
  font-size: 13px;
  color: rgb(0 0 0 / 75%);
}

.reimbursement-rules p {
  margin: 0;
}
</style>

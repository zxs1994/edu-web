<script lang="ts" setup>
import type { ActivityInstanceApi } from '#/api/edu/activity-instance';
import type { UploadFile } from 'ant-design-vue';

import { computed, onActivated, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Loading, Page, useVbenModal } from '@vben/common-ui';
import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Descriptions,
  message,
  TabPane,
  Tabs,
  Table,
  Tag,
  Upload,
  Rate,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getActivityInstance,
  getInstanceFeeList,
  saveActivityInstanceRecord,
} from '#/api/edu/activity-instance';
import { getSimpleUserList } from '#/api/system/user';
import { DictTag } from '#/components/dict-tag';
import { CardContainer } from '#/components/basic-form';
import { useUpload } from '#/components/upload/use-upload';

import {
  buildActualTimeRange,
  splitActualTimeRange,
  useRecordFormSchema,
} from './data';
import AdminFeedbackModal from './admin-feedback-modal.vue';
import StudentFeedbackModal from './student-feedback-modal.vue';
import TeacherFeedbackModal from './teacher-feedback-modal.vue';
import {
  DICT_TYPE as FEE_DICT_TYPE,
  formatFeeAmount,
  useFeeItemColumns,
} from './fee-data';

defineOptions({ name: 'EduActivityInstanceInfo' });

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();
const userStore = useUserStore();
const { hasAccessByCodes } = useAccess();
const { httpRequest } = useUpload('activity-instance');

const activeTab = ref('info');
const loading = ref(false);
const saving = ref(false);
const detail = ref<ActivityInstanceApi.ActivityInstance>({});
const attachmentFiles = ref<UploadFile[]>([]);
const absentUserIds = ref<number[]>([]);
const feeItems = ref<ActivityInstanceApi.FeeItem[]>([]);
const feeLoading = ref(false);

const [StudentFeedbackModalComp, studentFeedbackModalApi] = useVbenModal({
  connectedComponent: StudentFeedbackModal,
});
const [TeacherFeedbackModalComp, teacherFeedbackModalApi] = useVbenModal({
  connectedComponent: TeacherFeedbackModal,
});
const [AdminFeedbackModalComp, adminFeedbackModalApi] = useVbenModal({
  connectedComponent: AdminFeedbackModal,
});

const instanceId = computed(() => {
  // 多 Tab + keep-alive 下 route 是全局的；仅在当前为活动实例详情路由时才解析 id
  if (!route.path.includes('/activity/instance/info')) {
    return undefined;
  }
  const id = route.query.id;
  return id ? Number(id) : undefined;
});

const recordReadonly = computed(() => !detail.value.recordEditable);
const canManageInstance = computed(() =>
  hasAccessByCodes(['edu:activity-instance:update']),
);

const feedback = computed(() => detail.value.feedback);
const feedbackEditable = computed(() => !!feedback.value?.feedbackEditable);

const myTeacherFeedback = computed(() =>
  feedback.value?.teacherFeedbacks?.find(
    (item) => item.userId === userStore.userInfo?.id,
  ),
);

const expectedParticipantCount = computed(
  () => detail.value.enrollCount ?? 0,
);

const computedAttendanceCount = computed(() =>
  Math.max(0, expectedParticipantCount.value - absentUserIds.value.length),
);

const pageTitle = computed(() => {
  const code = detail.value.instanceCode || '';
  return code ? `活动实例：${code}` : '活动实例详情';
});

const instanceCompleted = computed(() => detail.value.status === 'COMPLETED');

const canCreatePayment = computed(
  () =>
    instanceCompleted.value
    && hasAccessByCodes(['edu:activity-payment:create'])
    && feeItems.value.some((item) => item.status === 'pending_request'),
);

function handleCreatePayment() {
  if (!detail.value.activityId || !instanceId.value) {
    message.warning('活动信息不完整，无法发起付款申请');
    return;
  }
  router.push({
    path: '/edu/activity/payment/info',
    query: {
      activityId: detail.value.activityId,
      instanceId: instanceId.value,
      t: Date.now(),
    },
  });
}

const feeItemColumns = useFeeItemColumns();

const feeSummaryRows = computed(() => {
  const map = new Map<string, number>();
  for (const item of feeItems.value) {
    const currency = item.currency || 'CNY';
    map.set(currency, (map.get(currency) || 0) + (item.amount ?? 0));
  }
  return [...map.entries()].map(([currency, total]) => ({ currency, total }));
});

const enrollmentColumns = [
  { title: '姓名', dataIndex: 'userName', key: 'userName', width: 180 },
  {
    title: '报名状态',
    dataIndex: 'enrolled',
    key: 'enrolled',
    width: 120,
  },
  {
    title: '报名时间',
    dataIndex: 'enrollTime',
    key: 'enrollTime',
    width: 180,
  },
];

const studentFeedbackColumns = [
  { title: '姓名', dataIndex: 'userName', key: 'userName', width: 180 },
  { title: '满意度', dataIndex: 'satisfaction', key: 'satisfaction', width: 140 },
  { title: '收获', dataIndex: 'harvest', key: 'harvest', ellipsis: true },
  { title: '文字评价', dataIndex: 'content', key: 'content', ellipsis: true },
  { title: '状态', dataIndex: 'submitted', key: 'submitted', width: 100 },
  { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime', width: 180 },
  { title: '操作', key: 'action', width: 90 },
];

const teacherFeedbackColumns = [
  { title: '姓名', dataIndex: 'userName', key: 'userName', width: 180 },
  { title: '执行总结', dataIndex: 'summary', key: 'summary', ellipsis: true },
  { title: '问题', dataIndex: 'problem', key: 'problem', ellipsis: true },
  { title: '建议', dataIndex: 'suggestion', key: 'suggestion', ellipsis: true },
  { title: '状态', dataIndex: 'submitted', key: 'submitted', width: 100 },
  { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime', width: 180 },
  { title: '操作', key: 'action', width: 90 },
];

function getEnrollmentStatusLabel(row: ActivityInstanceApi.EnrollmentParticipant) {
  return row.enrolled ? '已报名' : '未报名';
}

function getEnrollmentStatusColor(row: ActivityInstanceApi.EnrollmentParticipant) {
  return row.enrolled ? 'success' : 'default';
}

const [RecordForm, recordFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 120,
  },
  wrapperClass: 'grid grid-cols-2 gap-4',
  layout: 'horizontal',
  schema: useRecordFormSchema(false),
  showDefaultActions: false,
});

async function loadAbsentUserOptions() {
  const users = await getSimpleUserList({});
  let options = users.map((user) => ({
    label: `${user.nickname}(${user.username})`,
    value: user.id!,
  }));
  if (detail.value.enrollmentParticipants?.length) {
    const idSet = new Set(
      detail.value.enrollmentParticipants
        .filter((item) => item.enrolled)
        .map((item) => item.userId!)
        .filter(Boolean),
    );
    options = options.filter((item) => idSet.has(item.value));
  }
  recordFormApi.updateSchema([
    {
      fieldName: 'absentUserIds',
      componentProps: {
        options,
        showSearch: true,
        optionFilterProp: 'label',
        disabled: recordReadonly.value,
        onChange: (value: number[]) => {
          absentUserIds.value = value ?? [];
        },
      },
    },
  ]);
}

function buildAttachmentFiles(
  attachments?: ActivityInstanceApi.Attachment[],
): UploadFile[] {
  if (!attachments?.length) {
    return [];
  }
  return attachments.map((item, index) => ({
    uid: `${index}-${item.fileUrl}`,
    name: item.fileName,
    status: 'done',
    url: item.fileUrl,
  }));
}

function syncRecordForm() {
  const record = detail.value.record;
  absentUserIds.value = record?.absentUserIds ?? [];
  recordFormApi.setValues({
    instanceId: detail.value.id,
    actualTimeRange: buildActualTimeRange(
      record?.actualStartTime,
      record?.actualEndTime,
    ),
    absentUserIds: absentUserIds.value,
    summary: record?.summary ?? '',
  });
  attachmentFiles.value = buildAttachmentFiles(record?.attachments);
}

async function loadFeeItems() {
  if (!instanceId.value) {
    feeItems.value = [];
    return;
  }
  feeLoading.value = true;
  try {
    feeItems.value = await getInstanceFeeList(instanceId.value);
  } catch (error) {
    console.error(error);
    feeItems.value = [];
  } finally {
    feeLoading.value = false;
  }
}

async function loadDetail() {
  if (!instanceId.value) {
    return;
  }
  loading.value = true;
  try {
    detail.value = await getActivityInstance(instanceId.value);
    recordFormApi.updateSchema(useRecordFormSchema(recordReadonly.value));
    syncRecordForm();
    await loadAbsentUserOptions();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function handleSaveRecord() {
  if (recordReadonly.value) {
    return;
  }
  const { valid } = await recordFormApi.validate();
  if (!valid) {
    return;
  }
  if (attachmentFiles.value.length > 5) {
    message.warning('附件最多5个');
    return;
  }
  const values = await recordFormApi.getValues();
  const { actualStartTime, actualEndTime, actualDate } = splitActualTimeRange(
    values.actualTimeRange,
  );
  if (!actualDate || !actualStartTime || !actualEndTime) {
    message.warning('请选择实际起止时间');
    return;
  }
  if (actualEndTime < actualStartTime) {
    message.warning('实际结束时间不能早于开始时间');
    return;
  }
  saving.value = true;
  try {
    await saveActivityInstanceRecord({
      instanceId: detail.value.id!,
      actualDate,
      actualStartTime,
      actualEndTime,
      absentUserIds: values.absentUserIds ?? [],
      summary: values.summary,
      attachments: attachmentFiles.value
        .filter((file) => file.status === 'done')
        .map((file) => ({
          fileName: file.name || '附件',
          fileUrl: file.url || (file.response as { url?: string })?.url || '',
        }))
        .filter((item) => item.fileUrl),
    });
    message.success('活动记录保存成功，实例已结项');
    await loadDetail();
    activeTab.value = 'record';
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

function openStudentFeedbackModal(
  feedbackRow?: ActivityInstanceApi.StudentFeedback | null,
  viewOnly = false,
) {
  if (!detail.value.id) {
    return;
  }
  studentFeedbackModalApi
    .setData({
      instanceId: detail.value.id,
      activityName: detail.value.activityName,
      readonly: viewOnly,
      feedback: feedbackRow,
    })
    .open();
}

function openTeacherFeedbackModal(
  feedbackRow?: ActivityInstanceApi.TeacherFeedback | null,
  viewOnly = false,
) {
  if (!detail.value.id) {
    return;
  }
  teacherFeedbackModalApi
    .setData({
      instanceId: detail.value.id,
      activityName: detail.value.activityName,
      readonly: viewOnly,
      feedback: feedbackRow,
    })
    .open();
}

function openAdminFeedbackModal(viewOnly = false) {
  if (!detail.value.id) {
    return;
  }
  adminFeedbackModalApi
    .setData({
      instanceId: detail.value.id,
      activityName: detail.value.activityName,
      readonly: viewOnly,
      feedback: feedback.value?.adminFeedback,
    })
    .open();
}

async function handleFeedbackSuccess() {
  await loadDetail();
  activeTab.value = 'feedback';
}

async function customUpload(option: any) {
  try {
    const result = await httpRequest(option.file as File);
    option.onSuccess?.(result);
  } catch (error) {
    option.onError?.(error);
  }
}

function handleClose() {
  closeCurrentTab();
}

onActivated(() => {
  loadDetail();
});

watch(activeTab, (tab) => {
  if (tab === 'fee') {
    loadFeeItems();
  }
});
</script>

<template>
  <Page auto-content-height :title="pageTitle">
    <template #extra>
      <Button @click="handleClose">关闭</Button>
    </template>
    <Loading :spinning="loading">
      <div class="flex h-full flex-col gap-4">
      <div class="rounded-lg bg-white p-4 shadow-sm">
      <CardContainer title="实例概览">
        <Descriptions :column="3" bordered size="small">
          <Descriptions.Item label="实例编号">
            {{ detail.instanceCode || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="活动编号">
            {{ detail.activityBillCode || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="活动名称">
            {{ detail.activityName || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="期次">
            第 {{ detail.periodNo ?? '-' }} 期
          </Descriptions.Item>
          <Descriptions.Item label="计划执行时间">
            {{
              detail.plannedDate
                ? formatDateTime(detail.plannedDate as string | number[])
                : '-'
            }}
          </Descriptions.Item>
          <Descriptions.Item label="实际执行时间">
            {{
              detail.actualDate
                ? formatDateTime(detail.actualDate as string | number[])
                : '-'
            }}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <DictTag
              v-if="detail.status"
              :type="DICT_TYPE.EDU_ACTIVITY_INSTANCE_STATUS"
              :value="detail.status"
            />
            <span v-else>-</span>
          </Descriptions.Item>
          <Descriptions.Item label="报名人数">
            {{ detail.enrollCount ?? 0 }}
          </Descriptions.Item>
          <Descriptions.Item label="出勤人数">
            {{ detail.attendanceCount ?? 0 }}
          </Descriptions.Item>
        </Descriptions>
      </CardContainer>
      </div>

      <div class="flex-1 rounded-lg bg-white p-4 shadow-sm">
      <Tabs v-model:active-key="activeTab" class="flex-1">
        <TabPane key="info" tab="活动信息">
          <CardContainer title="主活动信息">
            <Descriptions :column="2" bordered size="small">
              <Descriptions.Item label="活动类型">
                <DictTag
                  v-if="detail.activity?.activityType"
                  :type="DICT_TYPE.EDU_ACTIVITY_TYPE"
                  :value="detail.activity.activityType"
                />
                <span v-else>-</span>
              </Descriptions.Item>
              <Descriptions.Item label="周期类型">
                <DictTag
                  v-if="detail.activity?.cycleType"
                  :type="DICT_TYPE.EDU_ACTIVITY_CYCLE"
                  :value="detail.activity.cycleType"
                />
                <span v-else>-</span>
              </Descriptions.Item>
              <Descriptions.Item label="活动开始时间">
                {{ detail.activity?.startDate || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="预算总额">
                {{ detail.activity?.budgetAmount ?? '-' }} 元
              </Descriptions.Item>
              <Descriptions.Item label="活动负责人" :span="2">
                {{ detail.activity?.ownerUserNames || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="参与人" :span="2">
                {{ detail.activity?.participantNames || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="活动内容" :span="2">
                {{ detail.activity?.content || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="备注" :span="2">
                {{ detail.activity?.remark || '-' }}
              </Descriptions.Item>
            </Descriptions>
          </CardContainer>
        </TabPane>

        <TabPane key="enroll" tab="提醒报名">
          <CardContainer title="提醒报名">
            <Descriptions :column="2" bordered class="mb-4" size="small">
              <Descriptions.Item label="报名开始">
                {{
                  detail.activity?.enrollStartTime
                    ? formatDateTime(detail.activity.enrollStartTime)
                    : '-'
                }}
              </Descriptions.Item>
              <Descriptions.Item label="报名结束">
                {{
                  detail.activity?.enrollEndTime
                    ? formatDateTime(detail.activity.enrollEndTime)
                    : '-'
                }}
              </Descriptions.Item>
              <Descriptions.Item label="实例状态">
                <DictTag
                  v-if="detail.status"
                  :type="DICT_TYPE.EDU_ACTIVITY_INSTANCE_STATUS"
                  :value="detail.status"
                />
                <span v-else>-</span>
              </Descriptions.Item>
              <Descriptions.Item label="已报/上限">
                {{ detail.enrollCount ?? 0 }}
                /
                {{ detail.enrollLimit && detail.enrollLimit > 0 ? detail.enrollLimit : '不限' }}
              </Descriptions.Item>
            </Descriptions>
            <Table
              :columns="enrollmentColumns"
              :data-source="detail.enrollmentParticipants ?? []"
              :pagination="false"
              row-key="userId"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'enrolled'">
                  <Tag :color="getEnrollmentStatusColor(record)">
                    {{ getEnrollmentStatusLabel(record) }}
                  </Tag>
                </template>
                <template v-else-if="column.key === 'enrollTime'">
                  {{
                    record.enrollTime ? formatDateTime(record.enrollTime) : '-'
                  }}
                </template>
              </template>
            </Table>
            <div
              v-if="!(detail.enrollmentParticipants?.length)"
              class="py-4 text-center text-gray-400"
            >
              暂无学生参与人
            </div>
          </CardContainer>
        </TabPane>

        <TabPane key="record" tab="活动记录">
          <CardContainer title="活动记录">
            <Descriptions :column="3" bordered class="mb-4" size="small">
              <Descriptions.Item label="应到人数">
                {{ expectedParticipantCount }}
              </Descriptions.Item>
              <Descriptions.Item label="缺席人数">
                {{ absentUserIds.length }}
              </Descriptions.Item>
              <Descriptions.Item label="出勤人数">
                {{ computedAttendanceCount }}
              </Descriptions.Item>
            </Descriptions>
            <RecordForm />
            <div class="mt-4">
              <div class="mb-2 font-medium">附件（最多5个）</div>
              <Upload
                v-model:file-list="attachmentFiles"
                :custom-request="customUpload"
                :disabled="recordReadonly"
                :max-count="5"
                multiple
              >
                <Button v-if="!recordReadonly" type="default">上传附件</Button>
              </Upload>
            </div>
            <div v-if="!recordReadonly" class="mt-6 flex justify-end">
              <Button :loading="saving" type="primary" @click="handleSaveRecord">
                保存活动记录
              </Button>
            </div>
            <div v-else class="mt-4 text-gray-500">
              当前不可编辑活动记录（仅活动负责人或管理员可填写）
            </div>
          </CardContainer>
        </TabPane>

        <TabPane key="feedback" tab="活动反馈">
          <CardContainer title="活动反馈">
            <div v-if="!detail.record" class="py-4 text-gray-500">
              请先保存活动记录后再提交反馈
            </div>
            <template v-else>
              <Descriptions :column="4" bordered class="mb-4" size="small">
                <Descriptions.Item label="学生反馈">
                  {{ feedback?.submittedStudentCount ?? 0 }}
                  / {{ feedback?.expectedStudentCount ?? 0 }}
                </Descriptions.Item>
                <Descriptions.Item label="教培反馈">
                  {{ feedback?.submittedTeacherCount ?? 0 }}
                  / {{ feedback?.expectedTeacherCount ?? 0 }}
                </Descriptions.Item>
                <Descriptions.Item label="班务评价">
                  <Tag :color="feedback?.adminFeedbackSubmitted ? 'success' : 'default'">
                    {{ feedback?.adminFeedbackSubmitted ? '已提交' : '未提交' }}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="反馈汇总">
                  <Tag :color="feedback?.allFeedbackCompleted ? 'success' : 'processing'">
                    {{ feedback?.allFeedbackCompleted ? '已全部完成' : '待完成' }}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <div
                v-if="
                  feedback?.canSubmitStudentFeedback
                    || feedback?.canSubmitTeacherFeedback
                    || feedback?.canSubmitAdminFeedback
                "
                class="mb-4 flex flex-wrap gap-2"
              >
                <Button
                  v-if="feedback?.canSubmitStudentFeedback"
                  type="primary"
                  @click="openStudentFeedbackModal(null, false)"
                >
                  填写学生反馈
                </Button>
                <Button
                  v-if="feedback?.canSubmitTeacherFeedback"
                  type="primary"
                  @click="openTeacherFeedbackModal(myTeacherFeedback, false)"
                >
                  填写教培反馈
                </Button>
                <Button
                  v-if="feedback?.canSubmitAdminFeedback"
                  type="primary"
                  @click="openAdminFeedbackModal(false)"
                >
                  填写班务评价
                </Button>
              </div>

              <div v-if="canManageInstance" class="mb-6">
                <div class="mb-2 font-medium">学生反馈（已报名且未缺席）</div>
                <Table
                  :columns="studentFeedbackColumns"
                  :data-source="feedback?.studentFeedbacks ?? []"
                  :pagination="false"
                  row-key="userId"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'submitted'">
                      <Tag :color="record.submitted ? 'success' : 'default'">
                        {{ record.submitted ? '已提交' : '未提交' }}
                      </Tag>
                    </template>
                    <template v-else-if="column.key === 'satisfaction'">
                      <span v-if="record.satisfaction" class="inline-flex items-center gap-1">
                        <Rate
                          :value="record.satisfaction"
                          class="feedback-table-rate"
                          disabled
                        />
                        <span class="text-gray-500">{{ record.satisfaction }} 分</span>
                      </span>
                      <span v-else>-</span>
                    </template>
                    <template v-else-if="column.key === 'submitTime'">
                      {{ record.submitTime ? formatDateTime(record.submitTime) : '-' }}
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <Button
                        v-if="record.submitted"
                        type="link"
                        size="small"
                        class="!px-0"
                        @click="openStudentFeedbackModal(record, true)"
                      >
                        查看
                      </Button>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </template>
                </Table>
              </div>

              <div class="mb-6">
                <div class="mb-2 font-medium">教培反馈（参与教培）</div>
                <Table
                  :columns="teacherFeedbackColumns"
                  :data-source="feedback?.teacherFeedbacks ?? []"
                  :pagination="false"
                  row-key="userId"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'submitted'">
                      <Tag :color="record.submitted ? 'success' : 'default'">
                        {{ record.submitted ? '已提交' : '未提交' }}
                      </Tag>
                    </template>
                    <template v-else-if="column.key === 'submitTime'">
                      {{ record.submitTime ? formatDateTime(record.submitTime) : '-' }}
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <Button
                        v-if="record.submitted"
                        type="link"
                        size="small"
                        class="!px-0"
                        @click="openTeacherFeedbackModal(record, true)"
                      >
                        查看
                      </Button>
                      <span v-else class="text-gray-400">-</span>
                    </template>
                  </template>
                </Table>
              </div>

              <div class="mb-4">
                <div class="mb-2 flex items-center justify-between">
                  <span class="font-medium">班务评价（仅活动负责人可填）</span>
                  <Button
                    v-if="feedback?.adminFeedback?.submitted"
                    type="link"
                    size="small"
                    class="!px-0"
                    @click="openAdminFeedbackModal(true)"
                  >
                    查看详情
                  </Button>
                </div>
                <Descriptions
                  v-if="feedback?.adminFeedback?.submitted"
                  :column="2"
                  bordered
                  size="small"
                >
                  <Descriptions.Item label="提交人">
                    {{ feedback.adminFeedback.submitterUserName || '-' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="质量评分">
                    <span v-if="feedback.adminFeedback.qualityScore" class="inline-flex items-center gap-1">
                      <Rate
                        :value="feedback.adminFeedback.qualityScore"
                        class="feedback-table-rate"
                        disabled
                      />
                      <span class="text-gray-500">
                        {{ feedback.adminFeedback.qualityScore }} 分
                      </span>
                    </span>
                    <span v-else>-</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="结项意见" :span="2">
                    {{ feedback.adminFeedback.closingOpinion || '-' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="提交时间" :span="2">
                    {{
                      feedback.adminFeedback.submitTime
                        ? formatDateTime(feedback.adminFeedback.submitTime)
                        : '-'
                    }}
                  </Descriptions.Item>
                </Descriptions>
                <div v-else class="text-gray-400">暂未提交班务评价</div>
              </div>

              <div v-if="!feedbackEditable" class="text-gray-500">
                实例结项后方可填写反馈（每人仅可提交一次）
              </div>
            </template>
          </CardContainer>
        </TabPane>

        <TabPane key="fee" tab="费用明细">
          <CardContainer title="费用明细">
            <template v-if="canCreatePayment" #extra>
              <Button type="primary" @click="handleCreatePayment">
                发起付款申请
              </Button>
            </template>
            <div v-if="!instanceCompleted" class="py-8 text-center text-gray-400">
              保存活动记录并结项后自动生成费用明细
            </div>
            <template v-else>
              <Table
                :columns="feeItemColumns"
                :data-source="feeItems"
                :loading="feeLoading"
                :pagination="false"
                row-key="id"
                size="small"
              >
                <template #bodyCell="{ column, text }">
                  <template v-if="column.key === 'feeType'">
                    <DictTag
                      v-if="text"
                      :type="FEE_DICT_TYPE.EDU_FEE_TYPE"
                      :value="text"
                    />
                    <span v-else>-</span>
                  </template>
                  <template v-else-if="column.key === 'currency'">
                    <DictTag
                      v-if="text"
                      :type="FEE_DICT_TYPE.EDU_FEE_CURRENCY"
                      :value="text"
                    />
                    <span v-else>-</span>
                  </template>
                  <template v-else-if="column.key === 'feeSide'">
                    <DictTag
                      v-if="text"
                      :type="FEE_DICT_TYPE.EDU_FEE_SIDE"
                      :value="text"
                    />
                    <span v-else>-</span>
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <DictTag
                      v-if="text"
                      :type="FEE_DICT_TYPE.EDU_FEE_ITEM_STATUS"
                      :value="text"
                    />
                    <span v-else>-</span>
                  </template>
                  <template v-else-if="column.key === 'amount'">
                    {{ text != null ? formatFeeAmount(Number(text)) : '-' }}
                  </template>
                  <template v-else-if="column.key === 'payeeUserName'">
                    {{ text || '-' }}
                  </template>
                  <template v-else-if="column.key === 'generateTime'">
                    {{
                      text ? formatDateTime(text as string | number[]) : '-'
                    }}
                  </template>
                </template>
              </Table>
              <div
                v-if="!feeLoading && feeItems.length === 0"
                class="py-4 text-center text-gray-400"
              >
                暂无费用明细（活动未配置费用标准）
              </div>
              <div
                v-if="feeSummaryRows.length > 0"
                class="mt-4 flex flex-wrap gap-4 text-sm text-gray-600"
              >
                <span class="font-medium text-[#333]">合计：</span>
                <span
                  v-for="row in feeSummaryRows"
                  :key="row.currency"
                >
                  {{ row.currency }}
                  {{ formatFeeAmount(row.total) }}
                </span>
              </div>
            </template>
          </CardContainer>
        </TabPane>
      </Tabs>
      </div>
      </div>
    </Loading>
  <StudentFeedbackModalComp @success="handleFeedbackSuccess" />
  <TeacherFeedbackModalComp @success="handleFeedbackSuccess" />
  <AdminFeedbackModalComp @success="handleFeedbackSuccess" />
  </Page>
</template>

<style scoped>
.feedback-table-rate :deep(.ant-rate-star) {
  margin-inline-end: 2px;
}

.feedback-table-rate {
  font-size: 14px;
  line-height: 1;
}
</style>

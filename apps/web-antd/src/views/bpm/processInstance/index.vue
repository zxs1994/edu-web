<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';
import type { BpmDraftBillApi } from '#/api/bpm/draftBill';

import { onActivated, ref } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { Page } from '@vben/common-ui';

import { message, Modal, Tabs, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProcessInstance,
  getProcessInstanceMyPage,
} from '#/api/bpm/processInstance';
import { getMyDraftBillPage } from '#/api/bpm/draftBill';
import { DictTag } from '#/components/dict-tag';
import { router } from '#/router';
import { PRESIDENT_CORRECTION_DISPLAY_LABEL, shouldShowPresidentCorrectionStatusOnly } from '#/utils/correction-display';

import { useGridColumns, useGridFormSchema } from './data';
import {
  useGridColumns as useDraftGridColumns,
  useGridFormSchema as useDraftGridFormSchema,
} from '../draftBill/data';
import { isBillDeleted } from '#/utils/bpm-bill-status';
import {
  deleteDraftBill,
  getDraftBillInfoRoute,
} from '#/utils/bpm-draft-bill';
import { getProcessInstanceMyDetailRoute } from '#/utils/bpm-process-instance-route';

// 使用原始 ProcessInstance 类型
type ExtendedProcessInstance = BpmProcessInstanceApi.ProcessInstance;

defineOptions({ name: 'BpmProcessInstanceMy' });

const activeTab = ref<'draft' | 'running'>('running');

// ============ 流程中 Tab ============
/** 查看流程实例 / 纠错中单据跳转业务详情 */
function handleDetail(row: ExtendedProcessInstance) {
  if (isBillDeleted(row)) {
    return;
  }
  router.push(getProcessInstanceMyDetailRoute(row));
}

/** 删除未提交的流程实例 */
function handleDelete(row: ExtendedProcessInstance) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除该未提交的单据吗？删除后不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await deleteProcessInstance(row.id.toString());
      message.success('删除成功');
      gridApi.query();
    },
  });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    wrapperClass: 'grid-cols-4',
    collapsed: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getProcessInstanceMyPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    cellConfig: {
      height: 64,
    },
  } as VxeTableGridOptions<ExtendedProcessInstance>,
});

// ============ 草稿箱 Tab ============
function handleDraftDetail(row: BpmDraftBillApi.DraftBill) {
  const route = getDraftBillInfoRoute(row);
  if (!route) {
    message.warning('未配置该单据类型的编辑页面');
    return;
  }
  router.push(route);
}

function handleDraftDelete(row: BpmDraftBillApi.DraftBill) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除草稿「${row.billCode || row.billId}」吗？删除后不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await deleteDraftBill(row.processDefinitionKey, row.billId);
      message.success('删除成功');
      draftGridApi.query();
    },
  });
}

const [DraftGrid, draftGridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useDraftGridFormSchema(),
    wrapperClass: 'grid-cols-4',
    collapsed: true,
  },
  gridOptions: {
    columns: useDraftGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMyDraftBillPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'billId',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<BpmDraftBillApi.DraftBill>,
});

onActivated(() => {
  if (activeTab.value === 'running') {
    gridApi.query();
  } else {
    draftGridApi.query();
  }
});
</script>

<template>
  <Page auto-content-height>
    <Tabs v-model:active-key="activeTab" class="draft-merge-tabs">
      <Tabs.TabPane key="running" tab="流程中">
        <Grid>
          <!-- 摘要 -->
          <template #slot-summary="{ row }">
            <div
              class="flex flex-col py-2"
              v-if="row.summary && row.summary.length > 0"
            >
              <div v-for="(item, index) in row.summary" :key="index">
                <span class="text-gray-500">
                  {{ item.key }} : {{ item.value }}
                </span>
              </div>
            </div>
            <div v-else>-</div>
          </template>

          <template #slot-status="{ row }">
            <div class="flex items-center flex-wrap gap-1">
              <Tag v-if="isBillDeleted(row)" color="default">已删除</Tag>
              <template v-else>
                <Tag
                  v-if="shouldShowPresidentCorrectionStatusOnly(row)"
                  color="error"
                >
                  {{ PRESIDENT_CORRECTION_DISPLAY_LABEL }}
                </Tag>
                <DictTag
                  v-else
                  :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
                  :value="row.status"
                />
                <template
                  v-if="
                    !shouldShowPresidentCorrectionStatusOnly(row) &&
                    row.status === BpmProcessInstanceStatus.RUNNING &&
                    row.tasks &&
                    row.tasks.length > 0
                  "
                >
                  <Tag color="processing">
                    {{ row.tasks[0]?.assigneeUser?.nickname || '未知用户' }}{{ row.tasks[0]?.assigneeUser?.postName ? '-' + row.tasks[0].assigneeUser.postName : '' }}
                  </Tag>
                  <Tag v-if="row.tasks.length > 1">
                    等{{ row.tasks.length }}人审批
                  </Tag>
                </template>
              </template>
            </div>
          </template>
          <template #slot-bill-code="{ row }">
            <a
              v-if="!isBillDeleted(row) && (row.billCode || row.formVariables?.billCode)"
              class="text-primary"
              @click="handleDetail(row)"
            >
              {{ row.billCode || row.formVariables?.billCode }}
            </a>
            <span v-else-if="row.billCode || row.formVariables?.billCode">
              {{ row.billCode || row.formVariables?.billCode }}
            </span>
            <span v-else>-</span>
          </template>
          <template #actions="{ row }">
            <span v-if="isBillDeleted(row)" class="text-gray-400">-</span>
            <TableAction
              v-else
              :actions="[
                {
                  label: $t('common.detail'),
                  type: 'link',
                  icon: ACTION_ICON.VIEW,
                  auth: ['bpm:process-instance:query'],
                  onClick: handleDetail.bind(null, row),
                },
                {
                  label: '删除',
                  type: 'link',
                  danger: true,
                  icon: ACTION_ICON.DELETE,
                  ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
                  onClick: handleDelete.bind(null, row),
                },
              ]"
            />
          </template>
        </Grid>
      </Tabs.TabPane>
      <Tabs.TabPane key="draft" tab="未提交">
        <DraftGrid>
          <template #slot-bill-code="{ row }">
            <a
              v-if="row.billCode"
              class="text-primary"
              @click="handleDraftDetail(row)"
            >
              {{ row.billCode }}
            </a>
            <span v-else>-</span>
          </template>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: $t('common.detail'),
                  type: 'link',
                  icon: ACTION_ICON.VIEW,
                  auth: ['bpm:process-instance:query'],
                  onClick: () => handleDraftDetail(row),
                },
                {
                  label: '删除',
                  type: 'link',
                  danger: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['bpm:process-instance:query'],
                  onClick: () => handleDraftDelete(row),
                },
              ]"
            />
          </template>
        </DraftGrid>
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>

<style scoped>
.draft-merge-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.draft-merge-tabs :deep(.ant-tabs-content-holder) {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.draft-merge-tabs :deep(.ant-tabs-content) {
  height: 100%;
}

.draft-merge-tabs :deep(.ant-tabs-tabpane) {
  height: 100%;
}
</style>

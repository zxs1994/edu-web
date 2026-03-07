<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';

import { h } from 'vue';

import { Page, prompt } from '@vben/common-ui';
import {
  BpmProcessInstanceStatus,
  BpmProcessInstanceStatusEditValue,
  DICT_TYPE,
} from '@vben/constants';

import { Button, message, Tag, Textarea } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProcessInstance,
  getProcessInstanceMyPage,
} from '#/api/bpm/processInstance';
import { withdrawProcessToStart } from '#/api/bpm/task';
import { DictTag } from '#/components/dict-tag';
import { router } from '#/router';

import { useGridColumns, useGridFormSchema } from './data';

// 使用原始 ProcessInstance 类型
type ExtendedProcessInstance = BpmProcessInstanceApi.ProcessInstance;

defineOptions({ name: 'BpmProcessInstanceMy' });

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看流程实例 */
function handleDetail(row: ExtendedProcessInstance) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.id.toString(), isTodo: 'false' },
  });
}

/** 删除流程实例 */
async function handleDeleteInstance(row: ExtendedProcessInstance) {
  try {
    await deleteProcessInstance(row.id.toString());
    message.success('删除成功');
    handleRefresh();
  } catch {
    // error already handled by request client
  }
}

/** 撤回流程实例 */
function handleCancel(row: ExtendedProcessInstance) {
  prompt({
    async beforeClose(scope) {
      if (scope.isConfirm) {
        if (scope.value) {
          try {
            await withdrawProcessToStart({
              processInstanceId: row.id.toString(),
              reason: scope.value,
            });
            message.success('撤回成功');
            handleRefresh();
          } catch {
            return false;
          }
        } else {
          message.error('请输入撤回原因');
          return false;
        }
      }
    },
    component: () => {
      return h(Textarea, {
        placeholder: '请输入撤回原因',
        allowClear: true,
        rows: 2,
        rules: [{ required: true, message: '请输入撤回原因' }],
      });
    },
    content: '请输入撤回原因',
    title: '撤回流程',
    modelPropName: 'value',
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
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="流程状态">
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
        <!-- 未提交状态 -->
        <template v-if="row.status === BpmProcessInstanceStatus.NOT_START">
          <Tag color="default">未提交</Tag>
        </template>
        <!-- 审批中状态 -->
        <template
          v-else-if="
            row.status === BpmProcessInstanceStatus.RUNNING &&
            row.tasks &&
            row.tasks.length > 0
          "
        >
          <!-- 单人审批 -->
          <template v-if="row.tasks.length === 1">
            <span>
              <Button type="link" @click="handleDetail(row)">
                {{ row.tasks[0]?.assigneeUser?.nickname || '未知用户' }}
              </Button>
              ({{ row.tasks[0]?.name || '未知任务' }}) 审批中
            </span>
          </template>
          <!-- 多人审批 -->
          <template v-else>
            <span>
              <Button type="link" @click="handleDetail(row)">
                {{ row.tasks[0]?.assigneeUser?.nickname || '未知用户' }}
              </Button>
              等 {{ row.tasks.length }} 人 ({{
                row.tasks[0]?.name || '未知任务'
              }})审批中
            </span>
          </template>
        </template>
        <!-- 非审批中状态 -->
        <template v-else>
          <DictTag
            :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
            :value="row.status"
          />
        </template>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['bpm:process-instance:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('ui.actionTitle.revoke'),
              type: 'link',
              icon: ACTION_ICON.DELETE,
              ifShow: row.status === BpmProcessInstanceStatus.RUNNING,
              auth: ['bpm:process-instance:cancel'],
              onClick: handleCancel.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              ifShow: BpmProcessInstanceStatusEditValue.includes(row.status),
              auth: ['bpm:process-instance:cancel'],
              popConfirm: {
                title: '确定要删除此流程实例吗？删除后不可恢复。',
                confirm: handleDeleteInstance.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>

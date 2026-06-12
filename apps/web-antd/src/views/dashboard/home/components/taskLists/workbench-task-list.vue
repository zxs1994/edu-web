<script lang="ts" setup>
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref } from 'vue';

import { Badge, Table, Tabs } from 'ant-design-vue';

import { ACTION_ICON, TableAction } from '#/adapter/vxe-table';
import {
  getProcessInstanceCopyPage,
  getProcessInstanceMyPage,
} from '#/api/bpm/processInstance';
import { getTaskDonePage, getTaskTodoPage } from '#/api/bpm/task';
import { router } from '#/router';

interface Props {
  maxRecordNum?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxRecordNum: 10,
});

// Tab类型定义
type TabKey = 'copy' | 'done' | 'myBill' | 'todo';

// 当前激活的Tab
const activeTab = ref<TabKey>('todo');

// 加载状态
const loading = ref(false);

// 数据列表
const taskList = ref<any[]>([]);

// 统计数据
const statistics = ref({
  myBill: 0,
  todo: 0,
  done: 0,
  copy: 0,
});

// Tab配置
const tabs = computed(() => [
  { key: 'todo', label: '待办任务', count: statistics.value.todo },
  { key: 'myBill', label: '我的单据', count: statistics.value.myBill },
  { key: 'done', label: '已办任务', count: statistics.value.done },
  { key: 'copy', label: '抄送我的', count: statistics.value.copy },
]);

// 格式化摘要
function formatSummary(summary: any) {
  if (!summary || !Array.isArray(summary) || summary.length === 0) {
    return '-';
  }
  return summary
    .map((item: any) => {
      const key = item?.key;
      const value = item?.value ?? '';
      return key && `${key}`.trim().length > 0
        ? `${key}: ${value}`
        : `${value}`;
    })
    .join(', ');
}

// 获取列定义
const columns = computed(() => {
  const tab = activeTab.value;

  // 基础列（所有Tab都有）
  const baseColumns: any[] = [
    {
      title: '单据类型',
      dataIndex: ['processInstance', 'name'],
      key: 'billType',
      width: 140,
      ellipsis: true,
      customRender: ({ record }: any) => {
        if (tab === 'copy') {
          return record.processInstanceName || '-';
        }
        if (tab === 'myBill') {
          return record.name || '-';
        }
        return record.processInstance?.name || '-';
      },
    },
    {
      title: '单据编号',
      dataIndex: ['processInstance', 'billCode'],
      key: 'billCode',
      width: 160,
      customRender: ({ record }: any) => {
        if (tab === 'copy') {
          return record.billCode || '-';
        }
        if (tab === 'myBill') {
          return record.billCode || record.formVariables?.billCode || '-';
        }
        return record.processInstance?.billCode || '-';
      },
    },
    {
      title: '审批状态',
      dataIndex: 'status',
      key: 'status',
      width: tab === 'myBill' ? 200 : 100,
      customRender: ({ record }: any) => {
        let status = null;
        switch (tab) {
          case 'copy': {
            return '已抄送';
          }
          case 'done': {
            status = record.status;

            break;
          }
          case 'myBill': {
            status = record.status;

            break;
          }
          case 'todo': {
            return '待处理';
          }
          // No default
        }

        const statusMap: Record<number, string> = {
          [-1]: '未提交',
          1: '审批中',
          2: '已通过',
          3: '未通过',
          4: '已取消',
        };
        return statusMap[status] ?? '-';
      },
    },
    {
      title: '摘要',
      dataIndex: ['processInstance', 'summary'],
      key: 'summary',
      width: 200,
      ellipsis: true,
      customRender: ({ record }: any) => {
        if (tab === 'copy') {
          return formatSummary(record.summary);
        }
        if (tab === 'myBill') {
          return formatSummary(record.summary);
        }
        return formatSummary(record.processInstance?.summary);
      },
    },
    {
      title: '发起人',
      dataIndex: ['processInstance', 'startUser', 'nickname'],
      key: 'startUser',
      width: 100,
      customRender: ({ record }: any) => {
        if (tab === 'copy') {
          return record.startUser?.nickname || '-';
        }
        if (tab === 'myBill') {
          return record.startUser?.nickname || '-';
        }
        return record.processInstance?.startUser?.nickname || '-';
      },
    },
    {
      title: '所属公司',
      dataIndex: ['processInstance', 'companyName'],
      key: 'companyName',
      width: 160,
      ellipsis: true,
      customRender: ({ record }: any) => {
        if (tab === 'copy' || tab === 'myBill') {
          return record.companyName || '-';
        }
        return record.processInstance?.companyName || '-';
      },
    },
    {
      title: '所属部门',
      dataIndex: ['processInstance', 'deptName'],
      key: 'deptName',
      width: 160,
      ellipsis: true,
      customRender: ({ record }: any) => {
        if (tab === 'copy' || tab === 'myBill') {
          return record.deptName || '-';
        }
        return record.processInstance?.deptName || '-';
      },
    },
  ];

  // 特殊列
  const specialColumns: any[] = [];

  switch (tab) {
    case 'copy': {
      // 抄送我的：抄送节点、抄送时间
      specialColumns.push(
        {
          title: '抄送节点',
          dataIndex: 'activityName',
          key: 'activityName',
          width: 120,
        },
        {
          title: '抄送时间',
          dataIndex: 'createTime',
          key: 'copyTime',
          width: 160,
          customRender: ({ text }: any) => {
            return text ? new Date(text).toLocaleString('zh-CN') : '-';
          },
        },
      );

      break;
    }
    case 'done': {
      // 已办任务：任务节点、审批时间、审批建议
      specialColumns.push(
        {
          title: '任务节点',
          dataIndex: 'name',
          key: 'taskName',
          width: 120,
        },
        {
          title: '审批时间',
          dataIndex: 'endTime',
          key: 'endTime',
          width: 160,
          customRender: ({ text }: any) => {
            return text ? new Date(text).toLocaleString('zh-CN') : '-';
          },
        },
        {
          title: '审批建议',
          dataIndex: 'reason',
          key: 'reason',
          width: 150,
          ellipsis: true,
        },
      );

      break;
    }
    case 'myBill': {
      // 我的单据：发起时间
      specialColumns.push({
        title: '发起时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 160,
        customRender: ({ text }: any) => {
          return text ? new Date(text).toLocaleString('zh-CN') : '-';
        },
      });

      break;
    }
    case 'todo': {
      // 待办任务：任务节点、接收时间
      specialColumns.push(
        {
          title: '任务节点',
          dataIndex: 'name',
          key: 'taskName',
          width: 120,
        },
        {
          title: '接收时间',
          dataIndex: 'createTime',
          key: 'receiveTime',
          width: 160,
          customRender: ({ text }: any) => {
            return text ? new Date(text).toLocaleString('zh-CN') : '-';
          },
        },
      );

      break;
    }
    // No default
  }

  // 操作列
  const actionColumn = {
    title: '操作',
    key: 'action',
    width: 100,
    fixed: 'right' as const,
  };

  return [...baseColumns, ...specialColumns, actionColumn];
});

// 加载数据
async function loadData(tab: TabKey) {
  loading.value = true;
  try {
    let response;
    const pageSize = props.maxRecordNum || 10;
    switch (tab) {
      case 'copy': {
        response = await getProcessInstanceCopyPage({
          pageNo: 1,
          pageSize,
        });
        taskList.value = response.list || [];
        statistics.value.copy = response.total || 0;
        break;
      }
      case 'done': {
        response = await getTaskDonePage({ pageNo: 1, pageSize });
        taskList.value = response.list || [];
        statistics.value.done = response.total || 0;
        break;
      }
      case 'myBill': {
        response = await getProcessInstanceMyPage({ pageNo: 1, pageSize });
        taskList.value = response.list || [];
        statistics.value.myBill = response.total || 0;
        break;
      }
      case 'todo': {
        response = await getTaskTodoPage({ pageNo: 1, pageSize });
        taskList.value = response.list || [];
        statistics.value.todo = response.total || 0;
        break;
      }
    }
    // 等待 DOM 更新完成，确保表格正确渲染所有数据
    await nextTick();
  } catch (error) {
    console.error('加载任务数据失败:', error);
    taskList.value = [];
  } finally {
    loading.value = false;
  }
}

// Tab切换事件
function handleTabChange(key: number | string) {
  activeTab.value = String(key) as TabKey;
  loadData(activeTab.value);
}

// 单据编号点击
function handleBillCodeClick(record: any) {
  const tab = activeTab.value;

  switch (tab) {
    case 'copy': {
      // 抄送我的：跳转到流程实例详情（只读模式）
      router.push({
        name: 'BpmProcessInstanceDetail',
        query: {
          id: record.processInstanceId,
          isCopy: 'true',
          ...(record.activityId && { activityId: record.activityId }),
          ...(record.reason && { copyReason: record.reason }),
        },
      });

      break;
    }
    case 'done': {
      // 已办任务：跳转到流程实例详情
      router.push({
        name: 'BpmProcessInstanceDetail',
        query: {
          id: record.processInstance?.id,
          taskId: record.id,
        },
      });

      break;
    }
    case 'myBill': {
      // 我的单据：跳转到流程实例详情（带 isTodo=false）
      router.push({
        name: 'BpmProcessInstanceDetail',
        query: { id: record.id, isTodo: 'false' },
      });

      break;
    }
    case 'todo': {
      // 待办任务：跳转到待办办理页
      router.push({
        name: 'BpmProcessInstanceTodoDetail',
        query: {
          id: record.processInstance?.id,
          taskId: record.id,
          isTodo: 'true',
          nodeKey: record.taskDefinitionKey,
        },
      });

      break;
    }
    // No default
  }
}

// 办理任务（待办任务）
function handleProcess(record: any) {
  // 待办任务：跳转到待办办理页
  router.push({
    name: 'BpmProcessInstanceTodoDetail',
    query: {
      id: record.processInstance?.id,
      taskId: record.id,
      isTodo: 'true',
      nodeKey: record.taskDefinitionKey,
    },
  });
}

// 查看详情（我的单据、已办、抄送）
function handleDetail(record: any) {
  const tab = activeTab.value;

  switch (tab) {
    case 'copy': {
      // 抄送我的：跳转到流程实例详情（只读模式）
      router.push({
        name: 'BpmProcessInstanceDetail',
        query: {
          id: record.processInstanceId,
          isCopy: 'true',
          ...(record.activityId && { activityId: record.activityId }),
          ...(record.reason && { copyReason: record.reason }),
        },
      });

      break;
    }
    case 'done': {
      // 已办任务：跳转到流程实例详情
      router.push({
        name: 'BpmProcessInstanceDetail',
        query: {
          id: record.processInstance?.id,
          taskId: record.id,
        },
      });

      break;
    }
    case 'myBill': {
      // 我的单据：跳转到流程实例详情（参考"我的流程"页面，带 isTodo=false）
      router.push({
        name: 'BpmProcessInstanceDetail',
        query: { id: record.id, isTodo: 'false' },
      });

      break;
    }
    // No default
  }
}

// 查看更多
function handleViewMore() {
  const routeNameMap: Record<TabKey, string> = {
    myBill: 'BpmProcessInstanceMy',
    todo: 'BpmTodoTask',
    done: 'BpmDoneTask',
    copy: 'BpmCopyTask',
  };

  const routeName = routeNameMap[activeTab.value];
  if (routeName) {
    router.push({ name: routeName });
  }
}

// 加载所有数据（当前tab数据 + 其他tab统计）
async function loadAllData() {
  const currentTab = activeTab.value;

  // 先加载当前tab的数据（使用loadData函数保证逻辑一致）
  await loadData(currentTab);

  // 并行加载其他tab的统计数据
  const otherTabs: TabKey[] = ['myBill', 'todo', 'done', 'copy'].filter(
    (tab) => tab !== currentTab,
  ) as TabKey[];

  try {
    const promises = otherTabs.map((tab) => {
      switch (tab) {
        case 'copy': {
          return getProcessInstanceCopyPage({ pageNo: 1, pageSize: 1 });
        }
        case 'done': {
          return getTaskDonePage({ pageNo: 1, pageSize: 1 });
        }
        case 'myBill': {
          return getProcessInstanceMyPage({ pageNo: 1, pageSize: 1 });
        }
        case 'todo': {
          return getTaskTodoPage({ pageNo: 1, pageSize: 1 });
        }
        default: {
          return Promise.resolve({ total: 0 });
        }
      }
    });

    const results = await Promise.all(promises);

    // 更新其他tab的统计数据
    otherTabs.forEach((tab, index) => {
      statistics.value[tab] = results[index]?.total || 0;
    });
  } catch (error) {
    console.error('加载其他tab统计数据失败:', error);
  }
}

// 表格动态滚动高度
const tableWrapperRef = ref<HTMLElement | null>(null);
const tableScrollY = ref<number>(350);
let resizeObserver: ResizeObserver | null = null;

/** 更新表格滚动区域高度 */
function updateTableScrollY() {
  if (!tableWrapperRef.value) return;
  const headerHeight = 55; // 表头高度（包含排序等）
  const wrapperHeight = tableWrapperRef.value.clientHeight;
  tableScrollY.value = Math.max(wrapperHeight - headerHeight, 100);
}

// 初始化
onMounted(() => {
  loadAllData();

  // 监听容器大小变化，动态调整表格滚动高度
  nextTick(() => {
    if (tableWrapperRef.value) {
      updateTableScrollY();
      resizeObserver = new ResizeObserver(() => {
        updateTableScrollY();
      });
      resizeObserver.observe(tableWrapperRef.value);
    }
  });
});

// 组件卸载时清理观察器
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

// 页面被KeepAlive缓存后重新激活时，自动刷新数据
onActivated(() => {
  loadAllData();
});
</script>

<template>
  <div class="workbench-task-list flex h-full flex-col rounded-lg bg-background">
    <div class="flex flex-shrink-0 items-end justify-between px-3">
      <Tabs
        v-model:active-key="activeTab"
        class="flex-1"
        @change="handleTabChange"
      >
        <template v-for="tab in tabs" :key="tab.key">
          <Tabs.TabPane>
            <template #tab>
              <Badge :count="tab.count" :overflow-count="99" :offset="[10, 0]">
                <span class="px-2">{{ tab.label }}</span>
              </Badge>
            </template>
          </Tabs.TabPane>
        </template>
      </Tabs>
      <a
        class="cursor-pointer pb-6 text-sm text-primary hover:underline"
        @click="handleViewMore"
      >
        查看更多
      </a>
    </div>

    <div ref="tableWrapperRef" class="task-table-wrapper min-h-0 flex-1 overflow-auto px-3 pb-2">
      <Table
        :key="`${activeTab}-${taskList.length}`"
        :columns="columns"
        :data-source="taskList"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1200, y: tableScrollY }"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'billCode'">
            <a
              v-if="
                record.processInstance?.billCode ||
                record.billCode ||
                record.formVariables?.billCode
              "
              class="bill-code-link"
              @click="handleBillCodeClick(record)"
            >
              {{
                activeTab === 'myBill'
                  ? record.billCode || record.formVariables?.billCode
                  : activeTab === 'copy'
                    ? record.billCode
                    : record.processInstance?.billCode
              }}
            </a>
            <span v-else>-</span>
          </template>
          <template
            v-else-if="column.key === 'status' && activeTab === 'myBill'"
          >
            <!-- 审批中且有待办任务：显示审批人信息 -->
            <template
              v-if="
                record.status === 1 && record.tasks && record.tasks.length > 0
              "
            >
              <span>
                <span class="text-primary">{{
                  record.tasks[0]?.assigneeUser?.nickname || '未知用户'
                }}</span>
                <template v-if="record.tasks.length > 1">
                  等 {{ record.tasks.length }} 人
                </template>
                （{{ record.tasks[0]?.name || '未知任务' }}）审批中
              </span>
            </template>
            <!-- 其他状态：正常显示状态文字 -->
            <template v-else>
              {{
                {
                  [-1]: '未提交',
                  1: '审批中',
                  2: '已通过',
                  3: '未通过',
                  4: '已取消',
                }[record.status] ?? '-'
              }}
            </template>
          </template>
          <template v-else-if="column.key === 'action'">
            <!-- 待办任务：显示办理按钮 -->
            <template v-if="activeTab === 'todo'">
              <TableAction
                :actions="[
                  {
                    label: '办理',
                    type: 'link',
                    icon: ACTION_ICON.VIEW,
                    onClick: () => handleProcess(record),
                  },
                ]"
              />
            </template>
            <!-- 我的单据、已办和抄送：显示详情按钮 -->
            <template v-else>
              <TableAction
                :actions="[
                  {
                    label: '详情',
                    type: 'link',
                    icon: ACTION_ICON.VIEW,
                    onClick: () => handleDetail(record),
                  },
                ]"
              />
            </template>
          </template>
        </template>
      </Table>
    </div>
  </div>
</template>

<style scoped>
.workbench-task-list {
  box-shadow:
    0 1px 2px 0 rgb(0 0 0 / 3%),
    0 1px 6px -1px rgb(0 0 0 / 2%),
    0 2px 4px 0 rgb(0 0 0 / 2%);
}

.task-table-wrapper {
  min-height: 0;
}

/* 单据编号链接样式 */
.bill-code-link {
  color: hsl(var(--primary));
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s;
}

.bill-code-link:hover {
  color: hsl(var(--primary) / 80%);
  text-decoration: underline;
}

/* 表格样式优化 */
.task-table-wrapper :deep(.ant-table) {
  font-size: 13px;
}

.task-table-wrapper :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  background-color: #fafafa;
}

.task-table-wrapper :deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f5f5;
}

.task-table-wrapper :deep(.ant-table-cell) {
  padding: 6px 8px !important;
}

/* 优化操作列固定阴影效果，使其更柔和 */
.task-table-wrapper :deep(.ant-table-cell-fix-right) {
  background-color: #fff;
  box-shadow: -2px 0 4px rgb(0 0 0 / 3%) !important;
}

.task-table-wrapper :deep(.ant-table-cell-fix-right-first::after) {
  box-shadow: none !important;
}

.task-table-wrapper
  :deep(.ant-table-tbody > tr:hover > .ant-table-cell-fix-right) {
  background-color: #f5f5f5;
}
</style>

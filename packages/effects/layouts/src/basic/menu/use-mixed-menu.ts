import type { MenuRecordRaw } from '@vben/types';

import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { preferences, updatePreferences, usePreferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';
import { findMenuByPath, findRootMenuByPath } from '@vben/utils';

import { useNavigation } from './use-navigation';

function useMixedMenu() {
  const { navigation, willOpenedByWindow } = useNavigation();
  const accessStore = useAccessStore();
  const route = useRoute();
  const splitSideMenus = ref<MenuRecordRaw[]>([]);
  const rootMenuPath = ref<string>('');
  const mixedRootMenuPath = ref<string>('');
  const mixExtraMenus = ref<MenuRecordRaw[]>([]);
  /** 记录当前顶级菜单下哪个子菜单最后激活 */
  const defaultSubMap = new Map<string, string>();
  const { isMixedNav, isHeaderMixedNav } = usePreferences();

  const needSplit = computed(
    () =>
      (preferences.navigation.split && isMixedNav.value) ||
      isHeaderMixedNav.value,
  );

  const sidebarVisible = computed(() => {
    const enableSidebar = preferences.sidebar.enable;
    if (needSplit.value) {
      return enableSidebar && splitSideMenus.value.length > 0;
    }
    return enableSidebar;
  });
  const menus = computed(() => accessStore.accessMenus);

  /**
   * 头部菜单
   */
  const headerMenus = computed(() => {
    if (!needSplit.value) {
      return menus.value;
    }
    return menus.value.map((item) => {
      return {
        ...item,
        children: [],
      };
    });
  });

  /**
   * 侧边菜单
   */
  const sidebarMenus = computed(() => {
    return needSplit.value ? splitSideMenus.value : menus.value;
  });

  const mixHeaderMenus = computed(() => {
    return isHeaderMixedNav.value ? sidebarMenus.value : headerMenus.value;
  });

  /**
   * 侧边菜单激活路径
   */
  const sidebarActive = computed(() => {
    const queryMenuPath = route.query.menuActivePath;
    if (typeof queryMenuPath === 'string' && queryMenuPath) {
      return queryMenuPath;
    }
    return (route?.meta?.activePath as string) ?? route.path;
  });

  /**
   * 头部菜单激活路径
   */
  const headerActive = computed(() => {
    if (!needSplit.value) {
      return route.meta?.activePath ?? route.path;
    }
    return rootMenuPath.value;
  });

  /**
   * 菜单点击事件处理
   * @param key 菜单路径
   * @param mode 菜单模式
   */
  const handleMenuSelect = (key: string, mode?: string) => {
    if (!needSplit.value || mode === 'vertical') {
      navigation(key);
      return;
    }
    const rootMenu = menus.value.find((item) => item.path === key);
    const _splitSideMenus = rootMenu?.children ?? [];

    if (!willOpenedByWindow(key)) {
      rootMenuPath.value = rootMenu?.path ?? '';
      splitSideMenus.value = _splitSideMenus;
    }

    if (_splitSideMenus.length === 0) {
      navigation(key);
    } else if (rootMenu && preferences.sidebar.autoActivateChild) {
      navigation(
        defaultSubMap.has(rootMenu.path)
          ? (defaultSubMap.get(rootMenu.path) as string)
          : rootMenu.path,
      );
    }
  };

  /**
   * 侧边菜单展开事件
   * @param key 路由路径
   * @param parentsPath 父级路径
   */
  const handleMenuOpen = (key: string, parentsPath: string[]) => {
    if (parentsPath.length <= 1 && preferences.sidebar.autoActivateChild) {
      // 当前路由为隐藏子路由（如编辑/详情页 hideInMenu: true）时，
      // initMenu 自动展开父菜单会触发此回调，不应执行导航，否则会将路由推回父页面
      if (route.meta?.hideInMenu) {
        return;
      }
      navigation(
        defaultSubMap.has(key) ? (defaultSubMap.get(key) as string) : key,
      );
    }
  };

  /**
   * 混合导航下，根据路径找到顶栏对应的一级菜单（含子菜单列表）
   * hideInMenu 详情页仅能通过 activePath 命中叶子菜单，需向上找到顶栏根节点
   */
  function findHeaderRootMenu(path: string) {
    for (const menu of menus.value) {
      if (menu.path === path) {
        return menu;
      }
      if (menu.children?.length && findMenuByPath(menu.children, path)) {
        return menu;
      }
    }
    return undefined;
  }

  /** 混合导航下用于计算左侧菜单的路径（优先 query 传入的菜单上下文） */
  function resolveMenuContextPath(path: string = route.path) {
    const queryMenuPath = route.query.menuActivePath;
    if (typeof queryMenuPath === 'string' && queryMenuPath) {
      return queryMenuPath;
    }
    return (route.meta?.activePath as string) ?? (route.meta?.link as string) ?? path;
  }

  /**
   * 计算侧边菜单
   * @param path 路由路径
   */
  function calcSideMenus(path: string = route.path) {
    const prevSplitSideMenus = splitSideMenus.value;
    const prevRootMenuPath = rootMenuPath.value;

    let rootMenu = findHeaderRootMenu(path);
    if (!rootMenu) {
      const found = findRootMenuByPath(menus.value, path);
      rootMenu =
        found.rootMenu ?? menus.value.find((item) => item.path === path);
    }
    const result = findRootMenuByPath(rootMenu?.children || [], path, 1);
    mixedRootMenuPath.value = result.rootMenuPath ?? '';
    mixExtraMenus.value = result.rootMenu?.children ?? [];
    rootMenuPath.value = rootMenu?.path ?? '';
    splitSideMenus.value = rootMenu?.children ?? [];

    // hideInMenu 详情页 activePath 未命中菜单树时，保留上一页侧边栏（如从业务列表进 BPM 详情）
    if (
      splitSideMenus.value.length === 0 &&
      route.meta?.hideInMenu &&
      prevSplitSideMenus.length > 0
    ) {
      splitSideMenus.value = prevSplitSideMenus;
      rootMenuPath.value = prevRootMenuPath;
    }
  }

  watch(
    () => route.path,
    (path) => {
      // 从"发起流程"进入 OA 表单页时，保持菜单上下文不变（header Tab 留在工作台）
      // 时序说明：route.query 在 watcher 触发时已可用，而 sidebar.hidden 由 info
      // 页面 onMounted 设置，晚于 watcher，因此用 query.from 作为进入信号
      if (route.query.from === 'startProcess') {
        return;
      }

      // 离开 info 表单页时：onBeforeRouteLeave 已将 sidebar.hidden 恢复为 false，
      // 此处兜底确保 sidebar 可见，然后正常重算菜单
      if (preferences.sidebar.hidden) {
        updatePreferences({ sidebar: { hidden: false } });
      }

      const currentPath = resolveMenuContextPath(path);
      if (willOpenedByWindow(currentPath)) {
        return;
      }
      calcSideMenus(currentPath);
      if (rootMenuPath.value)
        defaultSubMap.set(rootMenuPath.value, currentPath);
    },
    { immediate: true },
  );

  // 切换账号后 accessMenus 更新但 route 未变时，重新计算侧边栏
  watch(
    () => accessStore.accessMenus,
    () => {
      calcSideMenus(resolveMenuContextPath(route.path));
    },
    { deep: true },
  );

  // 初始化计算侧边菜单
  onBeforeMount(() => {
    calcSideMenus(resolveMenuContextPath());
  });

  return {
    handleMenuSelect,
    handleMenuOpen,
    headerActive,
    headerMenus,
    sidebarActive,
    sidebarMenus,
    mixHeaderMenus,
    mixExtraMenus,
    sidebarVisible,
  };
}

export { useMixedMenu };

import type { Component, DefineComponent } from 'vue';

import type {
  AccessModeType,
  GenerateMenuAndRoutesOptions,
  RouteRecordRaw,
} from '@vben/types';

import { defineComponent, h } from 'vue';

import {
  cloneDeep,
  generateMenus,
  generateRoutesByBackend,
  generateRoutesByFrontend,
  isFunction,
  isString,
  mapTree,
} from '@vben/utils';

async function generateAccessible(
  mode: AccessModeType,
  options: GenerateMenuAndRoutesOptions,
) {
  const { router } = options;

  options.routes = cloneDeep(options.routes);
  // 生成路由
  const accessibleRoutes = await generateRoutes(mode, options);

  const root = router.getRoutes().find((item) => item.path === '/');

  // 获取已有的路由名称列表
  const names = root?.children?.map((item) => item.name) ?? [];

  // 动态添加到router实例内
  accessibleRoutes.forEach((route) => {
    if (root && !route.meta?.noBasicLayout) {
      // 为了兼容之前的版本用法，如果包含子路由，则将component移除，以免出现多层BasicLayout
      // 如果你的项目已经跟进了本次修改，移除了所有自定义菜单首级的BasicLayout，可以将这段if代码删除
      if (route.children && route.children.length > 0) {
        delete route.component;
      }
      // 根据router name判断，如果路由已经存在，则不再添加
      if (names?.includes(route.name)) {
        // 找到已存在的路由索引并更新，不更新会造成切换用户时，一级目录未更新，homePath 在二级目录导致的404问题
        const index = root.children?.findIndex(
          (item) => item.name === route.name,
        );
        if (index !== undefined && index !== -1 && root.children) {
          // 合并已有路由的子路由，避免静态模块路由中定义的子路由（如 BpmModelCreate、BpmModelUpdate）被动态路由覆盖后丢失
          const existingRoute = root.children[index];
          if (
            existingRoute.children?.length &&
            route.children !== undefined
          ) {
            const newChildNames = new Set(
              route.children
                .map((c: RouteRecordRaw) => c.name)
                .filter(Boolean),
            );
            for (const child of existingRoute.children) {
              if (child.name && !newChildNames.has(child.name)) {
                route.children.push(child);
              }
            }
          }
          root.children[index] = route;
        }
      } else {
        // 按 name 未匹配时，尝试按 path 匹配：
        // 静态路由（如 name:'bpm'）与后端路由（如 name:'工作流'）可能 name 不同但 path 相同，
        // 不合并会导致同一 path 出现两个父路由，静态子路由（hideInMenu 的表单页等）无法被正确解析
        const pathIndex = root.children?.findIndex(
          (item) => item.path === route.path,
        );
        if (
          pathIndex !== undefined &&
          pathIndex !== -1 &&
          root.children
        ) {
          const existingRoute = root.children[pathIndex];
          if (!existingRoute) {
            root.children.push(route);
            return;
          }
          // 选择 children 更多的路由作为主路由，将另一个的独有子路由合并进去
          const existingCount = existingRoute.children?.length ?? 0;
          const newCount = route.children?.length ?? 0;
          if (newCount >= existingCount) {
            // 新路由 children 更多或相等，把旧路由的独有子路由合并到新路由
            if (existingRoute.children?.length) {
              const newChildNames = new Set(
                (route.children || [])
                  .map((c: RouteRecordRaw) => c.name)
                  .filter(Boolean),
              );
              for (const child of existingRoute.children) {
                if (child.name && !newChildNames.has(child.name)) {
                  (route.children ||= []).push(child);
                }
              }
            }
            // 移除旧的，添加合并后的新路由
            root.children.splice(pathIndex, 1, route);
          } else {
            // 旧路由 children 更多，把新路由的独有子路由合并到旧路由
            if (route.children?.length && existingRoute.children) {
              const existingChildNames = new Set(
                existingRoute.children
                  .map((c: RouteRecordRaw) => c.name)
                  .filter(Boolean),
              );
              for (const child of route.children) {
                if (child.name && !existingChildNames.has(child.name)) {
                  existingRoute.children.push(child);
                }
              }
            }
            // 旧路由已包含所有子路由，无需替换
          }
        } else {
          root.children?.push(route);
        }
      }
    } else {
      router.addRoute(route);
    }
  });

  if (root) {
    if (root.name) {
      router.removeRoute(root.name);
    }
    router.addRoute(root);
  }

  // 生成菜单
  const accessibleMenus = generateMenus(accessibleRoutes, options.router);

  return { accessibleMenus, accessibleRoutes };
}

/**
 * Generate routes
 * @param mode
 * @param options
 */
async function generateRoutes(
  mode: AccessModeType,
  options: GenerateMenuAndRoutesOptions,
) {
  const { forbiddenComponent, roles, routes } = options;

  let resultRoutes: RouteRecordRaw[] = routes;
  switch (mode) {
    case 'backend': {
      resultRoutes = await generateRoutesByBackend(options);
      break;
    }
    case 'frontend': {
      resultRoutes = await generateRoutesByFrontend(
        routes,
        roles || [],
        forbiddenComponent,
      );
      break;
    }
    case 'mixed': {
      const [frontend_resultRoutes, backend_resultRoutes] = await Promise.all([
        generateRoutesByFrontend(routes, roles || [], forbiddenComponent),
        generateRoutesByBackend(options),
      ]);

      resultRoutes = [...frontend_resultRoutes, ...backend_resultRoutes];
      break;
    }
  }

  /**
   * 调整路由树，做以下处理：
   * 1. 对未添加redirect的路由添加redirect
   * 2. 将懒加载的组件名称修改为当前路由的名称（如果启用了keep-alive的话）
   */
  resultRoutes = mapTree(resultRoutes, (route) => {
    // 重新包装component，使用与路由名称相同的name以支持keep-alive的条件缓存。
    if (
      route.meta?.keepAlive &&
      isFunction(route.component) &&
      route.name &&
      isString(route.name)
    ) {
      const originalComponent = route.component as () => Promise<{
        default: Component | DefineComponent;
      }>;
      route.component = async () => {
        const component = await originalComponent();
        if (!component.default) return component;
        return defineComponent({
          name: route.name as string,
          setup(props, { attrs, slots }) {
            return () => h(component.default, { ...props, ...attrs }, slots);
          },
        });
      };
    }

    // 如果有redirect或者没有子路由，则直接返回
    if (route.redirect || !route.children || route.children.length === 0) {
      return route;
    }
    const firstChild = route.children[0];

    // 如果子路由不存在或没有path，则直接返回
    if (!firstChild?.path) {
      return route;
    }

    // 子路由以/开头时，直接使用其path作为redirect（已计算过全部父级path）
    if (firstChild.path.startsWith('/')) {
      route.redirect = firstChild.path;
    }
    // 子路由为相对路径时，需要拼接父级path才能得到完整路径，这里不做处理

    return route;
  });

  return resultRoutes;
}

export { generateAccessible };

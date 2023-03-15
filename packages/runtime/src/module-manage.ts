/* eslint-disable func-names */
/* eslint-disable no-undef */
import 'systemjs/dist/system.min.js';

const isAsyncFlag = 'Symbol' in self ? Symbol('is_async_flag') : '$__is_async_flag__';

/** 拓展 systemjs 的 import-maps */
const import_maps:TImportMaps = {};

/** 运行时注入的模块 */
const loaded_modules:TCustomModuleMaps = {};

/** 元数据暂存对象 */
const meta_maps:TMetaDataMaps = {};

/** Link 模式引入的 css 模块正则  */
const CSS_LINK_MODULE_PATTERN = /^___INJECT_STYLE_LINK___/;

/** Link 模式引入的 css 模块标识 */
const CSS_LINK_MODULE_STRING = '___INJECT_STYLE_LINK___';

function getVarRegister(m: unknown) {
  return [[], (_export: Function) => ({ setters: [], execute: () => { _export(m); } })];
}

if (!System) {
  throw new Error('System 对象不存在，请提前引入 systemjs～');
}

const System_createContext = System.constructor.prototype.createContext;
System.constructor.prototype.createContext = function (parentId: string) {
  const meta = System_createContext.call(this, parentId) || {};
  if (meta_maps[parentId]) {
    meta.data = meta_maps[parentId];
    delete meta_maps[parentId];
  }
  return meta;
};

// 自定义a 模块 id 处理钩子
const System_resolve = System.constructor.prototype.resolve;
System.constructor.prototype.resolve = function (id: string, parentURL?: string) {
  let finalUrl = '';
  const moduleId = import_maps[id];
  if (moduleId) {
    finalUrl = System_resolve.call(this, moduleId, parentURL);
  } else if (loaded_modules[id] || CSS_LINK_MODULE_PATTERN.test(id)) {
    return id;
  } else {
    finalUrl = System_resolve.call(this, id, parentURL);
  }
  if (meta_maps[id] && id !== finalUrl) {
    meta_maps[finalUrl] = meta_maps[id];
    delete meta_maps[id];
  }
  return finalUrl;
};
// 自定义模块安装钩子
const System_instantiate = System.constructor.prototype.instantiate;
// 返回redister数组 [deps, declare, metas];
System.constructor.prototype.instantiate = function (url: string, firstParentUrl?: string) {
  const loadModule = loaded_modules[url];
  if (loadModule) { // loaded_modules中存在这个id，说明是通过runtime注入的自定义模块，在这里通过自定义方法处理
    return new Promise((resolve, reject) => {
      if (loadModule[isAsyncFlag]) { // 异步模块
        loadModule()
        .then((m) => resolve(getVarRegister(m)))
        .catch(reject);
      } else { // 同步模块
        resolve(getVarRegister(loadModule));
      }
    });
  }
  // 这里是自定义的css处理，通过创建link标签插入html文档加载
  if (CSS_LINK_MODULE_PATTERN.test(url)) {
    return new Promise((resolve) => {
      const splits = url.split('?link=');
      if (splits[1]) {
        const { href } = new URL(splits[1], firstParentUrl);
        if (!document.querySelector(`link[href="${href}"]`)) {
          const linkEl = document.createElement('link');
          linkEl.href = href;
          linkEl.type = 'text/css';
          linkEl.rel = 'stylesheet';
          document.head.append(linkEl);
          linkEl.onload = () => {
            resolve(getVarRegister({}));
          };
          linkEl.onerror = () => {
            console.error(new Error(`${href} 加载失败～`));
            resolve(getVarRegister({ url: href }));
          };
        }
      } else {
        resolve(getVarRegister({ url }));
      }
    });
  }
  // 如果以上都不是，交给system自己的原生方法处理，比如import-map里的映射关系
  return System_instantiate.call(this, url, firstParentUrl);
};

const register = {
  /** 注入自定义模块 */
  set(maps:TCustomModuleMaps, force = true) {
    Object.keys(maps).forEach((name) => {
      if (force || !loaded_modules[name]) {
        const module = maps[name];
        if (module) {
          if (typeof module === 'object' && !('default' in module) && !Object.isFrozen(module)) {
            module.default = { ...module };
          }
          loaded_modules[name] = module;
        }
      }
    });
  },
  setDynamic(maps: TDynamicModuleMaps, force = true) {
    Object.keys(maps).forEach((name) => {
      if (force || !loaded_modules[name]) {
        const module = maps[name];
        if (module) {
          module[isAsyncFlag] = true;
          loaded_modules[name] = module;
        }
      }
    });
  },
  /** 拓展 systemjs 的 import map  */
  extendImportMaps(maps:TImportMaps, force = true) {
    Object.keys(maps).forEach((name) => {
      if (force || !import_maps[name]) {
        import_maps[name] = maps[name];
      }
    });
  },
  /** 加载模块前为该模块设置 meta 数据 */
  setMetadata(id: string, data:Record<string, any>) {
    if (typeof id === 'string' && typeof data === 'object') {
      meta_maps[id] = data;
    } else {
      console.warn('setMeta error~');
    }
  },
};

export default Object.freeze({
  ...register,
  CSS_LINK_MODULE_PATTERN,
  CSS_LINK_MODULE_STRING,
});

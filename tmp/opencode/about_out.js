var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// aldraled/node_modules/void-elements/index.js
var require_void_elements = __commonJS({
  "aldraled/node_modules/void-elements/index.js"(exports, module) {
    module.exports = {
      "area": true,
      "base": true,
      "br": true,
      "col": true,
      "embed": true,
      "hr": true,
      "img": true,
      "input": true,
      "link": true,
      "meta": true,
      "param": true,
      "source": true,
      "track": true,
      "wbr": true
    };
  }
});

// aldraled/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js
var require_use_sync_external_store_shim_development = __commonJS({
  "aldraled/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js"(exports) {
    "use strict";
    (function() {
      function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      function useSyncExternalStore$2(subscribe, getSnapshot) {
        didWarnOld18Alpha || void 0 === React5.startTransition || (didWarnOld18Alpha = true, console.error(
          "You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."
        ));
        var value = getSnapshot();
        if (!didWarnUncachedGetSnapshot) {
          var cachedValue = getSnapshot();
          objectIs(value, cachedValue) || (console.error(
            "The result of getSnapshot should be cached to avoid an infinite loop"
          ), didWarnUncachedGetSnapshot = true);
        }
        cachedValue = useState3({
          inst: { value, getSnapshot }
        });
        var inst = cachedValue[0].inst, forceUpdate = cachedValue[1];
        useLayoutEffect(
          function() {
            inst.value = value;
            inst.getSnapshot = getSnapshot;
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          },
          [subscribe, value, getSnapshot]
        );
        useEffect3(
          function() {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            return subscribe(function() {
              checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            });
          },
          [subscribe]
        );
        useDebugValue(value);
        return value;
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch (error) {
          return true;
        }
      }
      function useSyncExternalStore$1(subscribe, getSnapshot) {
        return getSnapshot();
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React5 = __require("react"), objectIs = "function" === typeof Object.is ? Object.is : is, useState3 = React5.useState, useEffect3 = React5.useEffect, useLayoutEffect = React5.useLayoutEffect, useDebugValue = React5.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
      exports.useSyncExternalStore = void 0 !== React5.useSyncExternalStore ? React5.useSyncExternalStore : shim;
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// aldraled/node_modules/use-sync-external-store/shim/index.js
var require_shim = __commonJS({
  "aldraled/node_modules/use-sync-external-store/shim/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_use_sync_external_store_shim_development();
    }
  }
});

// aldraled/src/pages/About.js
import React4, { useState as useState2, useEffect as useEffect2, useMemo as useMemo3 } from "react";
import { Link as Link2 } from "react-router-dom";
import axios2 from "axios";

// aldraled/node_modules/react-i18next/dist/es/Trans.js
import { useContext } from "react";

// aldraled/node_modules/react-i18next/dist/es/TransWithoutContext.js
import { Fragment, isValidElement, cloneElement, createElement, Children } from "react";

// aldraled/node_modules/i18next/dist/esm/i18next.js
var isString = (obj) => typeof obj === "string";
var defer = () => {
  let res;
  let rej;
  const promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });
  promise.resolve = res;
  promise.reject = rej;
  return promise;
};
var makeString = (object) => {
  if (object == null) return "";
  return "" + object;
};
var copy = (a, s, t2) => {
  a.forEach((m) => {
    if (s[m]) t2[m] = s[m];
  });
};
var lastOfPathSeparatorRegExp = /###/g;
var cleanKey = (key) => key && key.indexOf("###") > -1 ? key.replace(lastOfPathSeparatorRegExp, ".") : key;
var canNotTraverseDeeper = (object) => !object || isString(object);
var getLastOfPath = (object, path, Empty) => {
  const stack = !isString(path) ? path : path.split(".");
  let stackIndex = 0;
  while (stackIndex < stack.length - 1) {
    if (canNotTraverseDeeper(object)) return {};
    const key = cleanKey(stack[stackIndex]);
    if (!object[key] && Empty) object[key] = new Empty();
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      object = object[key];
    } else {
      object = {};
    }
    ++stackIndex;
  }
  if (canNotTraverseDeeper(object)) return {};
  return {
    obj: object,
    k: cleanKey(stack[stackIndex])
  };
};
var setPath = (object, path, newValue) => {
  const {
    obj,
    k
  } = getLastOfPath(object, path, Object);
  if (obj !== void 0 || path.length === 1) {
    obj[k] = newValue;
    return;
  }
  let e2 = path[path.length - 1];
  let p = path.slice(0, path.length - 1);
  let last = getLastOfPath(object, p, Object);
  while (last.obj === void 0 && p.length) {
    e2 = `${p[p.length - 1]}.${e2}`;
    p = p.slice(0, p.length - 1);
    last = getLastOfPath(object, p, Object);
    if (last?.obj && typeof last.obj[`${last.k}.${e2}`] !== "undefined") {
      last.obj = void 0;
    }
  }
  last.obj[`${last.k}.${e2}`] = newValue;
};
var pushPath = (object, path, newValue, concat) => {
  const {
    obj,
    k
  } = getLastOfPath(object, path, Object);
  obj[k] = obj[k] || [];
  obj[k].push(newValue);
};
var getPath = (object, path) => {
  const {
    obj,
    k
  } = getLastOfPath(object, path);
  if (!obj) return void 0;
  if (!Object.prototype.hasOwnProperty.call(obj, k)) return void 0;
  return obj[k];
};
var getPathWithDefaults = (data, defaultData, key) => {
  const value = getPath(data, key);
  if (value !== void 0) {
    return value;
  }
  return getPath(defaultData, key);
};
var deepExtend = (target, source, overwrite) => {
  for (const prop in source) {
    if (prop !== "__proto__" && prop !== "constructor") {
      if (prop in target) {
        if (isString(target[prop]) || target[prop] instanceof String || isString(source[prop]) || source[prop] instanceof String) {
          if (overwrite) target[prop] = source[prop];
        } else {
          deepExtend(target[prop], source[prop], overwrite);
        }
      } else {
        target[prop] = source[prop];
      }
    }
  }
  return target;
};
var regexEscape = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var _entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;"
};
var escape = (data) => {
  if (isString(data)) {
    return data.replace(/[&<>"'\/]/g, (s) => _entityMap[s]);
  }
  return data;
};
var RegExpCache = class {
  constructor(capacity) {
    this.capacity = capacity;
    this.regExpMap = /* @__PURE__ */ new Map();
    this.regExpQueue = [];
  }
  getRegExp(pattern) {
    const regExpFromCache = this.regExpMap.get(pattern);
    if (regExpFromCache !== void 0) {
      return regExpFromCache;
    }
    const regExpNew = new RegExp(pattern);
    if (this.regExpQueue.length === this.capacity) {
      this.regExpMap.delete(this.regExpQueue.shift());
    }
    this.regExpMap.set(pattern, regExpNew);
    this.regExpQueue.push(pattern);
    return regExpNew;
  }
};
var chars = [" ", ",", "?", "!", ";"];
var looksLikeObjectPathRegExpCache = new RegExpCache(20);
var looksLikeObjectPath = (key, nsSeparator, keySeparator) => {
  nsSeparator = nsSeparator || "";
  keySeparator = keySeparator || "";
  const possibleChars = chars.filter((c) => nsSeparator.indexOf(c) < 0 && keySeparator.indexOf(c) < 0);
  if (possibleChars.length === 0) return true;
  const r = looksLikeObjectPathRegExpCache.getRegExp(`(${possibleChars.map((c) => c === "?" ? "\\?" : c).join("|")})`);
  let matched = !r.test(key);
  if (!matched) {
    const ki = key.indexOf(keySeparator);
    if (ki > 0 && !r.test(key.substring(0, ki))) {
      matched = true;
    }
  }
  return matched;
};
var deepFind = (obj, path, keySeparator = ".") => {
  if (!obj) return void 0;
  if (obj[path]) {
    if (!Object.prototype.hasOwnProperty.call(obj, path)) return void 0;
    return obj[path];
  }
  const tokens = path.split(keySeparator);
  let current = obj;
  for (let i = 0; i < tokens.length; ) {
    if (!current || typeof current !== "object") {
      return void 0;
    }
    let next;
    let nextPath = "";
    for (let j = i; j < tokens.length; ++j) {
      if (j !== i) {
        nextPath += keySeparator;
      }
      nextPath += tokens[j];
      next = current[nextPath];
      if (next !== void 0) {
        if (["string", "number", "boolean"].indexOf(typeof next) > -1 && j < tokens.length - 1) {
          continue;
        }
        i += j - i + 1;
        break;
      }
    }
    current = next;
  }
  return current;
};
var getCleanedCode = (code) => code?.replace(/_/g, "-");
var consoleLogger = {
  type: "logger",
  log(args) {
    this.output("log", args);
  },
  warn(args) {
    this.output("warn", args);
  },
  error(args) {
    this.output("error", args);
  },
  output(type, args) {
    console?.[type]?.apply?.(console, args);
  }
};
var Logger = class _Logger {
  constructor(concreteLogger, options = {}) {
    this.init(concreteLogger, options);
  }
  init(concreteLogger, options = {}) {
    this.prefix = options.prefix || "i18next:";
    this.logger = concreteLogger || consoleLogger;
    this.options = options;
    this.debug = options.debug;
  }
  log(...args) {
    return this.forward(args, "log", "", true);
  }
  warn(...args) {
    return this.forward(args, "warn", "", true);
  }
  error(...args) {
    return this.forward(args, "error", "");
  }
  deprecate(...args) {
    return this.forward(args, "warn", "WARNING DEPRECATED: ", true);
  }
  forward(args, lvl, prefix, debugOnly) {
    if (debugOnly && !this.debug) return null;
    if (isString(args[0])) args[0] = `${prefix}${this.prefix} ${args[0]}`;
    return this.logger[lvl](args);
  }
  create(moduleName) {
    return new _Logger(this.logger, {
      ...{
        prefix: `${this.prefix}:${moduleName}:`
      },
      ...this.options
    });
  }
  clone(options) {
    options = options || this.options;
    options.prefix = options.prefix || this.prefix;
    return new _Logger(this.logger, options);
  }
};
var baseLogger = new Logger();
var EventEmitter = class {
  constructor() {
    this.observers = {};
  }
  on(events, listener) {
    events.split(" ").forEach((event) => {
      if (!this.observers[event]) this.observers[event] = /* @__PURE__ */ new Map();
      const numListeners = this.observers[event].get(listener) || 0;
      this.observers[event].set(listener, numListeners + 1);
    });
    return this;
  }
  off(event, listener) {
    if (!this.observers[event]) return;
    if (!listener) {
      delete this.observers[event];
      return;
    }
    this.observers[event].delete(listener);
  }
  emit(event, ...args) {
    if (this.observers[event]) {
      const cloned = Array.from(this.observers[event].entries());
      cloned.forEach(([observer, numTimesAdded]) => {
        for (let i = 0; i < numTimesAdded; i++) {
          observer(...args);
        }
      });
    }
    if (this.observers["*"]) {
      const cloned = Array.from(this.observers["*"].entries());
      cloned.forEach(([observer, numTimesAdded]) => {
        for (let i = 0; i < numTimesAdded; i++) {
          observer.apply(observer, [event, ...args]);
        }
      });
    }
  }
};
var ResourceStore = class extends EventEmitter {
  constructor(data, options = {
    ns: ["translation"],
    defaultNS: "translation"
  }) {
    super();
    this.data = data || {};
    this.options = options;
    if (this.options.keySeparator === void 0) {
      this.options.keySeparator = ".";
    }
    if (this.options.ignoreJSONStructure === void 0) {
      this.options.ignoreJSONStructure = true;
    }
  }
  addNamespaces(ns) {
    if (this.options.ns.indexOf(ns) < 0) {
      this.options.ns.push(ns);
    }
  }
  removeNamespaces(ns) {
    const index = this.options.ns.indexOf(ns);
    if (index > -1) {
      this.options.ns.splice(index, 1);
    }
  }
  getResource(lng, ns, key, options = {}) {
    const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
    const ignoreJSONStructure = options.ignoreJSONStructure !== void 0 ? options.ignoreJSONStructure : this.options.ignoreJSONStructure;
    let path;
    if (lng.indexOf(".") > -1) {
      path = lng.split(".");
    } else {
      path = [lng, ns];
      if (key) {
        if (Array.isArray(key)) {
          path.push(...key);
        } else if (isString(key) && keySeparator) {
          path.push(...key.split(keySeparator));
        } else {
          path.push(key);
        }
      }
    }
    const result = getPath(this.data, path);
    if (!result && !ns && !key && lng.indexOf(".") > -1) {
      lng = path[0];
      ns = path[1];
      key = path.slice(2).join(".");
    }
    if (result || !ignoreJSONStructure || !isString(key)) return result;
    return deepFind(this.data?.[lng]?.[ns], key, keySeparator);
  }
  addResource(lng, ns, key, value, options = {
    silent: false
  }) {
    const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
    let path = [lng, ns];
    if (key) path = path.concat(keySeparator ? key.split(keySeparator) : key);
    if (lng.indexOf(".") > -1) {
      path = lng.split(".");
      value = ns;
      ns = path[1];
    }
    this.addNamespaces(ns);
    setPath(this.data, path, value);
    if (!options.silent) this.emit("added", lng, ns, key, value);
  }
  addResources(lng, ns, resources, options = {
    silent: false
  }) {
    for (const m in resources) {
      if (isString(resources[m]) || Array.isArray(resources[m])) this.addResource(lng, ns, m, resources[m], {
        silent: true
      });
    }
    if (!options.silent) this.emit("added", lng, ns, resources);
  }
  addResourceBundle(lng, ns, resources, deep, overwrite, options = {
    silent: false,
    skipCopy: false
  }) {
    let path = [lng, ns];
    if (lng.indexOf(".") > -1) {
      path = lng.split(".");
      deep = resources;
      resources = ns;
      ns = path[1];
    }
    this.addNamespaces(ns);
    let pack = getPath(this.data, path) || {};
    if (!options.skipCopy) resources = JSON.parse(JSON.stringify(resources));
    if (deep) {
      deepExtend(pack, resources, overwrite);
    } else {
      pack = {
        ...pack,
        ...resources
      };
    }
    setPath(this.data, path, pack);
    if (!options.silent) this.emit("added", lng, ns, resources);
  }
  removeResourceBundle(lng, ns) {
    if (this.hasResourceBundle(lng, ns)) {
      delete this.data[lng][ns];
    }
    this.removeNamespaces(ns);
    this.emit("removed", lng, ns);
  }
  hasResourceBundle(lng, ns) {
    return this.getResource(lng, ns) !== void 0;
  }
  getResourceBundle(lng, ns) {
    if (!ns) ns = this.options.defaultNS;
    return this.getResource(lng, ns);
  }
  getDataByLanguage(lng) {
    return this.data[lng];
  }
  hasLanguageSomeTranslations(lng) {
    const data = this.getDataByLanguage(lng);
    const n = data && Object.keys(data) || [];
    return !!n.find((v) => data[v] && Object.keys(data[v]).length > 0);
  }
  toJSON() {
    return this.data;
  }
};
var postProcessor = {
  processors: {},
  addPostProcessor(module) {
    this.processors[module.name] = module;
  },
  handle(processors, value, key, options, translator) {
    processors.forEach((processor) => {
      value = this.processors[processor]?.process(value, key, options, translator) ?? value;
    });
    return value;
  }
};
var PATH_KEY = /* @__PURE__ */ Symbol("i18next/PATH_KEY");
function createProxy() {
  const state = [];
  const handler = /* @__PURE__ */ Object.create(null);
  let proxy;
  handler.get = (target, key) => {
    proxy?.revoke?.();
    if (key === PATH_KEY) return state;
    state.push(key);
    proxy = Proxy.revocable(target, handler);
    return proxy.proxy;
  };
  return Proxy.revocable(/* @__PURE__ */ Object.create(null), handler).proxy;
}
function keysFromSelector(selector, opts) {
  const {
    [PATH_KEY]: path
  } = selector(createProxy());
  const keySeparator = opts?.keySeparator ?? ".";
  const nsSeparator = opts?.nsSeparator ?? ":";
  if (path.length > 1 && nsSeparator) {
    const ns = opts?.ns;
    const namespaces = ns ? Array.isArray(ns) ? ns : [ns] : [];
    if (namespaces.includes(path[0])) {
      return `${path[0]}${nsSeparator}${path.slice(1).join(keySeparator)}`;
    }
  }
  return path.join(keySeparator);
}
var checkedLoadedFor = {};
var shouldHandleAsObject = (res) => !isString(res) && typeof res !== "boolean" && typeof res !== "number";
var Translator = class _Translator extends EventEmitter {
  constructor(services, options = {}) {
    super();
    copy(["resourceStore", "languageUtils", "pluralResolver", "interpolator", "backendConnector", "i18nFormat", "utils"], services, this);
    this.options = options;
    if (this.options.keySeparator === void 0) {
      this.options.keySeparator = ".";
    }
    this.logger = baseLogger.create("translator");
  }
  changeLanguage(lng) {
    if (lng) this.language = lng;
  }
  exists(key, o = {
    interpolation: {}
  }) {
    const opt = {
      ...o
    };
    if (key == null) return false;
    const resolved = this.resolve(key, opt);
    if (resolved?.res === void 0) return false;
    const isObject2 = shouldHandleAsObject(resolved.res);
    if (opt.returnObjects === false && isObject2) {
      return false;
    }
    return true;
  }
  extractFromKey(key, opt) {
    let nsSeparator = opt.nsSeparator !== void 0 ? opt.nsSeparator : this.options.nsSeparator;
    if (nsSeparator === void 0) nsSeparator = ":";
    const keySeparator = opt.keySeparator !== void 0 ? opt.keySeparator : this.options.keySeparator;
    let namespaces = opt.ns || this.options.defaultNS || [];
    const wouldCheckForNsInKey = nsSeparator && key.indexOf(nsSeparator) > -1;
    const seemsNaturalLanguage = !this.options.userDefinedKeySeparator && !opt.keySeparator && !this.options.userDefinedNsSeparator && !opt.nsSeparator && !looksLikeObjectPath(key, nsSeparator, keySeparator);
    if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
      const m = key.match(this.interpolator.nestingRegexp);
      if (m && m.length > 0) {
        return {
          key,
          namespaces: isString(namespaces) ? [namespaces] : namespaces
        };
      }
      const parts = key.split(nsSeparator);
      if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1) namespaces = parts.shift();
      key = parts.join(keySeparator);
    }
    return {
      key,
      namespaces: isString(namespaces) ? [namespaces] : namespaces
    };
  }
  translate(keys, o, lastKey) {
    let opt = typeof o === "object" ? {
      ...o
    } : o;
    if (typeof opt !== "object" && this.options.overloadTranslationOptionHandler) {
      opt = this.options.overloadTranslationOptionHandler(arguments);
    }
    if (typeof opt === "object") opt = {
      ...opt
    };
    if (!opt) opt = {};
    if (keys == null) return "";
    if (typeof keys === "function") keys = keysFromSelector(keys, {
      ...this.options,
      ...opt
    });
    if (!Array.isArray(keys)) keys = [String(keys)];
    keys = keys.map((k) => typeof k === "function" ? keysFromSelector(k, {
      ...this.options,
      ...opt
    }) : String(k));
    const returnDetails = opt.returnDetails !== void 0 ? opt.returnDetails : this.options.returnDetails;
    const keySeparator = opt.keySeparator !== void 0 ? opt.keySeparator : this.options.keySeparator;
    const {
      key,
      namespaces
    } = this.extractFromKey(keys[keys.length - 1], opt);
    const namespace = namespaces[namespaces.length - 1];
    let nsSeparator = opt.nsSeparator !== void 0 ? opt.nsSeparator : this.options.nsSeparator;
    if (nsSeparator === void 0) nsSeparator = ":";
    const lng = opt.lng || this.language;
    const appendNamespaceToCIMode = opt.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
    if (lng?.toLowerCase() === "cimode") {
      if (appendNamespaceToCIMode) {
        if (returnDetails) {
          return {
            res: `${namespace}${nsSeparator}${key}`,
            usedKey: key,
            exactUsedKey: key,
            usedLng: lng,
            usedNS: namespace,
            usedParams: this.getUsedParamsDetails(opt)
          };
        }
        return `${namespace}${nsSeparator}${key}`;
      }
      if (returnDetails) {
        return {
          res: key,
          usedKey: key,
          exactUsedKey: key,
          usedLng: lng,
          usedNS: namespace,
          usedParams: this.getUsedParamsDetails(opt)
        };
      }
      return key;
    }
    const resolved = this.resolve(keys, opt);
    let res = resolved?.res;
    const resUsedKey = resolved?.usedKey || key;
    const resExactUsedKey = resolved?.exactUsedKey || key;
    const noObject = ["[object Number]", "[object Function]", "[object RegExp]"];
    const joinArrays = opt.joinArrays !== void 0 ? opt.joinArrays : this.options.joinArrays;
    const handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
    const needsPluralHandling = opt.count !== void 0 && !isString(opt.count);
    const hasDefaultValue = _Translator.hasDefaultValue(opt);
    const defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, opt.count, opt) : "";
    const defaultValueSuffixOrdinalFallback = opt.ordinal && needsPluralHandling ? this.pluralResolver.getSuffix(lng, opt.count, {
      ordinal: false
    }) : "";
    const needsZeroSuffixLookup = needsPluralHandling && !opt.ordinal && opt.count === 0;
    const defaultValue = needsZeroSuffixLookup && opt[`defaultValue${this.options.pluralSeparator}zero`] || opt[`defaultValue${defaultValueSuffix}`] || opt[`defaultValue${defaultValueSuffixOrdinalFallback}`] || opt.defaultValue;
    let resForObjHndl = res;
    if (handleAsObjectInI18nFormat && !res && hasDefaultValue) {
      resForObjHndl = defaultValue;
    }
    const handleAsObject = shouldHandleAsObject(resForObjHndl);
    const resType = Object.prototype.toString.apply(resForObjHndl);
    if (handleAsObjectInI18nFormat && resForObjHndl && handleAsObject && noObject.indexOf(resType) < 0 && !(isString(joinArrays) && Array.isArray(resForObjHndl))) {
      if (!opt.returnObjects && !this.options.returnObjects) {
        if (!this.options.returnedObjectHandler) {
          this.logger.warn("accessing an object - but returnObjects options is not enabled!");
        }
        const r = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, resForObjHndl, {
          ...opt,
          ns: namespaces
        }) : `key '${key} (${this.language})' returned an object instead of string.`;
        if (returnDetails) {
          resolved.res = r;
          resolved.usedParams = this.getUsedParamsDetails(opt);
          return resolved;
        }
        return r;
      }
      if (keySeparator) {
        const resTypeIsArray = Array.isArray(resForObjHndl);
        const copy2 = resTypeIsArray ? [] : {};
        const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;
        for (const m in resForObjHndl) {
          if (Object.prototype.hasOwnProperty.call(resForObjHndl, m)) {
            const deepKey = `${newKeyToUse}${keySeparator}${m}`;
            if (hasDefaultValue && !res) {
              copy2[m] = this.translate(deepKey, {
                ...opt,
                defaultValue: shouldHandleAsObject(defaultValue) ? defaultValue[m] : void 0,
                ...{
                  joinArrays: false,
                  ns: namespaces
                }
              });
            } else {
              copy2[m] = this.translate(deepKey, {
                ...opt,
                ...{
                  joinArrays: false,
                  ns: namespaces
                }
              });
            }
            if (copy2[m] === deepKey) copy2[m] = resForObjHndl[m];
          }
        }
        res = copy2;
      }
    } else if (handleAsObjectInI18nFormat && isString(joinArrays) && Array.isArray(res)) {
      res = res.join(joinArrays);
      if (res) res = this.extendTranslation(res, keys, opt, lastKey);
    } else {
      let usedDefault = false;
      let usedKey = false;
      if (!this.isValidLookup(res) && hasDefaultValue) {
        usedDefault = true;
        res = defaultValue;
      }
      if (!this.isValidLookup(res)) {
        usedKey = true;
        res = key;
      }
      const missingKeyNoValueFallbackToKey = opt.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey;
      const resForMissing = missingKeyNoValueFallbackToKey && usedKey ? void 0 : res;
      const updateMissing = hasDefaultValue && defaultValue !== res && this.options.updateMissing;
      if (usedKey || usedDefault || updateMissing) {
        this.logger.log(updateMissing ? "updateKey" : "missingKey", lng, namespace, key, updateMissing ? defaultValue : res);
        if (keySeparator) {
          const fk = this.resolve(key, {
            ...opt,
            keySeparator: false
          });
          if (fk && fk.res) this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.");
        }
        let lngs = [];
        const fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, opt.lng || this.language);
        if (this.options.saveMissingTo === "fallback" && fallbackLngs && fallbackLngs[0]) {
          for (let i = 0; i < fallbackLngs.length; i++) {
            lngs.push(fallbackLngs[i]);
          }
        } else if (this.options.saveMissingTo === "all") {
          lngs = this.languageUtils.toResolveHierarchy(opt.lng || this.language);
        } else {
          lngs.push(opt.lng || this.language);
        }
        const send = (l, k, specificDefaultValue) => {
          const defaultForMissing = hasDefaultValue && specificDefaultValue !== res ? specificDefaultValue : resForMissing;
          if (this.options.missingKeyHandler) {
            this.options.missingKeyHandler(l, namespace, k, defaultForMissing, updateMissing, opt);
          } else if (this.backendConnector?.saveMissing) {
            this.backendConnector.saveMissing(l, namespace, k, defaultForMissing, updateMissing, opt);
          }
          this.emit("missingKey", l, namespace, k, res);
        };
        if (this.options.saveMissing) {
          if (this.options.saveMissingPlurals && needsPluralHandling) {
            lngs.forEach((language) => {
              const suffixes = this.pluralResolver.getSuffixes(language, opt);
              if (needsZeroSuffixLookup && opt[`defaultValue${this.options.pluralSeparator}zero`] && suffixes.indexOf(`${this.options.pluralSeparator}zero`) < 0) {
                suffixes.push(`${this.options.pluralSeparator}zero`);
              }
              suffixes.forEach((suffix) => {
                send([language], key + suffix, opt[`defaultValue${suffix}`] || defaultValue);
              });
            });
          } else {
            send(lngs, key, defaultValue);
          }
        }
      }
      res = this.extendTranslation(res, keys, opt, resolved, lastKey);
      if (usedKey && res === key && this.options.appendNamespaceToMissingKey) {
        res = `${namespace}${nsSeparator}${key}`;
      }
      if ((usedKey || usedDefault) && this.options.parseMissingKeyHandler) {
        res = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${namespace}${nsSeparator}${key}` : key, usedDefault ? res : void 0, opt);
      }
    }
    if (returnDetails) {
      resolved.res = res;
      resolved.usedParams = this.getUsedParamsDetails(opt);
      return resolved;
    }
    return res;
  }
  extendTranslation(res, key, opt, resolved, lastKey) {
    if (this.i18nFormat?.parse) {
      res = this.i18nFormat.parse(res, {
        ...this.options.interpolation.defaultVariables,
        ...opt
      }, opt.lng || this.language || resolved.usedLng, resolved.usedNS, resolved.usedKey, {
        resolved
      });
    } else if (!opt.skipInterpolation) {
      if (opt.interpolation) this.interpolator.init({
        ...opt,
        ...{
          interpolation: {
            ...this.options.interpolation,
            ...opt.interpolation
          }
        }
      });
      const skipOnVariables = isString(res) && (opt?.interpolation?.skipOnVariables !== void 0 ? opt.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
      let nestBef;
      if (skipOnVariables) {
        const nb = res.match(this.interpolator.nestingRegexp);
        nestBef = nb && nb.length;
      }
      let data = opt.replace && !isString(opt.replace) ? opt.replace : opt;
      if (this.options.interpolation.defaultVariables) data = {
        ...this.options.interpolation.defaultVariables,
        ...data
      };
      res = this.interpolator.interpolate(res, data, opt.lng || this.language || resolved.usedLng, opt);
      if (skipOnVariables) {
        const na = res.match(this.interpolator.nestingRegexp);
        const nestAft = na && na.length;
        if (nestBef < nestAft) opt.nest = false;
      }
      if (!opt.lng && resolved && resolved.res) opt.lng = this.language || resolved.usedLng;
      if (opt.nest !== false) res = this.interpolator.nest(res, (...args) => {
        if (lastKey?.[0] === args[0] && !opt.context) {
          this.logger.warn(`It seems you are nesting recursively key: ${args[0]} in key: ${key[0]}`);
          return null;
        }
        return this.translate(...args, key);
      }, opt);
      if (opt.interpolation) this.interpolator.reset();
    }
    const postProcess = opt.postProcess || this.options.postProcess;
    const postProcessorNames = isString(postProcess) ? [postProcess] : postProcess;
    if (res != null && postProcessorNames?.length && opt.applyPostProcessor !== false) {
      res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? {
        i18nResolved: {
          ...resolved,
          usedParams: this.getUsedParamsDetails(opt)
        },
        ...opt
      } : opt, this);
    }
    return res;
  }
  resolve(keys, opt = {}) {
    let found;
    let usedKey;
    let exactUsedKey;
    let usedLng;
    let usedNS;
    if (isString(keys)) keys = [keys];
    if (Array.isArray(keys)) keys = keys.map((k) => typeof k === "function" ? keysFromSelector(k, {
      ...this.options,
      ...opt
    }) : k);
    keys.forEach((k) => {
      if (this.isValidLookup(found)) return;
      const extracted = this.extractFromKey(k, opt);
      const key = extracted.key;
      usedKey = key;
      let namespaces = extracted.namespaces;
      if (this.options.fallbackNS) namespaces = namespaces.concat(this.options.fallbackNS);
      const needsPluralHandling = opt.count !== void 0 && !isString(opt.count);
      const needsZeroSuffixLookup = needsPluralHandling && !opt.ordinal && opt.count === 0;
      const needsContextHandling = opt.context !== void 0 && (isString(opt.context) || typeof opt.context === "number") && opt.context !== "";
      const codes = opt.lngs ? opt.lngs : this.languageUtils.toResolveHierarchy(opt.lng || this.language, opt.fallbackLng);
      namespaces.forEach((ns) => {
        if (this.isValidLookup(found)) return;
        usedNS = ns;
        if (!checkedLoadedFor[`${codes[0]}-${ns}`] && this.utils?.hasLoadedNamespace && !this.utils?.hasLoadedNamespace(usedNS)) {
          checkedLoadedFor[`${codes[0]}-${ns}`] = true;
          this.logger.warn(`key "${usedKey}" for languages "${codes.join(", ")}" won't get resolved as namespace "${usedNS}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
        }
        codes.forEach((code) => {
          if (this.isValidLookup(found)) return;
          usedLng = code;
          const finalKeys = [key];
          if (this.i18nFormat?.addLookupKeys) {
            this.i18nFormat.addLookupKeys(finalKeys, key, code, ns, opt);
          } else {
            let pluralSuffix;
            if (needsPluralHandling) pluralSuffix = this.pluralResolver.getSuffix(code, opt.count, opt);
            const zeroSuffix = `${this.options.pluralSeparator}zero`;
            const ordinalPrefix = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
            if (needsPluralHandling) {
              if (opt.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                finalKeys.push(key + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
              }
              finalKeys.push(key + pluralSuffix);
              if (needsZeroSuffixLookup) {
                finalKeys.push(key + zeroSuffix);
              }
            }
            if (needsContextHandling) {
              const contextKey = `${key}${this.options.contextSeparator || "_"}${opt.context}`;
              finalKeys.push(contextKey);
              if (needsPluralHandling) {
                if (opt.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                  finalKeys.push(contextKey + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
                }
                finalKeys.push(contextKey + pluralSuffix);
                if (needsZeroSuffixLookup) {
                  finalKeys.push(contextKey + zeroSuffix);
                }
              }
            }
          }
          let possibleKey;
          while (possibleKey = finalKeys.pop()) {
            if (!this.isValidLookup(found)) {
              exactUsedKey = possibleKey;
              found = this.getResource(code, ns, possibleKey, opt);
            }
          }
        });
      });
    });
    return {
      res: found,
      usedKey,
      exactUsedKey,
      usedLng,
      usedNS
    };
  }
  isValidLookup(res) {
    return res !== void 0 && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === "");
  }
  getResource(code, ns, key, options = {}) {
    if (this.i18nFormat?.getResource) return this.i18nFormat.getResource(code, ns, key, options);
    return this.resourceStore.getResource(code, ns, key, options);
  }
  getUsedParamsDetails(options = {}) {
    const optionsKeys = ["defaultValue", "ordinal", "context", "replace", "lng", "lngs", "fallbackLng", "ns", "keySeparator", "nsSeparator", "returnObjects", "returnDetails", "joinArrays", "postProcess", "interpolation"];
    const useOptionsReplaceForData = options.replace && !isString(options.replace);
    let data = useOptionsReplaceForData ? options.replace : options;
    if (useOptionsReplaceForData && typeof options.count !== "undefined") {
      data.count = options.count;
    }
    if (this.options.interpolation.defaultVariables) {
      data = {
        ...this.options.interpolation.defaultVariables,
        ...data
      };
    }
    if (!useOptionsReplaceForData) {
      data = {
        ...data
      };
      for (const key of optionsKeys) {
        delete data[key];
      }
    }
    return data;
  }
  static hasDefaultValue(options) {
    const prefix = "defaultValue";
    for (const option in options) {
      if (Object.prototype.hasOwnProperty.call(options, option) && prefix === option.substring(0, prefix.length) && void 0 !== options[option]) {
        return true;
      }
    }
    return false;
  }
};
var LanguageUtil = class {
  constructor(options) {
    this.options = options;
    this.supportedLngs = this.options.supportedLngs || false;
    this.logger = baseLogger.create("languageUtils");
  }
  getScriptPartFromCode(code) {
    code = getCleanedCode(code);
    if (!code || code.indexOf("-") < 0) return null;
    const p = code.split("-");
    if (p.length === 2) return null;
    p.pop();
    if (p[p.length - 1].toLowerCase() === "x") return null;
    return this.formatLanguageCode(p.join("-"));
  }
  getLanguagePartFromCode(code) {
    code = getCleanedCode(code);
    if (!code || code.indexOf("-") < 0) return code;
    const p = code.split("-");
    return this.formatLanguageCode(p[0]);
  }
  formatLanguageCode(code) {
    if (isString(code) && code.indexOf("-") > -1) {
      let formattedCode;
      try {
        formattedCode = Intl.getCanonicalLocales(code)[0];
      } catch (e2) {
      }
      if (formattedCode && this.options.lowerCaseLng) {
        formattedCode = formattedCode.toLowerCase();
      }
      if (formattedCode) return formattedCode;
      if (this.options.lowerCaseLng) {
        return code.toLowerCase();
      }
      return code;
    }
    return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
  }
  isSupportedCode(code) {
    if (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) {
      code = this.getLanguagePartFromCode(code);
    }
    return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(code) > -1;
  }
  getBestMatchFromCodes(codes) {
    if (!codes) return null;
    let found;
    codes.forEach((code) => {
      if (found) return;
      const cleanedLng = this.formatLanguageCode(code);
      if (!this.options.supportedLngs || this.isSupportedCode(cleanedLng)) found = cleanedLng;
    });
    if (!found && this.options.supportedLngs) {
      codes.forEach((code) => {
        if (found) return;
        const lngScOnly = this.getScriptPartFromCode(code);
        if (this.isSupportedCode(lngScOnly)) return found = lngScOnly;
        const lngOnly = this.getLanguagePartFromCode(code);
        if (this.isSupportedCode(lngOnly)) return found = lngOnly;
        found = this.options.supportedLngs.find((supportedLng) => {
          if (supportedLng === lngOnly) return supportedLng;
          if (supportedLng.indexOf("-") < 0 && lngOnly.indexOf("-") < 0) return;
          if (supportedLng.indexOf("-") > 0 && lngOnly.indexOf("-") < 0 && supportedLng.substring(0, supportedLng.indexOf("-")) === lngOnly) return supportedLng;
          if (supportedLng.indexOf(lngOnly) === 0 && lngOnly.length > 1) return supportedLng;
        });
      });
    }
    if (!found) found = this.getFallbackCodes(this.options.fallbackLng)[0];
    return found;
  }
  getFallbackCodes(fallbacks, code) {
    if (!fallbacks) return [];
    if (typeof fallbacks === "function") fallbacks = fallbacks(code);
    if (isString(fallbacks)) fallbacks = [fallbacks];
    if (Array.isArray(fallbacks)) return fallbacks;
    if (!code) return fallbacks.default || [];
    let found = fallbacks[code];
    if (!found) found = fallbacks[this.getScriptPartFromCode(code)];
    if (!found) found = fallbacks[this.formatLanguageCode(code)];
    if (!found) found = fallbacks[this.getLanguagePartFromCode(code)];
    if (!found) found = fallbacks.default;
    return found || [];
  }
  toResolveHierarchy(code, fallbackCode) {
    const fallbackCodes = this.getFallbackCodes((fallbackCode === false ? [] : fallbackCode) || this.options.fallbackLng || [], code);
    const codes = [];
    const addCode = (c) => {
      if (!c) return;
      if (this.isSupportedCode(c)) {
        codes.push(c);
      } else {
        this.logger.warn(`rejecting language code not found in supportedLngs: ${c}`);
      }
    };
    if (isString(code) && (code.indexOf("-") > -1 || code.indexOf("_") > -1)) {
      if (this.options.load !== "languageOnly") addCode(this.formatLanguageCode(code));
      if (this.options.load !== "languageOnly" && this.options.load !== "currentOnly") addCode(this.getScriptPartFromCode(code));
      if (this.options.load !== "currentOnly") addCode(this.getLanguagePartFromCode(code));
    } else if (isString(code)) {
      addCode(this.formatLanguageCode(code));
    }
    fallbackCodes.forEach((fc) => {
      if (codes.indexOf(fc) < 0) addCode(this.formatLanguageCode(fc));
    });
    return codes;
  }
};
var suffixesOrder = {
  zero: 0,
  one: 1,
  two: 2,
  few: 3,
  many: 4,
  other: 5
};
var dummyRule = {
  select: (count) => count === 1 ? "one" : "other",
  resolvedOptions: () => ({
    pluralCategories: ["one", "other"]
  })
};
var PluralResolver = class {
  constructor(languageUtils, options = {}) {
    this.languageUtils = languageUtils;
    this.options = options;
    this.logger = baseLogger.create("pluralResolver");
    this.pluralRulesCache = {};
  }
  clearCache() {
    this.pluralRulesCache = {};
  }
  getRule(code, options = {}) {
    const cleanedCode = getCleanedCode(code === "dev" ? "en" : code);
    const type = options.ordinal ? "ordinal" : "cardinal";
    const cacheKey = JSON.stringify({
      cleanedCode,
      type
    });
    if (cacheKey in this.pluralRulesCache) {
      return this.pluralRulesCache[cacheKey];
    }
    let rule;
    try {
      rule = new Intl.PluralRules(cleanedCode, {
        type
      });
    } catch (err) {
      if (typeof Intl === "undefined") {
        this.logger.error("No Intl support, please use an Intl polyfill!");
        return dummyRule;
      }
      if (!code.match(/-|_/)) return dummyRule;
      const lngPart = this.languageUtils.getLanguagePartFromCode(code);
      rule = this.getRule(lngPart, options);
    }
    this.pluralRulesCache[cacheKey] = rule;
    return rule;
  }
  needsPlural(code, options = {}) {
    let rule = this.getRule(code, options);
    if (!rule) rule = this.getRule("dev", options);
    return rule?.resolvedOptions().pluralCategories.length > 1;
  }
  getPluralFormsOfKey(code, key, options = {}) {
    return this.getSuffixes(code, options).map((suffix) => `${key}${suffix}`);
  }
  getSuffixes(code, options = {}) {
    let rule = this.getRule(code, options);
    if (!rule) rule = this.getRule("dev", options);
    if (!rule) return [];
    return rule.resolvedOptions().pluralCategories.sort((pluralCategory1, pluralCategory2) => suffixesOrder[pluralCategory1] - suffixesOrder[pluralCategory2]).map((pluralCategory) => `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${pluralCategory}`);
  }
  getSuffix(code, count, options = {}) {
    const rule = this.getRule(code, options);
    if (rule) {
      return `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${rule.select(count)}`;
    }
    this.logger.warn(`no plural rule found for: ${code}`);
    return this.getSuffix("dev", count, options);
  }
};
var deepFindWithDefaults = (data, defaultData, key, keySeparator = ".", ignoreJSONStructure = true) => {
  let path = getPathWithDefaults(data, defaultData, key);
  if (!path && ignoreJSONStructure && isString(key)) {
    path = deepFind(data, key, keySeparator);
    if (path === void 0) path = deepFind(defaultData, key, keySeparator);
  }
  return path;
};
var regexSafe = (val) => val.replace(/\$/g, "$$$$");
var Interpolator = class {
  constructor(options = {}) {
    this.logger = baseLogger.create("interpolator");
    this.options = options;
    this.format = options?.interpolation?.format || ((value) => value);
    this.init(options);
  }
  init(options = {}) {
    if (!options.interpolation) options.interpolation = {
      escapeValue: true
    };
    const {
      escape: escape$1,
      escapeValue,
      useRawValueToEscape,
      prefix,
      prefixEscaped,
      suffix,
      suffixEscaped,
      formatSeparator,
      unescapeSuffix,
      unescapePrefix,
      nestingPrefix,
      nestingPrefixEscaped,
      nestingSuffix,
      nestingSuffixEscaped,
      nestingOptionsSeparator,
      maxReplaces,
      alwaysFormat
    } = options.interpolation;
    this.escape = escape$1 !== void 0 ? escape$1 : escape;
    this.escapeValue = escapeValue !== void 0 ? escapeValue : true;
    this.useRawValueToEscape = useRawValueToEscape !== void 0 ? useRawValueToEscape : false;
    this.prefix = prefix ? regexEscape(prefix) : prefixEscaped || "{{";
    this.suffix = suffix ? regexEscape(suffix) : suffixEscaped || "}}";
    this.formatSeparator = formatSeparator || ",";
    this.unescapePrefix = unescapeSuffix ? "" : unescapePrefix || "-";
    this.unescapeSuffix = this.unescapePrefix ? "" : unescapeSuffix || "";
    this.nestingPrefix = nestingPrefix ? regexEscape(nestingPrefix) : nestingPrefixEscaped || regexEscape("$t(");
    this.nestingSuffix = nestingSuffix ? regexEscape(nestingSuffix) : nestingSuffixEscaped || regexEscape(")");
    this.nestingOptionsSeparator = nestingOptionsSeparator || ",";
    this.maxReplaces = maxReplaces || 1e3;
    this.alwaysFormat = alwaysFormat !== void 0 ? alwaysFormat : false;
    this.resetRegExp();
  }
  reset() {
    if (this.options) this.init(this.options);
  }
  resetRegExp() {
    const getOrResetRegExp = (existingRegExp, pattern) => {
      if (existingRegExp?.source === pattern) {
        existingRegExp.lastIndex = 0;
        return existingRegExp;
      }
      return new RegExp(pattern, "g");
    };
    this.regexp = getOrResetRegExp(this.regexp, `${this.prefix}(.+?)${this.suffix}`);
    this.regexpUnescape = getOrResetRegExp(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`);
    this.nestingRegexp = getOrResetRegExp(this.nestingRegexp, `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`);
  }
  interpolate(str, data, lng, options) {
    let match;
    let value;
    let replaces;
    const defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};
    const handleFormat = (key) => {
      if (key.indexOf(this.formatSeparator) < 0) {
        const path = deepFindWithDefaults(data, defaultData, key, this.options.keySeparator, this.options.ignoreJSONStructure);
        return this.alwaysFormat ? this.format(path, void 0, lng, {
          ...options,
          ...data,
          interpolationkey: key
        }) : path;
      }
      const p = key.split(this.formatSeparator);
      const k = p.shift().trim();
      const f = p.join(this.formatSeparator).trim();
      return this.format(deepFindWithDefaults(data, defaultData, k, this.options.keySeparator, this.options.ignoreJSONStructure), f, lng, {
        ...options,
        ...data,
        interpolationkey: k
      });
    };
    this.resetRegExp();
    const missingInterpolationHandler = options?.missingInterpolationHandler || this.options.missingInterpolationHandler;
    const skipOnVariables = options?.interpolation?.skipOnVariables !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
    const todos = [{
      regex: this.regexpUnescape,
      safeValue: (val) => regexSafe(val)
    }, {
      regex: this.regexp,
      safeValue: (val) => this.escapeValue ? regexSafe(this.escape(val)) : regexSafe(val)
    }];
    todos.forEach((todo) => {
      replaces = 0;
      while (match = todo.regex.exec(str)) {
        const matchedVar = match[1].trim();
        value = handleFormat(matchedVar);
        if (value === void 0) {
          if (typeof missingInterpolationHandler === "function") {
            const temp = missingInterpolationHandler(str, match, options);
            value = isString(temp) ? temp : "";
          } else if (options && Object.prototype.hasOwnProperty.call(options, matchedVar)) {
            value = "";
          } else if (skipOnVariables) {
            value = match[0];
            continue;
          } else {
            this.logger.warn(`missed to pass in variable ${matchedVar} for interpolating ${str}`);
            value = "";
          }
        } else if (!isString(value) && !this.useRawValueToEscape) {
          value = makeString(value);
        }
        const safeValue = todo.safeValue(value);
        str = str.replace(match[0], safeValue);
        if (skipOnVariables) {
          todo.regex.lastIndex += value.length;
          todo.regex.lastIndex -= match[0].length;
        } else {
          todo.regex.lastIndex = 0;
        }
        replaces++;
        if (replaces >= this.maxReplaces) {
          break;
        }
      }
    });
    return str;
  }
  nest(str, fc, options = {}) {
    let match;
    let value;
    let clonedOptions;
    const handleHasOptions = (key, inheritedOptions) => {
      const sep = this.nestingOptionsSeparator;
      if (key.indexOf(sep) < 0) return key;
      const c = key.split(new RegExp(`${regexEscape(sep)}[ ]*{`));
      let optionsString = `{${c[1]}`;
      key = c[0];
      optionsString = this.interpolate(optionsString, clonedOptions);
      const matchedSingleQuotes = optionsString.match(/'/g);
      const matchedDoubleQuotes = optionsString.match(/"/g);
      if ((matchedSingleQuotes?.length ?? 0) % 2 === 0 && !matchedDoubleQuotes || (matchedDoubleQuotes?.length ?? 0) % 2 !== 0) {
        optionsString = optionsString.replace(/'/g, '"');
      }
      try {
        clonedOptions = JSON.parse(optionsString);
        if (inheritedOptions) clonedOptions = {
          ...inheritedOptions,
          ...clonedOptions
        };
      } catch (e2) {
        this.logger.warn(`failed parsing options string in nesting for key ${key}`, e2);
        return `${key}${sep}${optionsString}`;
      }
      if (clonedOptions.defaultValue && clonedOptions.defaultValue.indexOf(this.prefix) > -1) delete clonedOptions.defaultValue;
      return key;
    };
    while (match = this.nestingRegexp.exec(str)) {
      let formatters = [];
      clonedOptions = {
        ...options
      };
      clonedOptions = clonedOptions.replace && !isString(clonedOptions.replace) ? clonedOptions.replace : clonedOptions;
      clonedOptions.applyPostProcessor = false;
      delete clonedOptions.defaultValue;
      const keyEndIndex = /{.*}/.test(match[1]) ? match[1].lastIndexOf("}") + 1 : match[1].indexOf(this.formatSeparator);
      if (keyEndIndex !== -1) {
        formatters = match[1].slice(keyEndIndex).split(this.formatSeparator).map((elem) => elem.trim()).filter(Boolean);
        match[1] = match[1].slice(0, keyEndIndex);
      }
      value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
      if (value && match[0] === str && !isString(value)) return value;
      if (!isString(value)) value = makeString(value);
      if (!value) {
        this.logger.warn(`missed to resolve ${match[1]} for nesting ${str}`);
        value = "";
      }
      if (formatters.length) {
        value = formatters.reduce((v, f) => this.format(v, f, options.lng, {
          ...options,
          interpolationkey: match[1].trim()
        }), value.trim());
      }
      str = str.replace(match[0], value);
      this.regexp.lastIndex = 0;
    }
    return str;
  }
};
var parseFormatStr = (formatStr) => {
  let formatName = formatStr.toLowerCase().trim();
  const formatOptions = {};
  if (formatStr.indexOf("(") > -1) {
    const p = formatStr.split("(");
    formatName = p[0].toLowerCase().trim();
    const optStr = p[1].substring(0, p[1].length - 1);
    if (formatName === "currency" && optStr.indexOf(":") < 0) {
      if (!formatOptions.currency) formatOptions.currency = optStr.trim();
    } else if (formatName === "relativetime" && optStr.indexOf(":") < 0) {
      if (!formatOptions.range) formatOptions.range = optStr.trim();
    } else {
      const opts = optStr.split(";");
      opts.forEach((opt) => {
        if (opt) {
          const [key, ...rest] = opt.split(":");
          const val = rest.join(":").trim().replace(/^'+|'+$/g, "");
          const trimmedKey = key.trim();
          if (!formatOptions[trimmedKey]) formatOptions[trimmedKey] = val;
          if (val === "false") formatOptions[trimmedKey] = false;
          if (val === "true") formatOptions[trimmedKey] = true;
          if (!isNaN(val)) formatOptions[trimmedKey] = parseInt(val, 10);
        }
      });
    }
  }
  return {
    formatName,
    formatOptions
  };
};
var createCachedFormatter = (fn) => {
  const cache = {};
  return (v, l, o) => {
    let optForCache = o;
    if (o && o.interpolationkey && o.formatParams && o.formatParams[o.interpolationkey] && o[o.interpolationkey]) {
      optForCache = {
        ...optForCache,
        [o.interpolationkey]: void 0
      };
    }
    const key = l + JSON.stringify(optForCache);
    let frm = cache[key];
    if (!frm) {
      frm = fn(getCleanedCode(l), o);
      cache[key] = frm;
    }
    return frm(v);
  };
};
var createNonCachedFormatter = (fn) => (v, l, o) => fn(getCleanedCode(l), o)(v);
var Formatter = class {
  constructor(options = {}) {
    this.logger = baseLogger.create("formatter");
    this.options = options;
    this.init(options);
  }
  init(services, options = {
    interpolation: {}
  }) {
    this.formatSeparator = options.interpolation.formatSeparator || ",";
    const cf = options.cacheInBuiltFormats ? createCachedFormatter : createNonCachedFormatter;
    this.formats = {
      number: cf((lng, opt) => {
        const formatter = new Intl.NumberFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val);
      }),
      currency: cf((lng, opt) => {
        const formatter = new Intl.NumberFormat(lng, {
          ...opt,
          style: "currency"
        });
        return (val) => formatter.format(val);
      }),
      datetime: cf((lng, opt) => {
        const formatter = new Intl.DateTimeFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val);
      }),
      relativetime: cf((lng, opt) => {
        const formatter = new Intl.RelativeTimeFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val, opt.range || "day");
      }),
      list: cf((lng, opt) => {
        const formatter = new Intl.ListFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val);
      })
    };
  }
  add(name, fc) {
    this.formats[name.toLowerCase().trim()] = fc;
  }
  addCached(name, fc) {
    this.formats[name.toLowerCase().trim()] = createCachedFormatter(fc);
  }
  format(value, format, lng, options = {}) {
    const formats = format.split(this.formatSeparator);
    if (formats.length > 1 && formats[0].indexOf("(") > 1 && formats[0].indexOf(")") < 0 && formats.find((f) => f.indexOf(")") > -1)) {
      const lastIndex = formats.findIndex((f) => f.indexOf(")") > -1);
      formats[0] = [formats[0], ...formats.splice(1, lastIndex)].join(this.formatSeparator);
    }
    const result = formats.reduce((mem, f) => {
      const {
        formatName,
        formatOptions
      } = parseFormatStr(f);
      if (this.formats[formatName]) {
        let formatted = mem;
        try {
          const valOptions = options?.formatParams?.[options.interpolationkey] || {};
          const l = valOptions.locale || valOptions.lng || options.locale || options.lng || lng;
          formatted = this.formats[formatName](mem, l, {
            ...formatOptions,
            ...options,
            ...valOptions
          });
        } catch (error) {
          this.logger.warn(error);
        }
        return formatted;
      } else {
        this.logger.warn(`there was no format function for ${formatName}`);
      }
      return mem;
    }, value);
    return result;
  }
};
var removePending = (q, name) => {
  if (q.pending[name] !== void 0) {
    delete q.pending[name];
    q.pendingCount--;
  }
};
var Connector = class extends EventEmitter {
  constructor(backend, store, services, options = {}) {
    super();
    this.backend = backend;
    this.store = store;
    this.services = services;
    this.languageUtils = services.languageUtils;
    this.options = options;
    this.logger = baseLogger.create("backendConnector");
    this.waitingReads = [];
    this.maxParallelReads = options.maxParallelReads || 10;
    this.readingCalls = 0;
    this.maxRetries = options.maxRetries >= 0 ? options.maxRetries : 5;
    this.retryTimeout = options.retryTimeout >= 1 ? options.retryTimeout : 350;
    this.state = {};
    this.queue = [];
    this.backend?.init?.(services, options.backend, options);
  }
  queueLoad(languages, namespaces, options, callback) {
    const toLoad = {};
    const pending = {};
    const toLoadLanguages = {};
    const toLoadNamespaces = {};
    languages.forEach((lng) => {
      let hasAllNamespaces = true;
      namespaces.forEach((ns) => {
        const name = `${lng}|${ns}`;
        if (!options.reload && this.store.hasResourceBundle(lng, ns)) {
          this.state[name] = 2;
        } else if (this.state[name] < 0) ;
        else if (this.state[name] === 1) {
          if (pending[name] === void 0) pending[name] = true;
        } else {
          this.state[name] = 1;
          hasAllNamespaces = false;
          if (pending[name] === void 0) pending[name] = true;
          if (toLoad[name] === void 0) toLoad[name] = true;
          if (toLoadNamespaces[ns] === void 0) toLoadNamespaces[ns] = true;
        }
      });
      if (!hasAllNamespaces) toLoadLanguages[lng] = true;
    });
    if (Object.keys(toLoad).length || Object.keys(pending).length) {
      this.queue.push({
        pending,
        pendingCount: Object.keys(pending).length,
        loaded: {},
        errors: [],
        callback
      });
    }
    return {
      toLoad: Object.keys(toLoad),
      pending: Object.keys(pending),
      toLoadLanguages: Object.keys(toLoadLanguages),
      toLoadNamespaces: Object.keys(toLoadNamespaces)
    };
  }
  loaded(name, err, data) {
    const s = name.split("|");
    const lng = s[0];
    const ns = s[1];
    if (err) this.emit("failedLoading", lng, ns, err);
    if (!err && data) {
      this.store.addResourceBundle(lng, ns, data, void 0, void 0, {
        skipCopy: true
      });
    }
    this.state[name] = err ? -1 : 2;
    if (err && data) this.state[name] = 0;
    const loaded = {};
    this.queue.forEach((q) => {
      pushPath(q.loaded, [lng], ns);
      removePending(q, name);
      if (err) q.errors.push(err);
      if (q.pendingCount === 0 && !q.done) {
        Object.keys(q.loaded).forEach((l) => {
          if (!loaded[l]) loaded[l] = {};
          const loadedKeys = q.loaded[l];
          if (loadedKeys.length) {
            loadedKeys.forEach((n) => {
              if (loaded[l][n] === void 0) loaded[l][n] = true;
            });
          }
        });
        q.done = true;
        if (q.errors.length) {
          q.callback(q.errors);
        } else {
          q.callback();
        }
      }
    });
    this.emit("loaded", loaded);
    this.queue = this.queue.filter((q) => !q.done);
  }
  read(lng, ns, fcName, tried = 0, wait = this.retryTimeout, callback) {
    if (!lng.length) return callback(null, {});
    if (this.readingCalls >= this.maxParallelReads) {
      this.waitingReads.push({
        lng,
        ns,
        fcName,
        tried,
        wait,
        callback
      });
      return;
    }
    this.readingCalls++;
    const resolver = (err, data) => {
      this.readingCalls--;
      if (this.waitingReads.length > 0) {
        const next = this.waitingReads.shift();
        this.read(next.lng, next.ns, next.fcName, next.tried, next.wait, next.callback);
      }
      if (err && data && tried < this.maxRetries) {
        setTimeout(() => {
          this.read.call(this, lng, ns, fcName, tried + 1, wait * 2, callback);
        }, wait);
        return;
      }
      callback(err, data);
    };
    const fc = this.backend[fcName].bind(this.backend);
    if (fc.length === 2) {
      try {
        const r = fc(lng, ns);
        if (r && typeof r.then === "function") {
          r.then((data) => resolver(null, data)).catch(resolver);
        } else {
          resolver(null, r);
        }
      } catch (err) {
        resolver(err);
      }
      return;
    }
    return fc(lng, ns, resolver);
  }
  prepareLoading(languages, namespaces, options = {}, callback) {
    if (!this.backend) {
      this.logger.warn("No backend was added via i18next.use. Will not load resources.");
      return callback && callback();
    }
    if (isString(languages)) languages = this.languageUtils.toResolveHierarchy(languages);
    if (isString(namespaces)) namespaces = [namespaces];
    const toLoad = this.queueLoad(languages, namespaces, options, callback);
    if (!toLoad.toLoad.length) {
      if (!toLoad.pending.length) callback();
      return null;
    }
    toLoad.toLoad.forEach((name) => {
      this.loadOne(name);
    });
  }
  load(languages, namespaces, callback) {
    this.prepareLoading(languages, namespaces, {}, callback);
  }
  reload(languages, namespaces, callback) {
    this.prepareLoading(languages, namespaces, {
      reload: true
    }, callback);
  }
  loadOne(name, prefix = "") {
    const s = name.split("|");
    const lng = s[0];
    const ns = s[1];
    this.read(lng, ns, "read", void 0, void 0, (err, data) => {
      if (err) this.logger.warn(`${prefix}loading namespace ${ns} for language ${lng} failed`, err);
      if (!err && data) this.logger.log(`${prefix}loaded namespace ${ns} for language ${lng}`, data);
      this.loaded(name, err, data);
    });
  }
  saveMissing(languages, namespace, key, fallbackValue, isUpdate, options = {}, clb = () => {
  }) {
    if (this.services?.utils?.hasLoadedNamespace && !this.services?.utils?.hasLoadedNamespace(namespace)) {
      this.logger.warn(`did not save key "${key}" as the namespace "${namespace}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
      return;
    }
    if (key === void 0 || key === null || key === "") return;
    if (this.backend?.create) {
      const opts = {
        ...options,
        isUpdate
      };
      const fc = this.backend.create.bind(this.backend);
      if (fc.length < 6) {
        try {
          let r;
          if (fc.length === 5) {
            r = fc(languages, namespace, key, fallbackValue, opts);
          } else {
            r = fc(languages, namespace, key, fallbackValue);
          }
          if (r && typeof r.then === "function") {
            r.then((data) => clb(null, data)).catch(clb);
          } else {
            clb(null, r);
          }
        } catch (err) {
          clb(err);
        }
      } else {
        fc(languages, namespace, key, fallbackValue, clb, opts);
      }
    }
    if (!languages || !languages[0]) return;
    this.store.addResource(languages[0], namespace, key, fallbackValue);
  }
};
var get = () => ({
  debug: false,
  initAsync: true,
  ns: ["translation"],
  defaultNS: ["translation"],
  fallbackLng: ["dev"],
  fallbackNS: false,
  supportedLngs: false,
  nonExplicitSupportedLngs: false,
  load: "all",
  preload: false,
  simplifyPluralSuffix: true,
  keySeparator: ".",
  nsSeparator: ":",
  pluralSeparator: "_",
  contextSeparator: "_",
  partialBundledLanguages: false,
  saveMissing: false,
  updateMissing: false,
  saveMissingTo: "fallback",
  saveMissingPlurals: true,
  missingKeyHandler: false,
  missingInterpolationHandler: false,
  postProcess: false,
  postProcessPassResolved: false,
  returnNull: false,
  returnEmptyString: true,
  returnObjects: false,
  joinArrays: false,
  returnedObjectHandler: false,
  parseMissingKeyHandler: false,
  appendNamespaceToMissingKey: false,
  appendNamespaceToCIMode: false,
  overloadTranslationOptionHandler: (args) => {
    let ret = {};
    if (typeof args[1] === "object") ret = args[1];
    if (isString(args[1])) ret.defaultValue = args[1];
    if (isString(args[2])) ret.tDescription = args[2];
    if (typeof args[2] === "object" || typeof args[3] === "object") {
      const options = args[3] || args[2];
      Object.keys(options).forEach((key) => {
        ret[key] = options[key];
      });
    }
    return ret;
  },
  interpolation: {
    escapeValue: true,
    format: (value) => value,
    prefix: "{{",
    suffix: "}}",
    formatSeparator: ",",
    unescapePrefix: "-",
    nestingPrefix: "$t(",
    nestingSuffix: ")",
    nestingOptionsSeparator: ",",
    maxReplaces: 1e3,
    skipOnVariables: true
  },
  cacheInBuiltFormats: true
});
var transformOptions = (options) => {
  if (isString(options.ns)) options.ns = [options.ns];
  if (isString(options.fallbackLng)) options.fallbackLng = [options.fallbackLng];
  if (isString(options.fallbackNS)) options.fallbackNS = [options.fallbackNS];
  if (options.supportedLngs?.indexOf?.("cimode") < 0) {
    options.supportedLngs = options.supportedLngs.concat(["cimode"]);
  }
  if (typeof options.initImmediate === "boolean") options.initAsync = options.initImmediate;
  return options;
};
var noop = () => {
};
var bindMemberFunctions = (inst) => {
  const mems = Object.getOwnPropertyNames(Object.getPrototypeOf(inst));
  mems.forEach((mem) => {
    if (typeof inst[mem] === "function") {
      inst[mem] = inst[mem].bind(inst);
    }
  });
};
var SUPPORT_NOTICE_KEY = "__i18next_supportNoticeShown";
var getSupportNoticeShown = () => typeof globalThis !== "undefined" && !!globalThis[SUPPORT_NOTICE_KEY];
var setSupportNoticeShown = () => {
  if (typeof globalThis !== "undefined") globalThis[SUPPORT_NOTICE_KEY] = true;
};
var usesLocize = (inst) => {
  if (inst?.modules?.backend?.name?.indexOf("Locize") > 0) return true;
  if (inst?.modules?.backend?.constructor?.name?.indexOf("Locize") > 0) return true;
  if (inst?.options?.backend?.backends) {
    if (inst.options.backend.backends.some((b) => b?.name?.indexOf("Locize") > 0 || b?.constructor?.name?.indexOf("Locize") > 0)) return true;
  }
  if (inst?.options?.backend?.projectId) return true;
  if (inst?.options?.backend?.backendOptions) {
    if (inst.options.backend.backendOptions.some((b) => b?.projectId)) return true;
  }
  return false;
};
var I18n = class _I18n extends EventEmitter {
  constructor(options = {}, callback) {
    super();
    this.options = transformOptions(options);
    this.services = {};
    this.logger = baseLogger;
    this.modules = {
      external: []
    };
    bindMemberFunctions(this);
    if (callback && !this.isInitialized && !options.isClone) {
      if (!this.options.initAsync) {
        this.init(options, callback);
        return this;
      }
      setTimeout(() => {
        this.init(options, callback);
      }, 0);
    }
  }
  init(options = {}, callback) {
    this.isInitializing = true;
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    if (options.defaultNS == null && options.ns) {
      if (isString(options.ns)) {
        options.defaultNS = options.ns;
      } else if (options.ns.indexOf("translation") < 0) {
        options.defaultNS = options.ns[0];
      }
    }
    const defOpts = get();
    this.options = {
      ...defOpts,
      ...this.options,
      ...transformOptions(options)
    };
    this.options.interpolation = {
      ...defOpts.interpolation,
      ...this.options.interpolation
    };
    if (options.keySeparator !== void 0) {
      this.options.userDefinedKeySeparator = options.keySeparator;
    }
    if (options.nsSeparator !== void 0) {
      this.options.userDefinedNsSeparator = options.nsSeparator;
    }
    if (typeof this.options.overloadTranslationOptionHandler !== "function") {
      this.options.overloadTranslationOptionHandler = defOpts.overloadTranslationOptionHandler;
    }
    if (this.options.showSupportNotice !== false && !usesLocize(this) && !getSupportNoticeShown()) {
      if (typeof console !== "undefined" && typeof console.info !== "undefined") console.info("\u{1F310} i18next is made possible by our own product, Locize \u2014 consider powering your project with managed localization (AI, CDN, integrations): https://locize.com \u{1F499}");
      setSupportNoticeShown();
    }
    const createClassOnDemand = (ClassOrObject) => {
      if (!ClassOrObject) return null;
      if (typeof ClassOrObject === "function") return new ClassOrObject();
      return ClassOrObject;
    };
    if (!this.options.isClone) {
      if (this.modules.logger) {
        baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
      } else {
        baseLogger.init(null, this.options);
      }
      let formatter;
      if (this.modules.formatter) {
        formatter = this.modules.formatter;
      } else {
        formatter = Formatter;
      }
      const lu = new LanguageUtil(this.options);
      this.store = new ResourceStore(this.options.resources, this.options);
      const s = this.services;
      s.logger = baseLogger;
      s.resourceStore = this.store;
      s.languageUtils = lu;
      s.pluralResolver = new PluralResolver(lu, {
        prepend: this.options.pluralSeparator,
        simplifyPluralSuffix: this.options.simplifyPluralSuffix
      });
      const usingLegacyFormatFunction = this.options.interpolation.format && this.options.interpolation.format !== defOpts.interpolation.format;
      if (usingLegacyFormatFunction) {
        this.logger.deprecate(`init: you are still using the legacy format function, please use the new approach: https://www.i18next.com/translation-function/formatting`);
      }
      if (formatter && (!this.options.interpolation.format || this.options.interpolation.format === defOpts.interpolation.format)) {
        s.formatter = createClassOnDemand(formatter);
        if (s.formatter.init) s.formatter.init(s, this.options);
        this.options.interpolation.format = s.formatter.format.bind(s.formatter);
      }
      s.interpolator = new Interpolator(this.options);
      s.utils = {
        hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
      };
      s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
      s.backendConnector.on("*", (event, ...args) => {
        this.emit(event, ...args);
      });
      if (this.modules.languageDetector) {
        s.languageDetector = createClassOnDemand(this.modules.languageDetector);
        if (s.languageDetector.init) s.languageDetector.init(s, this.options.detection, this.options);
      }
      if (this.modules.i18nFormat) {
        s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
        if (s.i18nFormat.init) s.i18nFormat.init(this);
      }
      this.translator = new Translator(this.services, this.options);
      this.translator.on("*", (event, ...args) => {
        this.emit(event, ...args);
      });
      this.modules.external.forEach((m) => {
        if (m.init) m.init(this);
      });
    }
    this.format = this.options.interpolation.format;
    if (!callback) callback = noop;
    if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
      const codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
      if (codes.length > 0 && codes[0] !== "dev") this.options.lng = codes[0];
    }
    if (!this.services.languageDetector && !this.options.lng) {
      this.logger.warn("init: no languageDetector is used and no lng is defined");
    }
    const storeApi = ["getResource", "hasResourceBundle", "getResourceBundle", "getDataByLanguage"];
    storeApi.forEach((fcName) => {
      this[fcName] = (...args) => this.store[fcName](...args);
    });
    const storeApiChained = ["addResource", "addResources", "addResourceBundle", "removeResourceBundle"];
    storeApiChained.forEach((fcName) => {
      this[fcName] = (...args) => {
        this.store[fcName](...args);
        return this;
      };
    });
    const deferred = defer();
    const load = () => {
      const finish = (err, t2) => {
        this.isInitializing = false;
        if (this.isInitialized && !this.initializedStoreOnce) this.logger.warn("init: i18next is already initialized. You should call init just once!");
        this.isInitialized = true;
        if (!this.options.isClone) this.logger.log("initialized", this.options);
        this.emit("initialized", this.options);
        deferred.resolve(t2);
        callback(err, t2);
      };
      if (this.languages && !this.isInitialized) return finish(null, this.t.bind(this));
      this.changeLanguage(this.options.lng, finish);
    };
    if (this.options.resources || !this.options.initAsync) {
      load();
    } else {
      setTimeout(load, 0);
    }
    return deferred;
  }
  loadResources(language, callback = noop) {
    let usedCallback = callback;
    const usedLng = isString(language) ? language : this.language;
    if (typeof language === "function") usedCallback = language;
    if (!this.options.resources || this.options.partialBundledLanguages) {
      if (usedLng?.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0)) return usedCallback();
      const toLoad = [];
      const append = (lng) => {
        if (!lng) return;
        if (lng === "cimode") return;
        const lngs = this.services.languageUtils.toResolveHierarchy(lng);
        lngs.forEach((l) => {
          if (l === "cimode") return;
          if (toLoad.indexOf(l) < 0) toLoad.push(l);
        });
      };
      if (!usedLng) {
        const fallbacks = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
        fallbacks.forEach((l) => append(l));
      } else {
        append(usedLng);
      }
      this.options.preload?.forEach?.((l) => append(l));
      this.services.backendConnector.load(toLoad, this.options.ns, (e2) => {
        if (!e2 && !this.resolvedLanguage && this.language) this.setResolvedLanguage(this.language);
        usedCallback(e2);
      });
    } else {
      usedCallback(null);
    }
  }
  reloadResources(lngs, ns, callback) {
    const deferred = defer();
    if (typeof lngs === "function") {
      callback = lngs;
      lngs = void 0;
    }
    if (typeof ns === "function") {
      callback = ns;
      ns = void 0;
    }
    if (!lngs) lngs = this.languages;
    if (!ns) ns = this.options.ns;
    if (!callback) callback = noop;
    this.services.backendConnector.reload(lngs, ns, (err) => {
      deferred.resolve();
      callback(err);
    });
    return deferred;
  }
  use(module) {
    if (!module) throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
    if (!module.type) throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
    if (module.type === "backend") {
      this.modules.backend = module;
    }
    if (module.type === "logger" || module.log && module.warn && module.error) {
      this.modules.logger = module;
    }
    if (module.type === "languageDetector") {
      this.modules.languageDetector = module;
    }
    if (module.type === "i18nFormat") {
      this.modules.i18nFormat = module;
    }
    if (module.type === "postProcessor") {
      postProcessor.addPostProcessor(module);
    }
    if (module.type === "formatter") {
      this.modules.formatter = module;
    }
    if (module.type === "3rdParty") {
      this.modules.external.push(module);
    }
    return this;
  }
  setResolvedLanguage(l) {
    if (!l || !this.languages) return;
    if (["cimode", "dev"].indexOf(l) > -1) return;
    for (let li = 0; li < this.languages.length; li++) {
      const lngInLngs = this.languages[li];
      if (["cimode", "dev"].indexOf(lngInLngs) > -1) continue;
      if (this.store.hasLanguageSomeTranslations(lngInLngs)) {
        this.resolvedLanguage = lngInLngs;
        break;
      }
    }
    if (!this.resolvedLanguage && this.languages.indexOf(l) < 0 && this.store.hasLanguageSomeTranslations(l)) {
      this.resolvedLanguage = l;
      this.languages.unshift(l);
    }
  }
  changeLanguage(lng, callback) {
    this.isLanguageChangingTo = lng;
    const deferred = defer();
    this.emit("languageChanging", lng);
    const setLngProps = (l) => {
      this.language = l;
      this.languages = this.services.languageUtils.toResolveHierarchy(l);
      this.resolvedLanguage = void 0;
      this.setResolvedLanguage(l);
    };
    const done = (err, l) => {
      if (l) {
        if (this.isLanguageChangingTo === lng) {
          setLngProps(l);
          this.translator.changeLanguage(l);
          this.isLanguageChangingTo = void 0;
          this.emit("languageChanged", l);
          this.logger.log("languageChanged", l);
        }
      } else {
        this.isLanguageChangingTo = void 0;
      }
      deferred.resolve((...args) => this.t(...args));
      if (callback) callback(err, (...args) => this.t(...args));
    };
    const setLng = (lngs) => {
      if (!lng && !lngs && this.services.languageDetector) lngs = [];
      const fl = isString(lngs) ? lngs : lngs && lngs[0];
      const l = this.store.hasLanguageSomeTranslations(fl) ? fl : this.services.languageUtils.getBestMatchFromCodes(isString(lngs) ? [lngs] : lngs);
      if (l) {
        if (!this.language) {
          setLngProps(l);
        }
        if (!this.translator.language) this.translator.changeLanguage(l);
        this.services.languageDetector?.cacheUserLanguage?.(l);
      }
      this.loadResources(l, (err) => {
        done(err, l);
      });
    };
    if (!lng && this.services.languageDetector && !this.services.languageDetector.async) {
      setLng(this.services.languageDetector.detect());
    } else if (!lng && this.services.languageDetector && this.services.languageDetector.async) {
      if (this.services.languageDetector.detect.length === 0) {
        this.services.languageDetector.detect().then(setLng);
      } else {
        this.services.languageDetector.detect(setLng);
      }
    } else {
      setLng(lng);
    }
    return deferred;
  }
  getFixedT(lng, ns, keyPrefix) {
    const fixedT = (key, opts, ...rest) => {
      let o;
      if (typeof opts !== "object") {
        o = this.options.overloadTranslationOptionHandler([key, opts].concat(rest));
      } else {
        o = {
          ...opts
        };
      }
      o.lng = o.lng || fixedT.lng;
      o.lngs = o.lngs || fixedT.lngs;
      o.ns = o.ns || fixedT.ns;
      if (o.keyPrefix !== "") o.keyPrefix = o.keyPrefix || keyPrefix || fixedT.keyPrefix;
      const keySeparator = this.options.keySeparator || ".";
      let resultKey;
      if (o.keyPrefix && Array.isArray(key)) {
        resultKey = key.map((k) => {
          if (typeof k === "function") k = keysFromSelector(k, {
            ...this.options,
            ...opts
          });
          return `${o.keyPrefix}${keySeparator}${k}`;
        });
      } else {
        if (typeof key === "function") key = keysFromSelector(key, {
          ...this.options,
          ...opts
        });
        resultKey = o.keyPrefix ? `${o.keyPrefix}${keySeparator}${key}` : key;
      }
      return this.t(resultKey, o);
    };
    if (isString(lng)) {
      fixedT.lng = lng;
    } else {
      fixedT.lngs = lng;
    }
    fixedT.ns = ns;
    fixedT.keyPrefix = keyPrefix;
    return fixedT;
  }
  t(...args) {
    return this.translator?.translate(...args);
  }
  exists(...args) {
    return this.translator?.exists(...args);
  }
  setDefaultNamespace(ns) {
    this.options.defaultNS = ns;
  }
  hasLoadedNamespace(ns, options = {}) {
    if (!this.isInitialized) {
      this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages);
      return false;
    }
    if (!this.languages || !this.languages.length) {
      this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages);
      return false;
    }
    const lng = options.lng || this.resolvedLanguage || this.languages[0];
    const fallbackLng = this.options ? this.options.fallbackLng : false;
    const lastLng = this.languages[this.languages.length - 1];
    if (lng.toLowerCase() === "cimode") return true;
    const loadNotPending = (l, n) => {
      const loadState = this.services.backendConnector.state[`${l}|${n}`];
      return loadState === -1 || loadState === 0 || loadState === 2;
    };
    if (options.precheck) {
      const preResult = options.precheck(this, loadNotPending);
      if (preResult !== void 0) return preResult;
    }
    if (this.hasResourceBundle(lng, ns)) return true;
    if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages) return true;
    if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns))) return true;
    return false;
  }
  loadNamespaces(ns, callback) {
    const deferred = defer();
    if (!this.options.ns) {
      if (callback) callback();
      return Promise.resolve();
    }
    if (isString(ns)) ns = [ns];
    ns.forEach((n) => {
      if (this.options.ns.indexOf(n) < 0) this.options.ns.push(n);
    });
    this.loadResources((err) => {
      deferred.resolve();
      if (callback) callback(err);
    });
    return deferred;
  }
  loadLanguages(lngs, callback) {
    const deferred = defer();
    if (isString(lngs)) lngs = [lngs];
    const preloaded = this.options.preload || [];
    const newLngs = lngs.filter((lng) => preloaded.indexOf(lng) < 0 && this.services.languageUtils.isSupportedCode(lng));
    if (!newLngs.length) {
      if (callback) callback();
      return Promise.resolve();
    }
    this.options.preload = preloaded.concat(newLngs);
    this.loadResources((err) => {
      deferred.resolve();
      if (callback) callback(err);
    });
    return deferred;
  }
  dir(lng) {
    if (!lng) lng = this.resolvedLanguage || (this.languages?.length > 0 ? this.languages[0] : this.language);
    if (!lng) return "rtl";
    try {
      const l = new Intl.Locale(lng);
      if (l && l.getTextInfo) {
        const ti = l.getTextInfo();
        if (ti && ti.direction) return ti.direction;
      }
    } catch (e2) {
    }
    const rtlLngs = ["ar", "shu", "sqr", "ssh", "xaa", "yhd", "yud", "aao", "abh", "abv", "acm", "acq", "acw", "acx", "acy", "adf", "ads", "aeb", "aec", "afb", "ajp", "apc", "apd", "arb", "arq", "ars", "ary", "arz", "auz", "avl", "ayh", "ayl", "ayn", "ayp", "bbz", "pga", "he", "iw", "ps", "pbt", "pbu", "pst", "prp", "prd", "ug", "ur", "ydd", "yds", "yih", "ji", "yi", "hbo", "men", "xmn", "fa", "jpr", "peo", "pes", "prs", "dv", "sam", "ckb"];
    const languageUtils = this.services?.languageUtils || new LanguageUtil(get());
    if (lng.toLowerCase().indexOf("-latn") > 1) return "ltr";
    return rtlLngs.indexOf(languageUtils.getLanguagePartFromCode(lng)) > -1 || lng.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr";
  }
  static createInstance(options = {}, callback) {
    const instance2 = new _I18n(options, callback);
    instance2.createInstance = _I18n.createInstance;
    return instance2;
  }
  cloneInstance(options = {}, callback = noop) {
    const forkResourceStore = options.forkResourceStore;
    if (forkResourceStore) delete options.forkResourceStore;
    const mergedOptions = {
      ...this.options,
      ...options,
      ...{
        isClone: true
      }
    };
    const clone = new _I18n(mergedOptions);
    if (options.debug !== void 0 || options.prefix !== void 0) {
      clone.logger = clone.logger.clone(options);
    }
    const membersToCopy = ["store", "services", "language"];
    membersToCopy.forEach((m) => {
      clone[m] = this[m];
    });
    clone.services = {
      ...this.services
    };
    clone.services.utils = {
      hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
    };
    if (forkResourceStore) {
      const clonedData = Object.keys(this.store.data).reduce((prev, l) => {
        prev[l] = {
          ...this.store.data[l]
        };
        prev[l] = Object.keys(prev[l]).reduce((acc, n) => {
          acc[n] = {
            ...prev[l][n]
          };
          return acc;
        }, prev[l]);
        return prev;
      }, {});
      clone.store = new ResourceStore(clonedData, mergedOptions);
      clone.services.resourceStore = clone.store;
    }
    if (options.interpolation) {
      const defOpts = get();
      const mergedInterpolation = {
        ...defOpts.interpolation,
        ...this.options.interpolation,
        ...options.interpolation
      };
      const mergedForInterpolator = {
        ...mergedOptions,
        interpolation: mergedInterpolation
      };
      clone.services.interpolator = new Interpolator(mergedForInterpolator);
    }
    clone.translator = new Translator(clone.services, mergedOptions);
    clone.translator.on("*", (event, ...args) => {
      clone.emit(event, ...args);
    });
    clone.init(mergedOptions, callback);
    clone.translator.options = mergedOptions;
    clone.translator.backendConnector.services.utils = {
      hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
    };
    return clone;
  }
  toJSON() {
    return {
      options: this.options,
      store: this.store,
      language: this.language,
      languages: this.languages,
      resolvedLanguage: this.resolvedLanguage
    };
  }
};
var instance = I18n.createInstance();
var createInstance = instance.createInstance;
var dir = instance.dir;
var init = instance.init;
var loadResources = instance.loadResources;
var reloadResources = instance.reloadResources;
var use = instance.use;
var changeLanguage = instance.changeLanguage;
var getFixedT = instance.getFixedT;
var t = instance.t;
var exists = instance.exists;
var setDefaultNamespace = instance.setDefaultNamespace;
var hasLoadedNamespace = instance.hasLoadedNamespace;
var loadNamespaces = instance.loadNamespaces;
var loadLanguages = instance.loadLanguages;

// aldraled/node_modules/html-parse-stringify/dist/html-parse-stringify.module.js
var import_void_elements = __toESM(require_void_elements());

// aldraled/node_modules/react-i18next/dist/es/utils.js
var warn = (i18n, code, msg, rest) => {
  const args = [msg, {
    code,
    ...rest || {}
  }];
  if (i18n?.services?.logger?.forward) {
    return i18n.services.logger.forward(args, "warn", "react-i18next::", true);
  }
  if (isString2(args[0])) args[0] = `react-i18next:: ${args[0]}`;
  if (i18n?.services?.logger?.warn) {
    i18n.services.logger.warn(...args);
  } else if (console?.warn) {
    console.warn(...args);
  }
};
var alreadyWarned = {};
var warnOnce = (i18n, code, msg, rest) => {
  if (isString2(msg) && alreadyWarned[msg]) return;
  if (isString2(msg)) alreadyWarned[msg] = /* @__PURE__ */ new Date();
  warn(i18n, code, msg, rest);
};
var loadedClb = (i18n, cb) => () => {
  if (i18n.isInitialized) {
    cb();
  } else {
    const initialized = () => {
      setTimeout(() => {
        i18n.off("initialized", initialized);
      }, 0);
      cb();
    };
    i18n.on("initialized", initialized);
  }
};
var loadNamespaces2 = (i18n, ns, cb) => {
  i18n.loadNamespaces(ns, loadedClb(i18n, cb));
};
var loadLanguages2 = (i18n, lng, ns, cb) => {
  if (isString2(ns)) ns = [ns];
  if (i18n.options.preload && i18n.options.preload.indexOf(lng) > -1) return loadNamespaces2(i18n, ns, cb);
  ns.forEach((n) => {
    if (i18n.options.ns.indexOf(n) < 0) i18n.options.ns.push(n);
  });
  i18n.loadLanguages(lng, loadedClb(i18n, cb));
};
var hasLoadedNamespace2 = (ns, i18n, options = {}) => {
  if (!i18n.languages || !i18n.languages.length) {
    warnOnce(i18n, "NO_LANGUAGES", "i18n.languages were undefined or empty", {
      languages: i18n.languages
    });
    return true;
  }
  return i18n.hasLoadedNamespace(ns, {
    lng: options.lng,
    precheck: (i18nInstance2, loadNotPending) => {
      if (options.bindI18n && options.bindI18n.indexOf("languageChanging") > -1 && i18nInstance2.services.backendConnector.backend && i18nInstance2.isLanguageChangingTo && !loadNotPending(i18nInstance2.isLanguageChangingTo, ns)) return false;
    }
  });
};
var isString2 = (obj) => typeof obj === "string";
var isObject = (obj) => typeof obj === "object" && obj !== null;

// aldraled/node_modules/react-i18next/dist/es/unescape.js
var matchHtmlEntity = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g;
var htmlEntities = {
  "&amp;": "&",
  "&#38;": "&",
  "&lt;": "<",
  "&#60;": "<",
  "&gt;": ">",
  "&#62;": ">",
  "&apos;": "'",
  "&#39;": "'",
  "&quot;": '"',
  "&#34;": '"',
  "&nbsp;": " ",
  "&#160;": " ",
  "&copy;": "\xA9",
  "&#169;": "\xA9",
  "&reg;": "\xAE",
  "&#174;": "\xAE",
  "&hellip;": "\u2026",
  "&#8230;": "\u2026",
  "&#x2F;": "/",
  "&#47;": "/"
};
var unescapeHtmlEntity = (m) => htmlEntities[m];
var unescape = (text) => text.replace(matchHtmlEntity, unescapeHtmlEntity);

// aldraled/node_modules/react-i18next/dist/es/defaults.js
var defaultOptions = {
  bindI18n: "languageChanged",
  bindI18nStore: "",
  transEmptyNodeValue: "",
  transSupportBasicHtmlNodes: true,
  transWrapTextNodes: "",
  transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p"],
  useSuspense: true,
  unescape,
  transDefaultProps: void 0
};
var getDefaults = () => defaultOptions;

// aldraled/node_modules/react-i18next/dist/es/i18nInstance.js
var i18nInstance;
var getI18n = () => i18nInstance;

// aldraled/node_modules/react-i18next/dist/es/context.js
import { createContext } from "react";
var I18nContext = createContext();
var ReportNamespaces = class {
  constructor() {
    this.usedNamespaces = {};
  }
  addUsedNamespaces(namespaces) {
    namespaces.forEach((ns) => {
      if (!this.usedNamespaces[ns]) this.usedNamespaces[ns] = true;
    });
  }
  getUsedNamespaces() {
    return Object.keys(this.usedNamespaces);
  }
};

// aldraled/node_modules/react-i18next/dist/es/IcuTrans.js
import { useContext as useContext2 } from "react";

// aldraled/node_modules/react-i18next/dist/es/IcuTransWithoutContext.js
import React2 from "react";

// aldraled/node_modules/react-i18next/dist/es/IcuTransUtils/TranslationParserError.js
var TranslationParserError = class _TranslationParserError extends Error {
  constructor(message, position, translationString) {
    super(message);
    this.name = "TranslationParserError";
    this.position = position;
    this.translationString = translationString;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _TranslationParserError);
    }
  }
};

// aldraled/node_modules/react-i18next/dist/es/IcuTransUtils/htmlEntityDecoder.js
var commonEntities = {
  "&nbsp;": "\xA0",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&copy;": "\xA9",
  "&reg;": "\xAE",
  "&trade;": "\u2122",
  "&hellip;": "\u2026",
  "&ndash;": "\u2013",
  "&mdash;": "\u2014",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&sbquo;": "\u201A",
  "&ldquo;": "\u201C",
  "&rdquo;": "\u201D",
  "&bdquo;": "\u201E",
  "&dagger;": "\u2020",
  "&Dagger;": "\u2021",
  "&bull;": "\u2022",
  "&prime;": "\u2032",
  "&Prime;": "\u2033",
  "&lsaquo;": "\u2039",
  "&rsaquo;": "\u203A",
  "&sect;": "\xA7",
  "&para;": "\xB6",
  "&middot;": "\xB7",
  "&ensp;": "\u2002",
  "&emsp;": "\u2003",
  "&thinsp;": "\u2009",
  "&euro;": "\u20AC",
  "&pound;": "\xA3",
  "&yen;": "\xA5",
  "&cent;": "\xA2",
  "&curren;": "\xA4",
  "&times;": "\xD7",
  "&divide;": "\xF7",
  "&minus;": "\u2212",
  "&plusmn;": "\xB1",
  "&ne;": "\u2260",
  "&le;": "\u2264",
  "&ge;": "\u2265",
  "&asymp;": "\u2248",
  "&equiv;": "\u2261",
  "&infin;": "\u221E",
  "&int;": "\u222B",
  "&sum;": "\u2211",
  "&prod;": "\u220F",
  "&radic;": "\u221A",
  "&part;": "\u2202",
  "&permil;": "\u2030",
  "&deg;": "\xB0",
  "&micro;": "\xB5",
  "&larr;": "\u2190",
  "&uarr;": "\u2191",
  "&rarr;": "\u2192",
  "&darr;": "\u2193",
  "&harr;": "\u2194",
  "&crarr;": "\u21B5",
  "&lArr;": "\u21D0",
  "&uArr;": "\u21D1",
  "&rArr;": "\u21D2",
  "&dArr;": "\u21D3",
  "&hArr;": "\u21D4",
  "&alpha;": "\u03B1",
  "&beta;": "\u03B2",
  "&gamma;": "\u03B3",
  "&delta;": "\u03B4",
  "&epsilon;": "\u03B5",
  "&zeta;": "\u03B6",
  "&eta;": "\u03B7",
  "&theta;": "\u03B8",
  "&iota;": "\u03B9",
  "&kappa;": "\u03BA",
  "&lambda;": "\u03BB",
  "&mu;": "\u03BC",
  "&nu;": "\u03BD",
  "&xi;": "\u03BE",
  "&omicron;": "\u03BF",
  "&pi;": "\u03C0",
  "&rho;": "\u03C1",
  "&sigma;": "\u03C3",
  "&tau;": "\u03C4",
  "&upsilon;": "\u03C5",
  "&phi;": "\u03C6",
  "&chi;": "\u03C7",
  "&psi;": "\u03C8",
  "&omega;": "\u03C9",
  "&Alpha;": "\u0391",
  "&Beta;": "\u0392",
  "&Gamma;": "\u0393",
  "&Delta;": "\u0394",
  "&Epsilon;": "\u0395",
  "&Zeta;": "\u0396",
  "&Eta;": "\u0397",
  "&Theta;": "\u0398",
  "&Iota;": "\u0399",
  "&Kappa;": "\u039A",
  "&Lambda;": "\u039B",
  "&Mu;": "\u039C",
  "&Nu;": "\u039D",
  "&Xi;": "\u039E",
  "&Omicron;": "\u039F",
  "&Pi;": "\u03A0",
  "&Rho;": "\u03A1",
  "&Sigma;": "\u03A3",
  "&Tau;": "\u03A4",
  "&Upsilon;": "\u03A5",
  "&Phi;": "\u03A6",
  "&Chi;": "\u03A7",
  "&Psi;": "\u03A8",
  "&Omega;": "\u03A9",
  "&Agrave;": "\xC0",
  "&Aacute;": "\xC1",
  "&Acirc;": "\xC2",
  "&Atilde;": "\xC3",
  "&Auml;": "\xC4",
  "&Aring;": "\xC5",
  "&AElig;": "\xC6",
  "&Ccedil;": "\xC7",
  "&Egrave;": "\xC8",
  "&Eacute;": "\xC9",
  "&Ecirc;": "\xCA",
  "&Euml;": "\xCB",
  "&Igrave;": "\xCC",
  "&Iacute;": "\xCD",
  "&Icirc;": "\xCE",
  "&Iuml;": "\xCF",
  "&ETH;": "\xD0",
  "&Ntilde;": "\xD1",
  "&Ograve;": "\xD2",
  "&Oacute;": "\xD3",
  "&Ocirc;": "\xD4",
  "&Otilde;": "\xD5",
  "&Ouml;": "\xD6",
  "&Oslash;": "\xD8",
  "&Ugrave;": "\xD9",
  "&Uacute;": "\xDA",
  "&Ucirc;": "\xDB",
  "&Uuml;": "\xDC",
  "&Yacute;": "\xDD",
  "&THORN;": "\xDE",
  "&szlig;": "\xDF",
  "&agrave;": "\xE0",
  "&aacute;": "\xE1",
  "&acirc;": "\xE2",
  "&atilde;": "\xE3",
  "&auml;": "\xE4",
  "&aring;": "\xE5",
  "&aelig;": "\xE6",
  "&ccedil;": "\xE7",
  "&egrave;": "\xE8",
  "&eacute;": "\xE9",
  "&ecirc;": "\xEA",
  "&euml;": "\xEB",
  "&igrave;": "\xEC",
  "&iacute;": "\xED",
  "&icirc;": "\xEE",
  "&iuml;": "\xEF",
  "&eth;": "\xF0",
  "&ntilde;": "\xF1",
  "&ograve;": "\xF2",
  "&oacute;": "\xF3",
  "&ocirc;": "\xF4",
  "&otilde;": "\xF5",
  "&ouml;": "\xF6",
  "&oslash;": "\xF8",
  "&ugrave;": "\xF9",
  "&uacute;": "\xFA",
  "&ucirc;": "\xFB",
  "&uuml;": "\xFC",
  "&yacute;": "\xFD",
  "&thorn;": "\xFE",
  "&yuml;": "\xFF",
  "&iexcl;": "\xA1",
  "&iquest;": "\xBF",
  "&fnof;": "\u0192",
  "&circ;": "\u02C6",
  "&tilde;": "\u02DC",
  "&OElig;": "\u0152",
  "&oelig;": "\u0153",
  "&Scaron;": "\u0160",
  "&scaron;": "\u0161",
  "&Yuml;": "\u0178",
  "&ordf;": "\xAA",
  "&ordm;": "\xBA",
  "&macr;": "\xAF",
  "&acute;": "\xB4",
  "&cedil;": "\xB8",
  "&sup1;": "\xB9",
  "&sup2;": "\xB2",
  "&sup3;": "\xB3",
  "&frac14;": "\xBC",
  "&frac12;": "\xBD",
  "&frac34;": "\xBE",
  "&spades;": "\u2660",
  "&clubs;": "\u2663",
  "&hearts;": "\u2665",
  "&diams;": "\u2666",
  "&loz;": "\u25CA",
  "&oline;": "\u203E",
  "&frasl;": "\u2044",
  "&weierp;": "\u2118",
  "&image;": "\u2111",
  "&real;": "\u211C",
  "&alefsym;": "\u2135"
};
var entityPattern = new RegExp(Object.keys(commonEntities).map((entity) => entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
var decodeHtmlEntities = (text) => text.replace(entityPattern, (match) => commonEntities[match]).replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10))).replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

// aldraled/node_modules/react-i18next/dist/es/IcuTransUtils/tokenizer.js
var tokenize = (translation) => {
  const tokens = [];
  let position = 0;
  let currentText = "";
  const flushText = () => {
    if (currentText) {
      tokens.push({
        type: "Text",
        value: currentText,
        position: position - currentText.length
      });
      currentText = "";
    }
  };
  while (position < translation.length) {
    const char = translation[position];
    if (char === "<") {
      const tagMatch = translation.slice(position).match(/^<(\d+)>/);
      if (tagMatch) {
        flushText();
        tokens.push({
          type: "TagOpen",
          value: tagMatch[0],
          position,
          tagNumber: parseInt(tagMatch[1], 10)
        });
        position += tagMatch[0].length;
      } else {
        const closeTagMatch = translation.slice(position).match(/^<\/(\d+)>/);
        if (closeTagMatch) {
          flushText();
          tokens.push({
            type: "TagClose",
            value: closeTagMatch[0],
            position,
            tagNumber: parseInt(closeTagMatch[1], 10)
          });
          position += closeTagMatch[0].length;
        } else {
          currentText += char;
          position += 1;
        }
      }
    } else {
      currentText += char;
      position += 1;
    }
  }
  flushText();
  return tokens;
};

// aldraled/node_modules/react-i18next/dist/es/IcuTransUtils/renderTranslation.js
import React from "react";
var renderDeclarationNode = (declaration, children, childDeclarations) => {
  const {
    type,
    props = {}
  } = declaration;
  if (props.children && Array.isArray(props.children) && childDeclarations) {
    const {
      children: _childrenToRemove,
      ...propsWithoutChildren
    } = props;
    return React.createElement(type, propsWithoutChildren, ...children);
  }
  if (children.length === 0) {
    return React.createElement(type, props);
  }
  if (children.length === 1) {
    return React.createElement(type, props, children[0]);
  }
  return React.createElement(type, props, ...children);
};
var renderTranslation = (translation, declarations = []) => {
  if (!translation) {
    return [];
  }
  const tokens = tokenize(translation);
  const result = [];
  const stack = [];
  const literalTagNumbers = /* @__PURE__ */ new Set();
  const getCurrentDeclarations = () => {
    if (stack.length === 0) {
      return declarations;
    }
    const parentFrame = stack[stack.length - 1];
    if (parentFrame.declaration.props?.children && Array.isArray(parentFrame.declaration.props.children)) {
      return parentFrame.declaration.props.children;
    }
    return parentFrame.declarations;
  };
  tokens.forEach((token) => {
    switch (token.type) {
      case "Text":
        {
          const decoded = decodeHtmlEntities(token.value);
          const targetArray = stack.length > 0 ? stack[stack.length - 1].children : result;
          targetArray.push(decoded);
        }
        break;
      case "TagOpen":
        {
          const {
            tagNumber
          } = token;
          const currentDeclarations = getCurrentDeclarations();
          const declaration = currentDeclarations[tagNumber];
          if (!declaration) {
            literalTagNumbers.add(tagNumber);
            const literalText = `<${tagNumber}>`;
            const targetArray = stack.length > 0 ? stack[stack.length - 1].children : result;
            targetArray.push(literalText);
            break;
          }
          stack.push({
            tagNumber,
            children: [],
            position: token.position,
            declaration,
            declarations: currentDeclarations
          });
        }
        break;
      case "TagClose":
        {
          const {
            tagNumber
          } = token;
          if (literalTagNumbers.has(tagNumber)) {
            const literalText = `</${tagNumber}>`;
            const literalTargetArray = stack.length > 0 ? stack[stack.length - 1].children : result;
            literalTargetArray.push(literalText);
            literalTagNumbers.delete(tagNumber);
            break;
          }
          if (stack.length === 0) {
            throw new TranslationParserError(`Unexpected closing tag </${tagNumber}> at position ${token.position}`, token.position, translation);
          }
          const frame = stack.pop();
          if (frame.tagNumber !== tagNumber) {
            throw new TranslationParserError(`Mismatched tags: expected </${frame.tagNumber}> but got </${tagNumber}> at position ${token.position}`, token.position, translation);
          }
          const element = renderDeclarationNode(frame.declaration, frame.children, frame.declarations);
          const elementTargetArray = stack.length > 0 ? stack[stack.length - 1].children : result;
          elementTargetArray.push(element);
        }
        break;
    }
  });
  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    throw new TranslationParserError(`Unclosed tag <${unclosed.tagNumber}> at position ${unclosed.position}`, unclosed.position, translation);
  }
  return result;
};

// aldraled/node_modules/react-i18next/dist/es/IcuTransWithoutContext.js
function IcuTransWithoutContext({
  i18nKey,
  defaultTranslation,
  content,
  ns,
  values = {},
  i18n: i18nFromProps,
  t: tFromProps
}) {
  const i18n = i18nFromProps || getI18n();
  if (!i18n) {
    warnOnce(i18n, "NO_I18NEXT_INSTANCE", `IcuTrans: You need to pass in an i18next instance using i18nextReactModule`, {
      i18nKey
    });
    return React2.createElement(React2.Fragment, {}, defaultTranslation);
  }
  const t2 = tFromProps || i18n.t?.bind(i18n) || ((k) => k);
  let namespaces = ns || t2.ns || i18n.options?.defaultNS;
  namespaces = isString2(namespaces) ? [namespaces] : namespaces || ["translation"];
  let mergedValues = values;
  if (i18n.options?.interpolation?.defaultVariables) {
    mergedValues = values && Object.keys(values).length > 0 ? {
      ...values,
      ...i18n.options.interpolation.defaultVariables
    } : {
      ...i18n.options.interpolation.defaultVariables
    };
  }
  const translation = t2(i18nKey, {
    defaultValue: defaultTranslation,
    ...mergedValues,
    ns: namespaces
  });
  try {
    const rendered = renderTranslation(translation, content);
    return React2.createElement(React2.Fragment, {}, ...rendered);
  } catch (error) {
    warn(i18n, "ICU_TRANS_RENDER_ERROR", `IcuTrans component error for key "${i18nKey}": ${error.message}`, {
      i18nKey,
      error
    });
    return React2.createElement(React2.Fragment, {}, translation);
  }
}
IcuTransWithoutContext.displayName = "IcuTransWithoutContext";

// aldraled/node_modules/react-i18next/dist/es/IcuTrans.js
function IcuTrans({
  i18nKey,
  defaultTranslation,
  content,
  ns,
  values = {},
  i18n: i18nFromProps,
  t: tFromProps
}) {
  const {
    i18n: i18nFromContext,
    defaultNS: defaultNSFromContext
  } = useContext2(I18nContext) || {};
  const i18n = i18nFromProps || i18nFromContext || getI18n();
  const t2 = tFromProps || i18n?.t.bind(i18n);
  return IcuTransWithoutContext({
    i18nKey,
    defaultTranslation,
    content,
    ns: ns || t2?.ns || defaultNSFromContext || i18n?.options?.defaultNS,
    values,
    i18n,
    t: tFromProps
  });
}
IcuTrans.displayName = "IcuTrans";

// aldraled/node_modules/react-i18next/dist/es/useTranslation.js
var import_shim = __toESM(require_shim(), 1);
import { useContext as useContext3, useCallback, useMemo, useEffect, useRef, useState } from "react";
var notReadyT = (k, optsOrDefaultValue) => {
  if (isString2(optsOrDefaultValue)) return optsOrDefaultValue;
  if (isObject(optsOrDefaultValue) && isString2(optsOrDefaultValue.defaultValue)) return optsOrDefaultValue.defaultValue;
  if (typeof k === "function") return "";
  if (Array.isArray(k)) {
    const last = k[k.length - 1];
    return typeof last === "function" ? "" : last;
  }
  return k;
};
var notReadySnapshot = {
  t: notReadyT,
  ready: false
};
var dummySubscribe = () => () => {
};
var useTranslation = (ns, props = {}) => {
  const {
    i18n: i18nFromProps
  } = props;
  const {
    i18n: i18nFromContext,
    defaultNS: defaultNSFromContext
  } = useContext3(I18nContext) || {};
  const i18n = i18nFromProps || i18nFromContext || getI18n();
  if (i18n && !i18n.reportNamespaces) i18n.reportNamespaces = new ReportNamespaces();
  if (!i18n) {
    warnOnce(i18n, "NO_I18NEXT_INSTANCE", "useTranslation: You will need to pass in an i18next instance by using initReactI18next");
  }
  const i18nOptions = useMemo(() => ({
    ...getDefaults(),
    ...i18n?.options?.react,
    ...props
  }), [i18n, props]);
  const {
    useSuspense,
    keyPrefix
  } = i18nOptions;
  const nsOrContext = ns || defaultNSFromContext || i18n?.options?.defaultNS;
  const unstableNamespaces = isString2(nsOrContext) ? [nsOrContext] : nsOrContext || ["translation"];
  const namespaces = useMemo(() => unstableNamespaces, unstableNamespaces);
  i18n?.reportNamespaces?.addUsedNamespaces?.(namespaces);
  const revisionRef = useRef(0);
  const subscribe = useCallback((callback) => {
    if (!i18n) return dummySubscribe;
    const {
      bindI18n,
      bindI18nStore
    } = i18nOptions;
    const wrappedCallback = () => {
      revisionRef.current += 1;
      callback();
    };
    if (bindI18n) i18n.on(bindI18n, wrappedCallback);
    if (bindI18nStore) i18n.store.on(bindI18nStore, wrappedCallback);
    return () => {
      if (bindI18n) bindI18n.split(" ").forEach((e2) => i18n.off(e2, wrappedCallback));
      if (bindI18nStore) bindI18nStore.split(" ").forEach((e2) => i18n.store.off(e2, wrappedCallback));
    };
  }, [i18n, i18nOptions]);
  const snapshotRef = useRef();
  const getSnapshot = useCallback(() => {
    if (!i18n) {
      return notReadySnapshot;
    }
    const calculatedReady = !!(i18n.isInitialized || i18n.initializedStoreOnce) && namespaces.every((n) => hasLoadedNamespace2(n, i18n, i18nOptions));
    const currentLng = props.lng || i18n.language;
    const currentRevision = revisionRef.current;
    const lastSnapshot = snapshotRef.current;
    if (lastSnapshot && lastSnapshot.ready === calculatedReady && lastSnapshot.lng === currentLng && lastSnapshot.keyPrefix === keyPrefix && lastSnapshot.revision === currentRevision) {
      return lastSnapshot;
    }
    const calculatedT = i18n.getFixedT(currentLng, i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0], keyPrefix);
    const newSnapshot = {
      t: calculatedT,
      ready: calculatedReady,
      lng: currentLng,
      keyPrefix,
      revision: currentRevision
    };
    snapshotRef.current = newSnapshot;
    return newSnapshot;
  }, [i18n, namespaces, keyPrefix, i18nOptions, props.lng]);
  const [loadCount, setLoadCount] = useState(0);
  const {
    t: t2,
    ready
  } = (0, import_shim.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (i18n && !ready && !useSuspense) {
      const onLoaded = () => setLoadCount((c) => c + 1);
      if (props.lng) {
        loadLanguages2(i18n, props.lng, namespaces, onLoaded);
      } else {
        loadNamespaces2(i18n, namespaces, onLoaded);
      }
    }
  }, [i18n, props.lng, namespaces, ready, useSuspense, loadCount]);
  const finalI18n = i18n || {};
  const wrapperRef = useRef(null);
  const wrapperLangRef = useRef();
  const createI18nWrapper = (original) => {
    const descriptors = Object.getOwnPropertyDescriptors(original);
    if (descriptors.__original) delete descriptors.__original;
    const wrapper = Object.create(Object.getPrototypeOf(original), descriptors);
    if (!Object.prototype.hasOwnProperty.call(wrapper, "__original")) {
      try {
        Object.defineProperty(wrapper, "__original", {
          value: original,
          writable: false,
          enumerable: false,
          configurable: false
        });
      } catch (_) {
      }
    }
    return wrapper;
  };
  const ret = useMemo(() => {
    const original = finalI18n;
    const lang = original?.language;
    let i18nWrapper = original;
    if (original) {
      if (wrapperRef.current && wrapperRef.current.__original === original) {
        if (wrapperLangRef.current !== lang) {
          i18nWrapper = createI18nWrapper(original);
          wrapperRef.current = i18nWrapper;
          wrapperLangRef.current = lang;
        } else {
          i18nWrapper = wrapperRef.current;
        }
      } else {
        i18nWrapper = createI18nWrapper(original);
        wrapperRef.current = i18nWrapper;
        wrapperLangRef.current = lang;
      }
    }
    const arr = [t2, i18nWrapper, ready];
    arr.t = t2;
    arr.i18n = i18nWrapper;
    arr.ready = ready;
    return arr;
  }, [t2, finalI18n, ready, finalI18n.resolvedLanguage, finalI18n.language, finalI18n.languages]);
  if (i18n && useSuspense && !ready) {
    throw new Promise((resolve) => {
      const onLoaded = () => resolve();
      if (props.lng) {
        loadLanguages2(i18n, props.lng, namespaces, onLoaded);
      } else {
        loadNamespaces2(i18n, namespaces, onLoaded);
      }
    });
  }
  return ret;
};

// aldraled/node_modules/react-i18next/dist/es/withTranslation.js
import { createElement as createElement2, forwardRef as forwardRefReact } from "react";

// aldraled/node_modules/react-i18next/dist/es/I18nextProvider.js
import { createElement as createElement3, useMemo as useMemo2 } from "react";

// aldraled/node_modules/react-i18next/dist/es/withSSR.js
import { createElement as createElement4 } from "react";

// aldraled/node_modules/react-i18next/dist/es/useSSR.js
import { useContext as useContext4 } from "react";

// aldraled/src/components/CustomBlocks.js
import React3 from "react";
import { Link } from "react-router-dom";

// aldraled/src/lib/routes.js
var ROUTES = {
  home: "/",
  about: "/over-ons",
  shop: "/producten",
  product: (id) => `/product/${id}`,
  contact: "/contact",
  dealers: "/verkooppunten",
  blog: "/blog",
  blogPost: (id) => `/blog/${id}`,
  login: "/login",
  register: "/registreren",
  account: "/account",
  checkout: "/checkout",
  orderSuccess: (orderId) => `/bestelling-geplaatst${orderId ? `/${orderId}` : ""}`,
  returns: "/retouren",
  terms: "/algemene-voorwaarden",
  privacy: "/privacy-policy",
  returnsPolicy: "/retourbeleid",
  complaints: "/klachten"
};
function shopWithCategory(cat) {
  const slug = cat?.slug || cat?.id || cat;
  return slug ? `${ROUTES.shop}?categorie=${encodeURIComponent(slug)}` : ROUTES.shop;
}
var NAV_LINKS = [
  { to: ROUTES.home, labelKey: "nav.home" },
  { to: ROUTES.about, labelKey: "nav.about" },
  { to: ROUTES.blog, labelKey: "nav.blog" },
  { to: ROUTES.contact, labelKey: "nav.contact" }
];
var FOOTER_NAV_LINKS = [
  { to: ROUTES.home, label: "Home" },
  { to: ROUTES.about, label: "Over ons" },
  { to: ROUTES.shop, label: "Webshop" },
  { to: ROUTES.contact, label: "Contact" }
];

// aldraled/src/lib/api.js
import axios from "axios";
var API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").trim();
var PLACEHOLDER_SVG = "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";
var PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;
var api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" }
});
var getMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("//") || url.startsWith("data:")) {
    return url;
  }
  const base = (API_URL || "").replace(/\/+$/, "");
  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url;
};
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("alra_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// aldraled/src/components/CustomBlocks.js
function splitParagraphs(text) {
  if (!text) return [];
  return String(text).replace(/<br\s*\/?>/gi, "\n").split(/\n{1,}/).map((s) => s.trim()).filter(Boolean);
}
function Paragraphs({ text, className = "", align = "text-left", space = "space-y-5" }) {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length <= 1) {
    return /* @__PURE__ */ React3.createElement("p", { className: `${className} ${align} leading-relaxed` }, text);
  }
  return /* @__PURE__ */ React3.createElement("div", { className: space }, paragraphs.map((p, i) => /* @__PURE__ */ React3.createElement("p", { key: i, className: `${className} ${align} leading-relaxed` }, p)));
}
function BannerBlock({ data }) {
  return /* @__PURE__ */ React3.createElement(
    "section",
    {
      style: { background: `linear-gradient(135deg, ${data.bgColor || "#0c4684"} 0%, ${data.bgColor || "#0c4684"}cc 100%)` },
      className: "relative overflow-hidden py-20 px-6"
    },
    /* @__PURE__ */ React3.createElement(
      "div",
      {
        className: "absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10",
        style: { background: data.textColor || "#fff" }
      }
    ),
    /* @__PURE__ */ React3.createElement(
      "div",
      {
        className: "absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-5",
        style: { background: data.textColor || "#fff" }
      }
    ),
    /* @__PURE__ */ React3.createElement(
      "div",
      {
        className: "relative max-w-4xl mx-auto text-center space-y-5",
        style: { color: data.textColor || "#ffffff" }
      },
      /* @__PURE__ */ React3.createElement("h2", { className: "text-4xl md:text-5xl font-black leading-tight tracking-tight" }, data.heading),
      data.subtext && /* @__PURE__ */ React3.createElement("p", { className: "text-lg opacity-75 max-w-2xl mx-auto font-light leading-relaxed" }, data.subtext),
      data.buttonText && /* @__PURE__ */ React3.createElement("div", { className: "pt-2" }, /* @__PURE__ */ React3.createElement(
        Link,
        {
          to: ROUTES.contact,
          className: "inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-full font-bold text-sm hover:scale-105 hover:shadow-xl transition-all duration-300"
        },
        data.buttonText,
        /* @__PURE__ */ React3.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, /* @__PURE__ */ React3.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 8l4 4m0 0l-4 4m4-4H3" }))
      ))
    )
  );
}
function TextBlock({ data }) {
  return /* @__PURE__ */ React3.createElement("section", { className: "py-20 px-6 bg-white" }, /* @__PURE__ */ React3.createElement("div", { className: "max-w-3xl mx-auto text-center" }, /* @__PURE__ */ React3.createElement("div", { className: "flex items-center justify-center gap-3 mb-6" }, /* @__PURE__ */ React3.createElement("div", { className: "h-px w-12 bg-primary/40" }), /* @__PURE__ */ React3.createElement("div", { className: "w-2 h-2 rounded-full bg-primary" }), /* @__PURE__ */ React3.createElement("div", { className: "h-px w-12 bg-primary/40" })), /* @__PURE__ */ React3.createElement("h2", { className: "text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-6" }, data.heading), data.body && /* @__PURE__ */ React3.createElement("div", { className: "text-gray-500 text-lg" }, /* @__PURE__ */ React3.createElement(Paragraphs, { text: data.body, align: "text-center" }))));
}
function FeatureGrid({ data }) {
  return /* @__PURE__ */ React3.createElement("section", { className: "py-20 px-6 bg-gray-50" }, /* @__PURE__ */ React3.createElement("div", { className: "max-w-6xl mx-auto" }, data.heading && /* @__PURE__ */ React3.createElement("div", { className: "text-center mb-14" }, /* @__PURE__ */ React3.createElement("h2", { className: "text-4xl md:text-5xl font-black text-gray-900 tracking-tight" }, data.heading), /* @__PURE__ */ React3.createElement("div", { className: "flex justify-center mt-4" }, /* @__PURE__ */ React3.createElement("div", { className: "h-1 w-16 rounded-full bg-primary" }))), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" }, (data.items || []).map((item, i) => /* @__PURE__ */ React3.createElement(
    "div",
    {
      key: i,
      className: "group bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    },
    /* @__PURE__ */ React3.createElement("div", { className: "w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-primary/20 transition-colors" }, item.icon),
    /* @__PURE__ */ React3.createElement("h3", { className: "font-bold text-gray-900 text-lg mb-2" }, item.title),
    /* @__PURE__ */ React3.createElement("p", { className: "text-sm text-gray-500 leading-relaxed" }, item.description)
  )))));
}
function ImageTextBlock({ data }) {
  const isRight = data.imagePosition === "right";
  return /* @__PURE__ */ React3.createElement("section", { className: "py-20 px-6 bg-white overflow-hidden" }, /* @__PURE__ */ React3.createElement("div", { className: `max-w-5xl mx-auto flex flex-col ${isRight ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-14` }, data.imageUrl && /* @__PURE__ */ React3.createElement("div", { className: "flex-1 w-full" }, /* @__PURE__ */ React3.createElement("div", { className: "relative rounded-3xl overflow-hidden shadow-2xl group" }, /* @__PURE__ */ React3.createElement(
    "img",
    {
      src: getMediaUrl(data.imageUrl),
      alt: data.heading,
      className: "w-full h-72 md:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
    }
  ), /* @__PURE__ */ React3.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" }))), /* @__PURE__ */ React3.createElement("div", { className: "flex-1 space-y-5" }, /* @__PURE__ */ React3.createElement("div", { className: "h-1 w-12 rounded-full bg-primary" }), /* @__PURE__ */ React3.createElement("h2", { className: "text-3xl md:text-4xl font-black text-gray-900 leading-tight" }, data.heading), /* @__PURE__ */ React3.createElement("div", { className: "text-gray-500 text-lg font-light" }, /* @__PURE__ */ React3.createElement(Paragraphs, { text: data.body })))));
}
function StatsRow({ data }) {
  return /* @__PURE__ */ React3.createElement("section", { className: "py-16 px-6 bg-gradient-to-r from-primary/5 via-white to-primary/5 border-y border-primary/10" }, /* @__PURE__ */ React3.createElement("div", { className: "max-w-5xl mx-auto" }, /* @__PURE__ */ React3.createElement("div", { className: "flex flex-wrap justify-center divide-x divide-primary/10" }, (data.items || []).map((item, i) => /* @__PURE__ */ React3.createElement("div", { key: i, className: "flex-1 min-w-[140px] text-center px-8 py-4" }, /* @__PURE__ */ React3.createElement("p", { className: "text-5xl font-black text-primary leading-none" }, item.number), /* @__PURE__ */ React3.createElement("p", { className: "text-sm text-gray-500 mt-2 font-semibold uppercase tracking-widest" }, item.label))))));
}
function CtaBlock({ data }) {
  return /* @__PURE__ */ React3.createElement("section", { className: "py-20 px-6 bg-gray-950 relative overflow-hidden" }, /* @__PURE__ */ React3.createElement("div", { className: "absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgb(var(--color-primary)/0.15),_transparent_60%)]" }), /* @__PURE__ */ React3.createElement("div", { className: "absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgb(var(--color-primary)/0.08),_transparent_60%)]" }), /* @__PURE__ */ React3.createElement("div", { className: "relative max-w-3xl mx-auto text-center space-y-5" }, /* @__PURE__ */ React3.createElement("h2", { className: "text-4xl md:text-5xl font-black text-white leading-tight" }, data.heading), data.subtext && /* @__PURE__ */ React3.createElement("p", { className: "text-white/50 text-lg font-light" }, data.subtext), /* @__PURE__ */ React3.createElement("div", { className: "flex flex-wrap justify-center gap-4 pt-3" }, data.primaryButton && /* @__PURE__ */ React3.createElement(
    Link,
    {
      to: ROUTES.contact,
      className: "px-8 py-3.5 bg-primary text-white rounded-full font-bold text-sm hover:brightness-110 hover:scale-105 transition-all shadow-lg shadow-primary/30"
    },
    data.primaryButton
  ), data.secondaryButton && /* @__PURE__ */ React3.createElement(
    Link,
    {
      to: ROUTES.shop,
      className: "px-8 py-3.5 bg-white/10 border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white/20 hover:scale-105 transition-all"
    },
    data.secondaryButton
  ))));
}
function StepsBlock({ data }) {
  return /* @__PURE__ */ React3.createElement("section", { className: "py-20 px-6 bg-white" }, /* @__PURE__ */ React3.createElement("div", { className: "max-w-5xl mx-auto" }, data.heading && /* @__PURE__ */ React3.createElement("div", { className: "text-center mb-14" }, /* @__PURE__ */ React3.createElement("h2", { className: "text-4xl md:text-5xl font-black text-gray-900 tracking-tight" }, data.heading), /* @__PURE__ */ React3.createElement("div", { className: "flex justify-center mt-4" }, /* @__PURE__ */ React3.createElement("div", { className: "h-1 w-16 rounded-full bg-primary" }))), /* @__PURE__ */ React3.createElement("div", { className: "relative" }, /* @__PURE__ */ React3.createElement("div", { className: "hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" }), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8" }, (data.items || []).map((step, i) => /* @__PURE__ */ React3.createElement("div", { key: i, className: "text-center group" }, /* @__PURE__ */ React3.createElement("div", { className: "relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary font-black text-xl mb-5 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm" }, step.number), /* @__PURE__ */ React3.createElement("h3", { className: "font-bold text-gray-900 mb-2" }, step.title), /* @__PURE__ */ React3.createElement("p", { className: "text-sm text-gray-500 leading-relaxed" }, step.description)))))));
}
function BlogPostBlock({ data }) {
  return /* @__PURE__ */ React3.createElement("article", { className: "group bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" }, data.imageUrl && /* @__PURE__ */ React3.createElement("div", { className: "relative h-52 overflow-hidden" }, /* @__PURE__ */ React3.createElement(
    "img",
    {
      src: getMediaUrl(data.imageUrl),
      alt: data.title,
      className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
    }
  ), /* @__PURE__ */ React3.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" })), /* @__PURE__ */ React3.createElement("div", { className: "p-7 space-y-3" }, data.date && /* @__PURE__ */ React3.createElement("p", { className: "text-xs font-bold text-primary uppercase tracking-widest" }, data.date), /* @__PURE__ */ React3.createElement("h3", { className: "text-xl font-black text-gray-900 leading-tight group-hover:text-primary transition-colors" }, data.title), data.excerpt && /* @__PURE__ */ React3.createElement("p", { className: "text-sm text-gray-500 leading-relaxed line-clamp-3" }, data.excerpt), data.author && /* @__PURE__ */ React3.createElement("div", { className: "flex items-center gap-2 pt-2 border-t border-gray-100" }, /* @__PURE__ */ React3.createElement("div", { className: "w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold" }, data.author[0]), /* @__PURE__ */ React3.createElement("span", { className: "text-xs font-semibold text-gray-500" }, data.author))));
}
function LayoutBuilderBlock({ data }) {
  const background = data?.background || "white";
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const container = data?.container || "wide";
  const variant = data?.variant || "plain";
  const gap = data?.gap || "md";
  const padding = data?.padding || "lg";
  const sectionClass = background === "dark" ? "py-20 px-6 bg-secondary" : background === "gray" ? "py-20 px-6 bg-gray-50" : "py-20 px-6 bg-white";
  const textColor = background === "dark" ? "text-white" : "text-secondary";
  const subTextColor = background === "dark" ? "text-white/60" : "text-gray-500";
  const divider = background === "dark" ? "bg-white/10" : "bg-gray-100";
  const containerClass = container === "narrow" ? "max-w-3xl" : container === "normal" ? "max-w-5xl" : "max-w-6xl";
  const gapClass = gap === "sm" ? "space-y-3" : gap === "lg" ? "space-y-10" : "space-y-6";
  const padClass = padding === "md" ? "p-8" : "p-10";
  return /* @__PURE__ */ React3.createElement("section", { className: sectionClass }, /* @__PURE__ */ React3.createElement("div", { className: `${containerClass} mx-auto` }, /* @__PURE__ */ React3.createElement("div", { className: `${variant === "card" ? `rounded-3xl ${padClass} ${background === "dark" ? "bg-white/5 border border-white/10" : "bg-white border border-gray-100 shadow-sm"}` : ""}` }, /* @__PURE__ */ React3.createElement("div", { className: gapClass }, elements.map((e2) => {
    if (!e2 || !e2.type) return null;
    if (e2.type === "spacer") return /* @__PURE__ */ React3.createElement("div", { key: e2.id, style: { height: Number(e2.size) || 24 } });
    if (e2.type === "heading") {
      const align = e2.align === "center" ? "text-center" : "text-left";
      const level = Number(e2.level) || 2;
      const cls = level === 3 ? `text-2xl md:text-3xl font-black tracking-tight ${textColor} ${align}` : level === 4 ? `text-xl md:text-2xl font-black tracking-tight ${textColor} ${align}` : `text-3xl md:text-4xl font-black tracking-tight ${textColor} ${align}`;
      const Tag = level === 4 ? "h4" : level === 3 ? "h3" : "h2";
      return /* @__PURE__ */ React3.createElement(Tag, { key: e2.id, className: cls }, e2.text);
    }
    if (e2.type === "text") {
      const align = e2.align === "center" ? "text-center" : "text-left";
      return /* @__PURE__ */ React3.createElement("div", { key: e2.id, className: `${subTextColor} text-lg font-light` }, /* @__PURE__ */ React3.createElement(Paragraphs, { text: e2.text, align }));
    }
    if (e2.type === "image") {
      if (!e2.url) return null;
      const explicitW = Number(e2.widthPx);
      const explicitH = Number(e2.heightPx);
      const maxWidth = Number.isFinite(explicitW) && explicitW > 0 ? explicitW : e2.size === "sm" ? 420 : e2.size === "md" ? 640 : e2.size === "xl" ? 1024 : e2.size === "full" ? "100%" : 800;
      const align = e2.align === "left" ? "justify-start" : e2.align === "right" ? "justify-end" : "justify-center";
      const ratio = e2.aspect === "4:3" ? "4 / 3" : e2.aspect === "1:1" ? "1 / 1" : e2.aspect === "auto" ? null : "16 / 9";
      const frame = e2.style === "frame";
      const shadow = e2.style === "shadow";
      const borderStyle = frame ? background === "dark" ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0" : "none";
      return /* @__PURE__ */ React3.createElement("div", { key: e2.id, className: `flex ${align}` }, /* @__PURE__ */ React3.createElement("div", { style: { width: "100%", maxWidth } }, /* @__PURE__ */ React3.createElement(
        "div",
        {
          className: `overflow-hidden ${e2.rounded === false ? "rounded-xl" : "rounded-3xl"} ${shadow ? "shadow-2xl" : ""}`,
          style: {
            border: borderStyle,
            aspectRatio: Number.isFinite(explicitH) && explicitH > 0 ? void 0 : ratio || void 0,
            height: Number.isFinite(explicitH) && explicitH > 0 ? explicitH : ratio ? void 0 : Number(e2.height) || 320,
            background: background === "dark" ? "rgba(255,255,255,0.06)" : "#f8fafc"
          }
        },
        /* @__PURE__ */ React3.createElement(
          "img",
          {
            src: getMediaUrl(e2.url),
            alt: e2.alt || "",
            className: "w-full h-full",
            style: { objectFit: e2.fit === "contain" ? "contain" : "cover" }
          }
        )
      )));
    }
    if (e2.type === "button") {
      const buttonVariant = e2.variant || "primary";
      const className = buttonVariant === "secondary" ? background === "dark" ? "px-8 py-3.5 bg-white/10 border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white/20 transition-all inline-flex" : "px-8 py-3.5 bg-secondary text-white rounded-full font-bold text-sm hover:bg-primary transition-all inline-flex" : "px-8 py-3.5 bg-primary text-white rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/30 inline-flex";
      const href = e2.href || "/contact";
      const align = e2.align === "center" ? "justify-center" : "justify-start";
      const Wrapper = ({ children }) => /* @__PURE__ */ React3.createElement("div", { className: `flex ${align}` }, children);
      if (href.startsWith("/")) {
        return /* @__PURE__ */ React3.createElement(Wrapper, { key: e2.id }, /* @__PURE__ */ React3.createElement(Link, { to: href, className }, e2.text));
      }
      return /* @__PURE__ */ React3.createElement(Wrapper, { key: e2.id }, /* @__PURE__ */ React3.createElement("a", { href, className, rel: "noreferrer" }, e2.text));
    }
    if (e2.type === "divider") {
      return /* @__PURE__ */ React3.createElement("div", { key: e2.id, className: `h-px w-full ${divider}` });
    }
    return null;
  })))));
}
function AboutAlraBlock({ data }) {
  const isRight = data.imagePosition === "right";
  const features = Array.isArray(data.features) ? data.features : [];
  return /* @__PURE__ */ React3.createElement("section", { className: "py-20 md:py-28 px-6 md:px-10 overflow-hidden relative bg-white" }, /* @__PURE__ */ React3.createElement("div", { className: "absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }), /* @__PURE__ */ React3.createElement("div", { className: "absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" }), /* @__PURE__ */ React3.createElement("div", { className: "max-w-6xl mx-auto" }, /* @__PURE__ */ React3.createElement("div", { className: `grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center ${isRight ? "" : ""}` }, /* @__PURE__ */ React3.createElement("div", { className: `space-y-6 relative z-10 ${isRight ? "md:order-2" : ""}` }, data.badge && /* @__PURE__ */ React3.createElement("p", { className: "text-xs font-bold text-primary uppercase tracking-[0.2em]" }, data.badge), data.heading && /* @__PURE__ */ React3.createElement("h2", { className: "text-3xl md:text-4xl lg:text-5xl font-black text-secondary leading-[1.1] tracking-tight" }, data.heading), /* @__PURE__ */ React3.createElement("div", { className: "w-12 h-1 bg-primary rounded-full" }), data.body && /* @__PURE__ */ React3.createElement("div", { className: "text-gray-500 text-sm md:text-base max-w-lg" }, /* @__PURE__ */ React3.createElement(Paragraphs, { text: data.body })), features.length > 0 && /* @__PURE__ */ React3.createElement("div", { className: "space-y-3 pt-1" }, features.map((feat, i) => {
    const text = typeof feat === "string" ? feat : feat.text || "";
    if (!text) return null;
    return /* @__PURE__ */ React3.createElement("div", { key: i, className: "flex items-center gap-4" }, /* @__PURE__ */ React3.createElement("div", { className: "w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0" }, /* @__PURE__ */ React3.createElement("svg", { className: "w-5 h-5 text-primary", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, /* @__PURE__ */ React3.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }))), /* @__PURE__ */ React3.createElement("p", { className: "text-sm font-bold text-secondary" }, text));
  })), data.buttonText && /* @__PURE__ */ React3.createElement("div", { className: "pt-2" }, (data.buttonLink || "").startsWith("/") ? /* @__PURE__ */ React3.createElement(Link, { to: data.buttonLink || "/over-ons", className: "inline-flex items-center gap-3 text-secondary font-bold text-sm group" }, /* @__PURE__ */ React3.createElement("span", { className: "border-b-2 border-secondary pb-0.5 group-hover:text-primary group-hover:border-primary transition-colors" }, data.buttonText), /* @__PURE__ */ React3.createElement("span", { className: "w-8 h-8 rounded-full bg-secondary group-hover:bg-primary flex items-center justify-center text-white text-xs transition-colors" }, "\u2192")) : /* @__PURE__ */ React3.createElement("a", { href: data.buttonLink || "#", className: "inline-flex items-center gap-3 text-secondary font-bold text-sm group" }, /* @__PURE__ */ React3.createElement("span", { className: "border-b-2 border-secondary pb-0.5 group-hover:text-primary group-hover:border-primary transition-colors" }, data.buttonText), /* @__PURE__ */ React3.createElement("span", { className: "w-8 h-8 rounded-full bg-secondary group-hover:bg-primary flex items-center justify-center text-white text-xs transition-colors" }, "\u2192")))), /* @__PURE__ */ React3.createElement("div", { className: `relative ${isRight ? "md:order-1" : ""}` }, data.imageUrl ? /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement("div", { className: "absolute -inset-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl blur-2xl" }), /* @__PURE__ */ React3.createElement("div", { className: "relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl" }, /* @__PURE__ */ React3.createElement(
    "img",
    {
      src: getMediaUrl(data.imageUrl),
      alt: data.heading || "",
      className: "w-full h-full object-cover"
    }
  ), /* @__PURE__ */ React3.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent" }))) : /* @__PURE__ */ React3.createElement("div", { className: "aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center" }, /* @__PURE__ */ React3.createElement("span", { className: "text-primary/20 text-6xl" }, "\u{1F3ED}")), data.statValue && /* @__PURE__ */ React3.createElement("div", { className: "absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-5 py-3 border border-gray-100 hidden md:block" }, /* @__PURE__ */ React3.createElement("p", { className: "text-2xl font-black text-primary" }, data.statValue), /* @__PURE__ */ React3.createElement("p", { className: "text-[10px] font-bold text-secondary uppercase tracking-wider" }, data.statLabel || "Ervaring"))))));
}
function ProductHighlightBlock({ data }) {
  const isRight = data.imagePosition === "right";
  const features = Array.isArray(data.features) ? data.features : [];
  return /* @__PURE__ */ React3.createElement("section", { className: "py-0 bg-white" }, /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch" }, /* @__PURE__ */ React3.createElement("div", { className: `relative overflow-hidden group ${isRight ? "lg:order-2" : ""}` }, data.imageUrl ? /* @__PURE__ */ React3.createElement("div", { className: "aspect-[4/3] lg:aspect-auto lg:h-full min-h-[320px]" }, /* @__PURE__ */ React3.createElement(
    "img",
    {
      src: getMediaUrl(data.imageUrl),
      alt: data.heading || "",
      className: "w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
    }
  )) : /* @__PURE__ */ React3.createElement("div", { className: "aspect-[4/3] lg:aspect-auto lg:h-full min-h-[320px] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center" }, /* @__PURE__ */ React3.createElement("span", { className: "text-primary/20 text-6xl" }, "\u{1F4E6}")), /* @__PURE__ */ React3.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-secondary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" }), data.badge && /* @__PURE__ */ React3.createElement("div", { className: "absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-secondary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest" }, data.badge)), /* @__PURE__ */ React3.createElement("div", { className: `flex flex-col justify-center px-8 py-12 lg:px-16 ${isRight ? "lg:order-1" : ""}` }, data.label && /* @__PURE__ */ React3.createElement("span", { className: "text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3" }, data.label), data.heading && /* @__PURE__ */ React3.createElement("h3", { className: "text-3xl md:text-4xl font-black text-secondary leading-tight mb-4" }, data.heading), data.body && /* @__PURE__ */ React3.createElement("div", { className: "text-gray-500 text-sm md:text-base mb-6 max-w-md" }, /* @__PURE__ */ React3.createElement(Paragraphs, { text: data.body })), features.length > 0 && /* @__PURE__ */ React3.createElement("div", { className: "flex flex-wrap gap-2 mb-8" }, features.map((feat, i) => /* @__PURE__ */ React3.createElement("span", { key: i, className: "inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-secondary text-[11px] font-bold px-3 py-1.5 rounded-full" }, /* @__PURE__ */ React3.createElement("span", { className: "w-1 h-1 bg-primary rounded-full" }), typeof feat === "string" ? feat : feat.text || feat.label || ""))), data.buttonText && /* @__PURE__ */ React3.createElement("div", null, (data.buttonLink || "").startsWith("/") ? /* @__PURE__ */ React3.createElement(Link, { to: data.buttonLink || "/producten", className: "group inline-flex items-center gap-3 text-primary font-bold text-sm" }, /* @__PURE__ */ React3.createElement("span", { className: "border-b-2 border-primary/30 pb-0.5 group-hover:border-primary transition-colors" }, data.buttonText), /* @__PURE__ */ React3.createElement("span", { className: "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs group-hover:bg-primary group-hover:text-white transition-all duration-300" }, "\u2192")) : /* @__PURE__ */ React3.createElement("a", { href: data.buttonLink || "#", className: "group inline-flex items-center gap-3 text-primary font-bold text-sm" }, /* @__PURE__ */ React3.createElement("span", { className: "border-b-2 border-primary/30 pb-0.5 group-hover:border-primary transition-colors" }, data.buttonText), /* @__PURE__ */ React3.createElement("span", { className: "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs group-hover:bg-primary group-hover:text-white transition-all duration-300" }, "\u2192"))))));
}
function CustomBlocks({ blocks = [] }) {
  const visible = blocks.filter((b) => b.visible !== false);
  if (!visible.length) return null;
  const blogPosts = visible.filter((b) => b.type === "blog_post");
  const otherBlocks = visible.filter((b) => b.type !== "blog_post");
  return /* @__PURE__ */ React3.createElement(React3.Fragment, null, otherBlocks.map((block) => {
    const { id, type, data } = block;
    switch (type) {
      case "banner":
        return /* @__PURE__ */ React3.createElement(BannerBlock, { key: id, data });
      case "text_block":
        return /* @__PURE__ */ React3.createElement(TextBlock, { key: id, data });
      case "feature_grid":
        return /* @__PURE__ */ React3.createElement(FeatureGrid, { key: id, data });
      case "image_text":
        return /* @__PURE__ */ React3.createElement(ImageTextBlock, { key: id, data });
      case "stats_row":
        return /* @__PURE__ */ React3.createElement(StatsRow, { key: id, data });
      case "cta_block":
        return /* @__PURE__ */ React3.createElement(CtaBlock, { key: id, data });
      case "steps":
        return /* @__PURE__ */ React3.createElement(StepsBlock, { key: id, data });
      case "layout_builder":
        return /* @__PURE__ */ React3.createElement(LayoutBuilderBlock, { key: id, data });
      case "product_highlight":
        return /* @__PURE__ */ React3.createElement(ProductHighlightBlock, { key: id, data });
      case "about_alra":
        return /* @__PURE__ */ React3.createElement(AboutAlraBlock, { key: id, data });
      default:
        return null;
    }
  }), blogPosts.length > 0 && /* @__PURE__ */ React3.createElement("section", { className: "py-20 px-6 bg-gray-50" }, /* @__PURE__ */ React3.createElement("div", { className: "max-w-6xl mx-auto" }, /* @__PURE__ */ React3.createElement("div", { className: "text-center mb-14" }, /* @__PURE__ */ React3.createElement("h2", { className: "text-4xl font-black text-gray-900" }, "Blog"), /* @__PURE__ */ React3.createElement("div", { className: "flex justify-center mt-4" }, /* @__PURE__ */ React3.createElement("div", { className: "h-1 w-16 rounded-full bg-primary" }))), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8" }, blogPosts.map((b) => /* @__PURE__ */ React3.createElement(BlogPostBlock, { key: b.id, data: b.data }))))));
}

// aldraled/src/pages/About.js
var API_URL2 = process.env.REACT_APP_API_URL || "http://localhost:5000";
var B = "#0B67D8";
var DEFAULTS = {
  eyebrow: "Over ons",
  title: "Kwaliteit, innovatie en ontwikkeling. ALRA werkt graag met u samen.",
  description: "Bij ALRA LED Solutions geloven we in verlichting die verder gaat. Voor professionals die elke dag het verschil maken.",
  image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=1600",
  values: [
    { icon: "\u26A1", title: "Vakmanschap", text: "Gedreven engineers betrokken bij ontwerp, techniek, duurzaamheid en functionaliteit. Van schets tot gecertificeerd eindproduct." },
    { icon: "\u{1F6E1}\uFE0F", title: "Kwaliteit & garantie", text: "Uitsluitend CE- en RoHS-gecertificeerde LED-producten. Volledige garantie op elk product dat wij leveren." },
    { icon: "\u{1F4AC}", title: "Persoonlijk advies", text: "Loopt u in het werkveld tegen een probleem aan? Wij komen graag langs om samen tot de beste oplossing te komen." }
  ]
};
var IMG = {
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600",
  van: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=1600",
  hefbrug: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1600",
  werkplaats: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1200",
  constructie: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=1600"
};
var CAT_FALLBACK = {
  "bedrijfswagenverlichting": IMG.van,
  "bouwlichtslangen-en-toebehoren": IMG.constructie,
  "led-hefbrugverlichting": IMG.hefbrug,
  "led-draagbare-werkverlichting": IMG.werkplaats,
  "veiligheidsverlichting": IMG.constructie
};
var ALL_FALLBACK = "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=1600";
var HeroUsps = [
  { icon: "truck", title: "Snel geleverd", text: "Direct leverbaar" },
  { icon: "shield", title: "Professionele kwaliteit", text: "Geselecteerd voor de praktijk" },
  { icon: "chat", title: "Persoonlijk advies", text: "Direct contact, korte lijnen" }
];
var TrustBar = [
  { icon: "package", title: "Professionele LED-oplossingen", text: "Voor zakelijke klanten" },
  { icon: "grid", title: "Breed assortiment", text: "Voor verschillende toepassingen" },
  { icon: "truck", title: "Snelle levering", text: "Uit eigen voorraad" },
  { icon: "chat", title: "Persoonlijk advies", text: "Direct contact" }
];
var WhyCards = [
  { num: "01", icon: "gem", title: "Kwaliteit", text: "Betrouwbare verlichting die ontwikkeld is voor intensief professioneel gebruik." },
  { num: "02", icon: "bolt", title: "Snelheid", text: "Veel producten direct uit voorraad leverbaar, zodat je snel verder kunt." },
  { num: "03", icon: "book", title: "Kennis", text: "Geen algemene verkooppraatjes, maar praktisch advies passend bij de toepassing." },
  { num: "04", icon: "headphones", title: "Service", text: "Korte lijnen, duidelijke communicatie en persoonlijk contact." }
];
var ApproachSteps = [
  { num: "01", title: "Vertel ons wat je nodig hebt", text: "U geeft uw wensen of toepassing door." },
  { num: "02", title: "Wij adviseren de juiste oplossing", text: "Op basis van onze kennis en ervaring." },
  { num: "03", title: "Snel geleverd en klaar voor gebruik", text: "Zodat u direct verder kunt." }
];
var GroothandelTrust = [
  { icon: "stock", title: "Ruime voorraad", text: "Direct leverbaar" },
  { icon: "percent", title: "Zakelijke condities", text: "Scherpe afspraken" },
  { icon: "chat", title: "Persoonlijk contact", text: "Wij denken met je mee" }
];
var Ic = ({ className = "w-5 h-5", children }) => /* @__PURE__ */ React4.createElement("svg", { className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }, children);
var IconTruck = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("rect", { x: "1", y: "3", width: "15", height: "13", rx: "1" }), /* @__PURE__ */ React4.createElement("path", { d: "M16 8h4l3 3v5h-7V8z" }), /* @__PURE__ */ React4.createElement("circle", { cx: "5.5", cy: "18.5", r: "2.5" }), /* @__PURE__ */ React4.createElement("circle", { cx: "18.5", cy: "18.5", r: "2.5" }));
var IconShield = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }));
var IconChat = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }));
var IconPackage = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }), /* @__PURE__ */ React4.createElement("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }), /* @__PURE__ */ React4.createElement("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" }));
var IconGrid = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React4.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React4.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React4.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }));
var IconBolt = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }));
var IconBook = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" }), /* @__PURE__ */ React4.createElement("path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" }));
var IconHeadphones = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("path", { d: "M3 18v-6a9 9 0 0 1 18 0v6" }), /* @__PURE__ */ React4.createElement("path", { d: "M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" }));
var IconGem = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("polygon", { points: "6 3 18 3 22 9 12 22 2 9" }), /* @__PURE__ */ React4.createElement("path", { d: "M2 9h20M12 3l-2.5 6L12 22l2.5-13L12 3z" }));
var IconArrow = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }), /* @__PURE__ */ React4.createElement("polyline", { points: "12 5 19 12 12 19" }));
var IconStock = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("path", { d: "M3 3v18h18" }), /* @__PURE__ */ React4.createElement("path", { d: "M7 14l3-4 3 3 4-6" }));
var IconPercent = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("line", { x1: "19", y1: "5", x2: "5", y2: "19" }), /* @__PURE__ */ React4.createElement("circle", { cx: "6.5", cy: "6.5", r: "2.5" }), /* @__PURE__ */ React4.createElement("circle", { cx: "17.5", cy: "17.5", r: "2.5" }));
var IconQuote = (p) => /* @__PURE__ */ React4.createElement(Ic, { ...p }, /* @__PURE__ */ React4.createElement("path", { d: "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" }), /* @__PURE__ */ React4.createElement("path", { d: "M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" }));
var ICONMAP = {
  truck: IconTruck,
  shield: IconShield,
  chat: IconChat,
  package: IconPackage,
  grid: IconGrid,
  bolt: IconBolt,
  book: IconBook,
  headphones: IconHeadphones,
  gem: IconGem,
  arrow: IconArrow,
  stock: IconStock,
  percent: IconPercent,
  quote: IconQuote
};
var Eyebrow = ({ children, light }) => /* @__PURE__ */ React4.createElement("span", { className: `inline-flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] ${light ? "text-white/80" : "text-primary"}` }, /* @__PURE__ */ React4.createElement("span", { className: `h-px w-8 ${light ? "bg-white/40" : `bg-[#0B67D8]`}` }), children);
var SectionTitle = ({ children, light }) => /* @__PURE__ */ React4.createElement("h2", { className: `mt-4 text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.05] tracking-tight ${light ? "text-white" : "text-secondary"}` }, children);
var renderHighlight = (text) => {
  const parts = String(text || "").split(/(ALRA)/g);
  return parts.map(
    (part, i) => part.toLowerCase() === "alra" ? /* @__PURE__ */ React4.createElement("span", { key: i, style: { color: B } }, part) : /* @__PURE__ */ React4.createElement("span", { key: i }, part)
  );
};
var About = () => {
  const { i18n } = useTranslation();
  const [data, setData] = useState2(DEFAULTS);
  const [blocks, setBlocks] = useState2([]);
  const [categories, setCategories] = useState2([]);
  const [products, setProducts] = useState2([]);
  useEffect2(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || "nl").split("-")[0];
    axios2.get(`${API_URL2}/api/content/about`, { params: { lang } }).then((res) => setData({ ...DEFAULTS, ...res.data })).catch(() => {
    });
    axios2.get(`${API_URL2}/api/content/page_blocks_about`, { params: { lang } }).then((res) => setBlocks(Array.isArray(res.data) ? res.data : [])).catch(() => setBlocks([]));
    axios2.get(`${API_URL2}/api/products/categories/all`).then((res) => setCategories(Array.isArray(res.data) ? res.data : [])).catch(() => {
    });
    axios2.get(`${API_URL2}/api/products`).then((res) => setProducts(Array.isArray(res.data) ? res.data : [])).catch(() => {
    });
  }, [i18n.resolvedLanguage, i18n.language]);
  const values = Array.isArray(data.values) && data.values.length > 0 ? data.values : DEFAULTS.values;
  const firstProductImage = (p) => {
    const img = p && p.images && p.images[0] && p.images[0].url || p && p.imageUrl || "";
    return img || "";
  };
  const catImages = useMemo3(() => {
    const map = {};
    categories.forEach((cat) => {
      const match = products.find((p) => p.categoryId === cat.id && firstProductImage(p));
      map[cat.id] = match ? firstProductImage(match) : null;
    });
    return map;
  }, [categories, products]);
  const pickProduct = (frag) => products.find((p) => String(p.category || "").toLowerCase().includes(frag) && firstProductImage(p));
  const filmImg = firstProductImage(pickProduct("bedrijfswagen")) || IMG.van;
  const lampImg = firstProductImage(pickProduct("draagbare")) || IMG.werkplaats;
  const bouwImg = firstProductImage(pickProduct("bouw")) || IMG.constructie;
  const vanImg = firstProductImage(pickProduct("bedrijfswagen")) || IMG.van;
  const heroImg = getMediaUrl(data.image) || IMG.office;
  const introImg = heroImg;
  const warehouseImg = bouwImg || IMG.constructie;
  const storyBig = heroImg;
  const storyA = lampImg;
  const storyB = vanImg || IMG.van;
  const quoteBg = filmImg;
  const ctaImg = firstProductImage(pickProduct("bedrijfswagen")) || IMG.van;
  const heroIntro = String(data.description || "").toLowerCase().includes(String(data.title || "").slice(0, 30).toLowerCase()) ? "Bij ALRA LED Solutions geloven we in verlichting die verder gaat. Voor professionals die elke dag het verschil maken." : data.description;
  return /* @__PURE__ */ React4.createElement("div", { className: "bg-white" }, /* @__PURE__ */ React4.createElement("section", { className: "relative overflow-hidden bg-white" }, /* @__PURE__ */ React4.createElement("div", { className: "hidden lg:block absolute inset-y-0 right-0 w-[57%]" }, /* @__PURE__ */ React4.createElement("img", { src: heroImg, alt: "ALRA LED Solutions", className: "w-full h-full object-cover", loading: "eager", decoding: "async" }), /* @__PURE__ */ React4.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" })), /* @__PURE__ */ React4.createElement("div", { className: "relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:min-h-[640px] items-center" }, /* @__PURE__ */ React4.createElement("div", { className: "max-w-xl space-y-6" }, /* @__PURE__ */ React4.createElement(Eyebrow, null, "Over Alra"), /* @__PURE__ */ React4.createElement("h1", { className: "text-[clamp(2.1rem,4.8vw,4.4rem)] font-extrabold leading-[1.04] tracking-tight text-secondary" }, renderHighlight(data.title)), /* @__PURE__ */ React4.createElement("p", { className: "text-[17px] leading-relaxed text-slate-500 max-w-lg" }, heroIntro), /* @__PURE__ */ React4.createElement("div", { className: "flex flex-col sm:flex-row gap-3 pt-1" }, /* @__PURE__ */ React4.createElement(
    Link2,
    {
      to: ROUTES.shop,
      className: "inline-flex items-center justify-center gap-2 bg-[#0B67D8] text-white font-bold text-sm px-7 py-3.5 rounded-[10px] hover:brightness-110 transition-all shadow-lg shadow-[#0B67D8]/25"
    },
    "Bekijk ons assortiment ",
    /* @__PURE__ */ React4.createElement(IconArrow, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React4.createElement(
    Link2,
    {
      to: ROUTES.contact,
      className: "inline-flex items-center justify-center gap-2 border border-slate-200 text-secondary font-bold text-sm px-7 py-3.5 rounded-[10px] bg-white hover:border-[#0B67D8]/40 hover:text-[#0B67D8] transition-all"
    },
    "Neem contact op"
  )), /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4 lg:pt-6" }, HeroUsps.map((u) => {
    const Icon = ICONMAP[u.icon];
    return /* @__PURE__ */ React4.createElement("div", { key: u.title, className: "flex items-center gap-2.5" }, /* @__PURE__ */ React4.createElement("span", { className: "w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0", style: { background: B } }, /* @__PURE__ */ React4.createElement(Icon, { className: "w-[18px] h-[18px]" })), /* @__PURE__ */ React4.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React4.createElement("p", { className: "text-[13px] font-bold text-secondary leading-tight" }, u.title), /* @__PURE__ */ React4.createElement("p", { className: "text-[11px] text-slate-400 leading-tight mt-0.5" }, u.text)));
  }))), /* @__PURE__ */ React4.createElement("div", { className: "lg:hidden" }, /* @__PURE__ */ React4.createElement("div", { className: "aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-slate-100" }, /* @__PURE__ */ React4.createElement("img", { src: heroImg, alt: "ALRA LED Solutions", className: "w-full h-full object-cover", loading: "eager", decoding: "async" }))))), /* @__PURE__ */ React4.createElement("section", { className: "bg-[#F5F8FC] border-y border-[#E4EAF1]" }, /* @__PURE__ */ React4.createElement("div", { className: "max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10" }, /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#E4EAF1]" }, TrustBar.map((t2, i) => {
    const Icon = ICONMAP[t2.icon];
    return /* @__PURE__ */ React4.createElement("div", { key: t2.title, className: `flex items-center gap-3 py-6 px-3 sm:px-6 ${i >= 2 ? "border-t lg:border-t-0 border-[#E4EAF1]" : ""}` }, /* @__PURE__ */ React4.createElement("span", { className: "w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-[#E4EAF1] text-slate-500 shrink-0" }, /* @__PURE__ */ React4.createElement(Icon, { className: "w-5 h-5" })), /* @__PURE__ */ React4.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React4.createElement("p", { className: "text-[13px] font-bold text-secondary leading-tight" }, t2.title), /* @__PURE__ */ React4.createElement("p", { className: "text-[11px] text-slate-400 leading-tight mt-0.5" }, t2.text)));
  })))), /* @__PURE__ */ React4.createElement("section", { className: "py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-white" }, /* @__PURE__ */ React4.createElement("div", { className: "max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center" }, /* @__PURE__ */ React4.createElement("div", { className: "relative" }, /* @__PURE__ */ React4.createElement("div", { className: "aspect-[4/3] rounded-[18px] overflow-hidden shadow-[0_20px_50px_-20px_rgba(7,27,54,0.25)] border border-[#E4EAF1]" }, /* @__PURE__ */ React4.createElement("img", { src: introImg, alt: "Medewerkers van ALRA LED Solutions aan het werk", className: "w-full h-full object-cover", loading: "lazy", decoding: "async" })), /* @__PURE__ */ React4.createElement("div", { className: "absolute -bottom-5 right-5 bg-[#07192D] rounded-2xl px-6 py-4 shadow-xl hidden md:flex items-center gap-3" }, /* @__PURE__ */ React4.createElement("span", { className: "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0", style: { background: B } }, /* @__PURE__ */ React4.createElement(IconShield, { className: "w-5 h-5" })), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("p", { className: "text-white font-extrabold text-sm leading-none" }, "Professionele kwaliteit"), /* @__PURE__ */ React4.createElement("p", { className: "text-white/50 text-[11px] mt-1" }, "Geselecteerd voor de praktijk")))), /* @__PURE__ */ React4.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React4.createElement(Eyebrow, null, "Wie wij zijn"), /* @__PURE__ */ React4.createElement("h2", { className: "mt-4 text-[clamp(1.9rem,3.4vw,2.9rem)] font-extrabold leading-[1.06] tracking-tight text-secondary" }, "Meer dan alleen", /* @__PURE__ */ React4.createElement("br", null), "LED-verlichting"), /* @__PURE__ */ React4.createElement("div", { className: "space-y-4 text-[15px] leading-relaxed text-slate-500" }, /* @__PURE__ */ React4.createElement("p", null, "Bij ALRA draait het niet alleen om een lamp. Het gaat om verlichting die in de praktijk moet presteren. Of het nu gaat om een bedrijfswagen, werkplaats, bouwplaats of industri\xEBle omgeving: onze oplossingen zijn geselecteerd voor professioneel en intensief gebruik."), /* @__PURE__ */ React4.createElement("p", null, "Wij combineren een breed assortiment met korte lijnen, persoonlijk advies en snelle levering. Zo helpen we professionals aan verlichting waarop ze iedere werkdag kunnen vertrouwen.")), /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2" }, values.map((v, i) => /* @__PURE__ */ React4.createElement("div", { key: v.title || i, className: "rounded-2xl border border-[#E4EAF1] bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200" }, /* @__PURE__ */ React4.createElement("span", { className: "w-10 h-10 rounded-xl flex items-center justify-center text-white text-base shrink-0", style: { background: B } }, /* @__PURE__ */ React4.createElement("span", null, v.icon || ["\u26A1", "\u{1F6E1}\uFE0F", "\u{1F4AC}"][i])), /* @__PURE__ */ React4.createElement("p", { className: "text-[13px] font-bold text-secondary mt-3 leading-tight" }, v.title))))))), /* @__PURE__ */ React4.createElement("section", { className: "py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-[#F5F8FC]" }, /* @__PURE__ */ React4.createElement("div", { className: "max-w-[1240px] mx-auto" }, /* @__PURE__ */ React4.createElement("div", { className: "text-center max-w-2xl mx-auto" }, /* @__PURE__ */ React4.createElement("div", { className: "inline-flex items-center justify-center" }, /* @__PURE__ */ React4.createElement(Eyebrow, null, "Onze kracht")), /* @__PURE__ */ React4.createElement(SectionTitle, null, "Waarom professionals voor ALRA kiezen")), /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12" }, WhyCards.map((c) => {
    const Icon = ICONMAP[c.icon];
    return /* @__PURE__ */ React4.createElement("div", { key: c.num, className: "group relative bg-white rounded-2xl border border-[#E4EAF1] p-7 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_-18px_rgba(7,27,54,0.25)]" }, /* @__PURE__ */ React4.createElement("span", { className: "absolute top-6 right-6 text-[13px] font-black text-[#0B67D8]/30 group-hover:text-[#0B67D8]/60 transition-colors" }, c.num), /* @__PURE__ */ React4.createElement("span", { className: "w-12 h-12 rounded-xl flex items-center justify-center text-[#0B67D8] bg-[#0B67D8]/10 group-hover:bg-[#0B67D8] group-hover:text-white transition-colors duration-200" }, /* @__PURE__ */ React4.createElement(Icon, { className: "w-5 h-5" })), /* @__PURE__ */ React4.createElement("h3", { className: "text-lg font-extrabold text-secondary mt-5" }, c.title), /* @__PURE__ */ React4.createElement("p", { className: "text-sm text-slate-500 leading-relaxed mt-2" }, c.text));
  })))), /* @__PURE__ */ React4.createElement("section", { className: "py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-[#07192D] relative overflow-hidden" }, /* @__PURE__ */ React4.createElement("div", { className: "absolute inset-0 opacity-[0.07]" }, /* @__PURE__ */ React4.createElement("img", { src: quoteBg, alt: "", "aria-hidden": "true", className: "w-full h-full object-cover", loading: "lazy", decoding: "async" })), /* @__PURE__ */ React4.createElement("div", { className: "relative max-w-[1280px] mx-auto" }, /* @__PURE__ */ React4.createElement("div", { className: "flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6" }, /* @__PURE__ */ React4.createElement("div", { className: "max-w-2xl" }, /* @__PURE__ */ React4.createElement(Eyebrow, { light: true }, "Toepassingen"), /* @__PURE__ */ React4.createElement(SectionTitle, { light: true }, "Verlichting voor elke professionele toepassing"), /* @__PURE__ */ React4.createElement("p", { className: "text-white/55 text-[15px] leading-relaxed mt-4 max-w-xl" }, "Ontdek ons assortiment voor uw branche. Betrouwbare LED-oplossingen, geselecteerd voor de praktijk.")), /* @__PURE__ */ React4.createElement(Link2, { to: ROUTES.shop, className: "inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-bold shrink-0 group" }, "Bekijk alle producten ", /* @__PURE__ */ React4.createElement(IconArrow, { className: "w-4 h-4 group-hover:translate-x-1 transition-transform" }))), /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-12" }, categories.length === 0 && ["Bedrijfswagenverlichting", "Bouwlichtslangen en toebehoren", "LED Hefbrugverlichting", "LED draagbare werkverlichting", "Veiligheidsverlichting"].map((name) => /* @__PURE__ */ React4.createElement("div", { key: name, className: "aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 animate-pulse" })), categories.map((cat) => {
    const img = getMediaUrl(catImages[cat.id]) || CAT_FALLBACK[cat.slug] || ALL_FALLBACK;
    return /* @__PURE__ */ React4.createElement(
      Link2,
      {
        key: cat.id,
        to: shopWithCategory(cat),
        className: "group bg-white rounded-2xl overflow-hidden border border-white/10 hover:-translate-y-1 transition-all duration-200"
      },
      /* @__PURE__ */ React4.createElement("div", { className: "aspect-[16/11] overflow-hidden bg-slate-100" }, /* @__PURE__ */ React4.createElement("img", { src: img, alt: cat.name, className: "w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-300", loading: "lazy", decoding: "async" })),
      /* @__PURE__ */ React4.createElement("div", { className: "p-4" }, /* @__PURE__ */ React4.createElement("h3", { className: "text-[14px] font-extrabold text-secondary leading-snug" }, cat.name), /* @__PURE__ */ React4.createElement("p", { className: "text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2" }, cat.description || "Functioneel, veilig en duurzaam"), /* @__PURE__ */ React4.createElement("span", { className: "inline-flex items-center gap-1 text-[12px] font-bold text-[#0B67D8] mt-3" }, "Bekijk ", /* @__PURE__ */ React4.createElement(IconArrow, { className: "w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" })))
    );
  })))), /* @__PURE__ */ React4.createElement(CustomBlocks, { blocks: blocks.filter((b) => (b.mount || "bottom") === "top") }), /* @__PURE__ */ React4.createElement("section", { className: "py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-white" }, /* @__PURE__ */ React4.createElement("div", { className: "max-w-[1240px] mx-auto" }, /* @__PURE__ */ React4.createElement("div", { className: "rounded-[24px] overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-[0_30px_70px_-30px_rgba(7,27,54,0.35)]" }, /* @__PURE__ */ React4.createElement("div", { className: "relative bg-[#07192D] px-8 md:px-12 py-12 md:py-16 flex flex-col justify-center overflow-hidden" }, /* @__PURE__ */ React4.createElement("div", { className: "absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#0B67D8]/20 blur-3xl" }), /* @__PURE__ */ React4.createElement("div", { className: "relative space-y-6" }, /* @__PURE__ */ React4.createElement(Eyebrow, { light: true }, "Groothandel LED-verlichting"), /* @__PURE__ */ React4.createElement("h2", { className: "text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold leading-[1.06] tracking-tight text-white" }, "Zakelijke LED-verlichting", /* @__PURE__ */ React4.createElement("br", null), "zonder gedoe"), /* @__PURE__ */ React4.createElement("div", { className: "space-y-3 text-white/60 text-[14px] leading-relaxed" }, /* @__PURE__ */ React4.createElement("p", null, "ALRA levert LED-verlichting aan bedrijven en professionals die kwaliteit, betrouwbaarheid en scherpe zakelijke condities zoeken."), /* @__PURE__ */ React4.createElement("p", null, "Van enkele armaturen tot grotere aantallen: wij denken mee over de juiste oplossing voor jouw toepassing. Heb je grotere aantallen nodig of een specifieke vraag? Neem contact met ons op voor persoonlijk advies of een passende zakelijke offerte.")), /* @__PURE__ */ React4.createElement(
    Link2,
    {
      to: ROUTES.contact,
      className: "inline-flex items-center justify-center gap-2 bg-[#0B67D8] text-white font-bold text-sm px-7 py-3.5 rounded-[10px] hover:brightness-110 transition-all shadow-lg shadow-[#0B67D8]/30"
    },
    "Neem contact op ",
    /* @__PURE__ */ React4.createElement(IconArrow, { className: "w-4 h-4" })
  ))), /* @__PURE__ */ React4.createElement("div", { className: "relative min-h-[300px] lg:min-h-[480px]" }, /* @__PURE__ */ React4.createElement("img", { src: warehouseImg, alt: "Magazijn en voorraad van ALRA LED", className: "absolute inset-0 w-full h-full object-cover", loading: "lazy", decoding: "async" }), /* @__PURE__ */ React4.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:bg-gradient-to-r lg:from-black/30 lg:to-transparent" }))), /* @__PURE__ */ React4.createElement("div", { className: "relative z-10 -mt-8 lg:-mt-10 mx-auto lg:max-w-3xl px-2" }, /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-2xl border border-[#E4EAF1] shadow-[0_20px_50px_-20px_rgba(7,27,54,0.3)] p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E4EAF1]" }, GroothandelTrust.map((t2) => {
    const Icon = ICONMAP[t2.icon];
    return /* @__PURE__ */ React4.createElement("div", { key: t2.title, className: "flex items-center gap-3 px-4 py-3" }, /* @__PURE__ */ React4.createElement("span", { className: "w-9 h-9 rounded-lg flex items-center justify-center text-[#0B67D8] bg-[#0B67D8]/10 shrink-0" }, /* @__PURE__ */ React4.createElement(Icon, { className: "w-[18px] h-[18px]" })), /* @__PURE__ */ React4.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React4.createElement("p", { className: "text-[13px] font-bold text-secondary leading-tight" }, t2.title), /* @__PURE__ */ React4.createElement("p", { className: "text-[11px] text-slate-400 leading-tight mt-0.5" }, t2.text)));
  }))))), /* @__PURE__ */ React4.createElement("section", { className: "py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-[#F5F8FC] border-y border-[#E4EAF1]" }, /* @__PURE__ */ React4.createElement("div", { className: "max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4" }, /* @__PURE__ */ React4.createElement("div", { className: "relative rounded-[18px] overflow-hidden min-h-[320px] lg:min-h-[520px]" }, /* @__PURE__ */ React4.createElement("img", { src: storyBig, alt: "ALRA LED in de praktijk voor vakmensen", className: "absolute inset-0 w-full h-full object-cover", loading: "lazy", decoding: "async" }), /* @__PURE__ */ React4.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" }), /* @__PURE__ */ React4.createElement("div", { className: "absolute bottom-0 left-0 p-6" }, /* @__PURE__ */ React4.createElement("p", { className: "text-white font-extrabold text-xl leading-tight" }, "Praktische oplossingen", /* @__PURE__ */ React4.createElement("br", null), "voor echte vakmensen"))), /* @__PURE__ */ React4.createElement("div", { className: "grid grid-rows-2 gap-4" }, /* @__PURE__ */ React4.createElement("div", { className: "relative rounded-[18px] overflow-hidden min-h-[200px]" }, /* @__PURE__ */ React4.createElement("img", { src: storyA, alt: "ALRA LED werklamp", className: "absolute inset-0 w-full h-full object-cover", loading: "lazy", decoding: "async", style: { objectPosition: "center" } })), /* @__PURE__ */ React4.createElement("div", { className: "relative rounded-[18px] overflow-hidden min-h-[200px]" }, /* @__PURE__ */ React4.createElement("img", { src: storyB, alt: "ALRA LED bedrijfswagenverlichting", className: "absolute inset-0 w-full h-full object-cover", loading: "lazy", decoding: "async" }))))), /* @__PURE__ */ React4.createElement("section", { className: "py-16 lg:py-24 px-5 sm:px-8 lg:px-10 bg-white" }, /* @__PURE__ */ React4.createElement("div", { className: "max-w-[1240px] mx-auto" }, /* @__PURE__ */ React4.createElement("div", { className: "text-center max-w-2xl mx-auto" }, /* @__PURE__ */ React4.createElement("div", { className: "inline-flex items-center justify-center" }, /* @__PURE__ */ React4.createElement(Eyebrow, null, "Onze aanpak")), /* @__PURE__ */ React4.createElement(SectionTitle, null, "Van vraag naar de juiste verlichting")), /* @__PURE__ */ React4.createElement("div", { className: "relative mt-16" }, /* @__PURE__ */ React4.createElement("div", { className: "hidden lg:block absolute top-[26px] left-[18%] right-[18%] h-px bg-[#E4EAF1]" }), /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-10" }, ApproachSteps.map((s) => /* @__PURE__ */ React4.createElement("div", { key: s.num, className: "relative text-center lg:px-2" }, /* @__PURE__ */ React4.createElement("span", { className: "relative z-10 inline-flex items-center justify-center w-[52px] h-[52px] rounded-2xl text-white font-extrabold text-base", style: { background: B, boxShadow: "0 10px 24px rgba(11,103,216,0.35)" } }, s.num), /* @__PURE__ */ React4.createElement("h3", { className: "text-lg font-extrabold text-secondary mt-5 leading-snug" }, s.title), /* @__PURE__ */ React4.createElement("p", { className: "text-sm text-slate-500 leading-relaxed mt-2 max-w-xs mx-auto" }, s.text))))))), /* @__PURE__ */ React4.createElement("section", { className: "relative py-24 lg:py-32 px-5 sm:px-8 lg:px-10 overflow-hidden bg-[#07192D]" }, /* @__PURE__ */ React4.createElement("img", { src: quoteBg, alt: "", "aria-hidden": "true", className: "absolute inset-0 w-full h-full object-cover opacity-25", loading: "lazy", decoding: "async" }), /* @__PURE__ */ React4.createElement("div", { className: "absolute inset-0 bg-gradient-to-b from-[#07192D]/80 via-[#07192D]/50 to-[#07192D]/90" }), /* @__PURE__ */ React4.createElement("div", { className: "relative max-w-3xl mx-auto text-center" }, /* @__PURE__ */ React4.createElement("span", { className: "inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B67D8]/20 text-[#0B67D8] mb-8" }, /* @__PURE__ */ React4.createElement(IconQuote, { className: "w-6 h-6" })), /* @__PURE__ */ React4.createElement("blockquote", { className: "text-[clamp(1.5rem,3vw,2.4rem)] font-extrabold leading-[1.15] text-white tracking-tight" }, "\u201CGoede verlichting merk je pas echt wanneer je zonder nadenken door kunt werken.\u201D"), /* @__PURE__ */ React4.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.3em] text-white/50 mt-8" }, "Alra Led Solutions"))), /* @__PURE__ */ React4.createElement("section", { className: "py-16 lg:py-20 px-5 sm:px-8 lg:px-10 bg-white" }, /* @__PURE__ */ React4.createElement("div", { className: "max-w-[1240px] mx-auto" }, /* @__PURE__ */ React4.createElement("div", { className: "rounded-[18px] overflow-hidden border border-[#E4EAF1] bg-[#F5F8FC] grid grid-cols-1 lg:grid-cols-[1fr_auto]" }, /* @__PURE__ */ React4.createElement("div", { className: "px-8 md:px-12 py-10 md:py-12" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-[clamp(1.7rem,3vw,2.5rem)] font-extrabold leading-[1.06] tracking-tight text-secondary" }, "De juiste verlichting", /* @__PURE__ */ React4.createElement("br", null), "voor jouw toepassing?"), /* @__PURE__ */ React4.createElement("p", { className: "text-slate-500 text-[15px] leading-relaxed mt-3 max-w-lg" }, "Vertel ons waar je verlichting voor nodig hebt. We denken graag mee over de beste oplossing."), /* @__PURE__ */ React4.createElement("div", { className: "flex flex-col sm:flex-row gap-3 mt-7" }, /* @__PURE__ */ React4.createElement(Link2, { to: ROUTES.shop, className: "inline-flex items-center justify-center gap-2 bg-[#0B67D8] text-white font-bold text-sm px-7 py-3.5 rounded-[10px] hover:brightness-110 transition-all shadow-lg shadow-[#0B67D8]/25" }, "Bekijk producten ", /* @__PURE__ */ React4.createElement(IconArrow, { className: "w-4 h-4" })), /* @__PURE__ */ React4.createElement(Link2, { to: ROUTES.contact, className: "inline-flex items-center justify-center gap-2 border border-slate-300 bg-white text-secondary font-bold text-sm px-7 py-3.5 rounded-[10px] hover:border-[#0B67D8]/40 hover:text-[#0B67D8] transition-all" }, "Contact opnemen"))), /* @__PURE__ */ React4.createElement("div", { className: "hidden lg:flex items-center justify-center lg:w-[320px]" }, /* @__PURE__ */ React4.createElement("div", { className: "w-56 h-56 rounded-xl overflow-hidden rotate-2" }, /* @__PURE__ */ React4.createElement("img", { src: ctaImg, alt: "LED bedrijfswagenverlichting van ALRA", className: "w-full h-full object-cover", loading: "lazy", decoding: "async" })))))), /* @__PURE__ */ React4.createElement(CustomBlocks, { blocks: blocks.filter((b) => (b.mount || "bottom") === "bottom") }));
};
var About_default = About;
export {
  About_default as default
};
/*! Bundled license information:

use-sync-external-store/cjs/use-sync-external-store-shim.development.js:
  (**
   * @license React
   * use-sync-external-store-shim.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/

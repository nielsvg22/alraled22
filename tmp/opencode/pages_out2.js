var __defProp = Object.defineProperty;
var __export = (target, all3) => {
  for (var name in all3)
    __defProp(target, name, { get: all3[name], enumerable: true });
};

// crm-frontend/src/pages/Pages.jsx
import React2, { useState as useState2, useEffect as useEffect2, useRef as useRef2 } from "react";

// crm-frontend/node_modules/axios/lib/helpers/bind.js
function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}

// crm-frontend/node_modules/axios/lib/utils.js
var { toString } = Object.prototype;
var { getPrototypeOf } = Object;
var { iterator, toStringTag } = Symbol;
var kindOf = /* @__PURE__ */ ((cache) => (thing) => {
  const str = toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
var kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type;
};
var typeOfTest = (type) => (thing) => typeof thing === type;
var { isArray } = Array;
var isUndefined = typeOfTest("undefined");
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
var isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
var isString = typeOfTest("string");
var isFunction = typeOfTest("function");
var isNumber = typeOfTest("number");
var isObject = (thing) => thing !== null && typeof thing === "object";
var isBoolean = (thing) => thing === true || thing === false;
var isPlainObject = (val) => {
  if (kindOf(val) !== "object") {
    return false;
  }
  const prototype2 = getPrototypeOf(val);
  return (prototype2 === null || prototype2 === Object.prototype || Object.getPrototypeOf(prototype2) === null) && !(toStringTag in val) && !(iterator in val);
};
var isEmptyObject = (val) => {
  if (!isObject(val) || isBuffer(val)) {
    return false;
  }
  try {
    return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
  } catch (e) {
    return false;
  }
};
var isDate = kindOfTest("Date");
var isFile = kindOfTest("File");
var isBlob = kindOfTest("Blob");
var isFileList = kindOfTest("FileList");
var isStream = (val) => isObject(val) && isFunction(val.pipe);
var isFormData = (thing) => {
  let kind;
  return thing && (typeof FormData === "function" && thing instanceof FormData || isFunction(thing.append) && ((kind = kindOf(thing)) === "formdata" || // detect form-data instance
  kind === "object" && isFunction(thing.toString) && thing.toString() === "[object FormData]"));
};
var isURLSearchParams = kindOfTest("URLSearchParams");
var [isReadableStream, isRequest, isResponse, isHeaders] = [
  "ReadableStream",
  "Request",
  "Response",
  "Headers"
].map(kindOfTest);
var trim = (str) => str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function forEach(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    if (isBuffer(obj)) {
      return;
    }
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function findKey(obj, key) {
  if (isBuffer(obj)) {
    return null;
  }
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
var _global = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
})();
var isContextDefined = (context) => !isUndefined(context) && context !== _global;
function merge() {
  const { caseless, skipUndefined } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return;
    }
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else if (!skipUndefined || !isUndefined(val)) {
      result[targetKey] = val;
    }
  };
  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach(arguments[i], assignValue);
  }
  return result;
}
var extend = (a, b, thisArg, { allOwnKeys } = {}) => {
  forEach(
    b,
    (val, key) => {
      if (thisArg && isFunction(val)) {
        Object.defineProperty(a, key, {
          value: bind(val, thisArg),
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(a, key, {
          value: val,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    },
    { allOwnKeys }
  );
  return a;
};
var stripBOM = (content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
};
var inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(
    superConstructor.prototype,
    descriptors
  );
  Object.defineProperty(constructor.prototype, "constructor", {
    value: constructor,
    writable: true,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(constructor, "super", {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};
var toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null) return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
};
var endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};
var toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};
var isTypedArray = /* @__PURE__ */ ((TypedArray) => {
  return (thing) => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
var forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];
  const _iterator = generator.call(obj);
  let result;
  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};
var matchAll = (regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
};
var isHTMLForm = kindOfTest("HTMLFormElement");
var toCamelCase = (str) => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer(m, p1, p2) {
    return p1.toUpperCase() + p2;
  });
};
var hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
var isRegExp = kindOfTest("RegExp");
var reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
};
var freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    if (isFunction(obj) && ["arguments", "caller", "callee"].indexOf(name) !== -1) {
      return false;
    }
    const value = obj[name];
    if (!isFunction(value)) return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not rewrite read-only method '" + name + "'");
      };
    }
  });
};
var toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};
  const define = (arr) => {
    arr.forEach((value) => {
      obj[value] = true;
    });
  };
  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
};
var noop = () => {
};
var toFiniteNumber = (value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
}
var toJSONObject = (obj) => {
  const stack = new Array(10);
  const visit = (source, i) => {
    if (isObject(source)) {
      if (stack.indexOf(source) >= 0) {
        return;
      }
      if (isBuffer(source)) {
        return source;
      }
      if (!("toJSON" in source)) {
        stack[i] = source;
        const target = isArray(source) ? [] : {};
        forEach(source, (value, key) => {
          const reducedValue = visit(value, i + 1);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });
        stack[i] = void 0;
        return target;
      }
    }
    return source;
  };
  return visit(obj, 0);
};
var isAsyncFn = kindOfTest("AsyncFunction");
var isThenable = (thing) => thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);
var _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }
  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener(
      "message",
      ({ source, data }) => {
        if (source === _global && data === token) {
          callbacks.length && callbacks.shift()();
        }
      },
      false
    );
    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    };
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(typeof setImmediate === "function", isFunction(_global.postMessage));
var asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
var isIterable = (thing) => thing != null && isFunction(thing[iterator]);
var utils_default = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isEmptyObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isBlob,
  isRegExp,
  isFunction,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable
};

// crm-frontend/node_modules/axios/lib/core/AxiosError.js
var AxiosError = class _AxiosError extends Error {
  static from(error, code, config, request, response, customProps) {
    const axiosError = new _AxiosError(error.message, code || error.code, config, request, response);
    axiosError.cause = error;
    axiosError.name = error.name;
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  }
  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  constructor(message, code, config, request, response) {
    super(message);
    this.name = "AxiosError";
    this.isAxiosError = true;
    code && (this.code = code);
    config && (this.config = config);
    request && (this.request = request);
    if (response) {
      this.response = response;
      this.status = response.status;
    }
  }
  toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: utils_default.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
};
AxiosError.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
AxiosError.ERR_BAD_OPTION = "ERR_BAD_OPTION";
AxiosError.ECONNABORTED = "ECONNABORTED";
AxiosError.ETIMEDOUT = "ETIMEDOUT";
AxiosError.ERR_NETWORK = "ERR_NETWORK";
AxiosError.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
AxiosError.ERR_DEPRECATED = "ERR_DEPRECATED";
AxiosError.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
AxiosError.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
AxiosError.ERR_CANCELED = "ERR_CANCELED";
AxiosError.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
AxiosError.ERR_INVALID_URL = "ERR_INVALID_URL";
var AxiosError_default = AxiosError;

// crm-frontend/node_modules/axios/lib/helpers/null.js
var null_default = null;

// crm-frontend/node_modules/axios/lib/helpers/toFormData.js
function isVisitable(thing) {
  return utils_default.isPlainObject(thing) || utils_default.isArray(thing);
}
function removeBrackets(key) {
  return utils_default.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils_default.isArray(arr) && !arr.some(isVisitable);
}
var predicates = utils_default.toFlatObject(utils_default, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});
function toFormData(obj, formData, options) {
  if (!utils_default.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new (null_default || FormData)();
  options = utils_default.toFlatObject(options, {
    metaTokens: true,
    dots: false,
    indexes: false
  }, false, function defined(option, source) {
    return !utils_default.isUndefined(source[option]);
  });
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const useBlob = _Blob && utils_default.isSpecCompliantForm(formData);
  if (!utils_default.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null) return "";
    if (utils_default.isDate(value)) {
      return value.toISOString();
    }
    if (utils_default.isBoolean(value)) {
      return value.toString();
    }
    if (!useBlob && utils_default.isBlob(value)) {
      throw new AxiosError_default("Blob is not supported. Use a Buffer instead.");
    }
    if (utils_default.isArrayBuffer(value) || utils_default.isTypedArray(value)) {
      return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
    }
    return value;
  }
  function defaultVisitor(value, key, path) {
    let arr = value;
    if (value && !path && typeof value === "object") {
      if (utils_default.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = JSON.stringify(value);
      } else if (utils_default.isArray(value) && isFlatArray(value) || (utils_default.isFileList(value) || utils_default.endsWith(key, "[]")) && (arr = utils_default.toArray(value))) {
        key = removeBrackets(key);
        arr.forEach(function each(el, index) {
          !(utils_default.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el)
          );
        });
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path, key, dots), convertValue(value));
    return false;
  }
  const stack = [];
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path) {
    if (utils_default.isUndefined(value)) return;
    if (stack.indexOf(value) !== -1) {
      throw Error("Circular reference detected in " + path.join("."));
    }
    stack.push(value);
    utils_default.forEach(value, function each(el, key) {
      const result = !(utils_default.isUndefined(el) || el === null) && visitor.call(
        formData,
        el,
        utils_default.isString(key) ? key.trim() : key,
        path,
        exposedHelpers
      );
      if (result === true) {
        build(el, path ? path.concat(key) : [key]);
      }
    });
    stack.pop();
  }
  if (!utils_default.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
var toFormData_default = toFormData;

// crm-frontend/node_modules/axios/lib/helpers/AxiosURLSearchParams.js
function encode(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
    return charMap[match];
  });
}
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData_default(params, this, options);
}
var prototype = AxiosURLSearchParams.prototype;
prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};
prototype.toString = function toString2(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode);
  } : encode;
  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "").join("&");
};
var AxiosURLSearchParams_default = AxiosURLSearchParams;

// crm-frontend/node_modules/axios/lib/helpers/buildURL.js
function encode2(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
function buildURL(url, params, options) {
  if (!params) {
    return url;
  }
  const _encode = options && options.encode || encode2;
  const _options = utils_default.isFunction(options) ? {
    serialize: options
  } : options;
  const serializeFn = _options && _options.serialize;
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, _options);
  } else {
    serializedParams = utils_default.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams_default(params, _options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url;
}

// crm-frontend/node_modules/axios/lib/core/InterceptorManager.js
var InterceptorManager = class {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils_default.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
};
var InterceptorManager_default = InterceptorManager;

// crm-frontend/node_modules/axios/lib/defaults/transitional.js
var transitional_default = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false,
  legacyInterceptorReqResOrdering: true
};

// crm-frontend/node_modules/axios/lib/platform/browser/classes/URLSearchParams.js
var URLSearchParams_default = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams_default;

// crm-frontend/node_modules/axios/lib/platform/browser/classes/FormData.js
var FormData_default = typeof FormData !== "undefined" ? FormData : null;

// crm-frontend/node_modules/axios/lib/platform/browser/classes/Blob.js
var Blob_default = typeof Blob !== "undefined" ? Blob : null;

// crm-frontend/node_modules/axios/lib/platform/browser/index.js
var browser_default = {
  isBrowser: true,
  classes: {
    URLSearchParams: URLSearchParams_default,
    FormData: FormData_default,
    Blob: Blob_default
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
};

// crm-frontend/node_modules/axios/lib/platform/common/utils.js
var utils_exports = {};
__export(utils_exports, {
  hasBrowserEnv: () => hasBrowserEnv,
  hasStandardBrowserEnv: () => hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv: () => hasStandardBrowserWebWorkerEnv,
  navigator: () => _navigator,
  origin: () => origin
});
var hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
var _navigator = typeof navigator === "object" && navigator || void 0;
var hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
var hasStandardBrowserWebWorkerEnv = (() => {
  return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
var origin = hasBrowserEnv && window.location.href || "http://localhost";

// crm-frontend/node_modules/axios/lib/platform/index.js
var platform_default = {
  ...utils_exports,
  ...browser_default
};

// crm-frontend/node_modules/axios/lib/helpers/toURLEncodedForm.js
function toURLEncodedForm(data, options) {
  return toFormData_default(data, new platform_default.classes.URLSearchParams(), {
    visitor: function(value, key, path, helpers) {
      if (platform_default.isNode && utils_default.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    },
    ...options
  });
}

// crm-frontend/node_modules/axios/lib/helpers/formDataToJSON.js
function parsePropPath(name) {
  return utils_default.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
    return match[0] === "[]" ? "" : match[1] || match[0];
  });
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    let name = path[index++];
    if (name === "__proto__") return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils_default.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils_default.hasOwnProp(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!target[name] || !utils_default.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path, value, target[name], index);
    if (result && utils_default.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils_default.isFormData(formData) && utils_default.isFunction(formData.entries)) {
    const obj = {};
    utils_default.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
var formDataToJSON_default = formDataToJSON;

// crm-frontend/node_modules/axios/lib/defaults/index.js
function stringifySafely(rawValue, parser, encoder) {
  if (utils_default.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils_default.trim(rawValue);
    } catch (e) {
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
var defaults = {
  transitional: transitional_default,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [function transformRequest(data, headers) {
    const contentType = headers.getContentType() || "";
    const hasJSONContentType = contentType.indexOf("application/json") > -1;
    const isObjectPayload = utils_default.isObject(data);
    if (isObjectPayload && utils_default.isHTMLForm(data)) {
      data = new FormData(data);
    }
    const isFormData2 = utils_default.isFormData(data);
    if (isFormData2) {
      return hasJSONContentType ? JSON.stringify(formDataToJSON_default(data)) : data;
    }
    if (utils_default.isArrayBuffer(data) || utils_default.isBuffer(data) || utils_default.isStream(data) || utils_default.isFile(data) || utils_default.isBlob(data) || utils_default.isReadableStream(data)) {
      return data;
    }
    if (utils_default.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils_default.isURLSearchParams(data)) {
      headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
      return data.toString();
    }
    let isFileList2;
    if (isObjectPayload) {
      if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
        return toURLEncodedForm(data, this.formSerializer).toString();
      }
      if ((isFileList2 = utils_default.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
        const _FormData = this.env && this.env.FormData;
        return toFormData_default(
          isFileList2 ? { "files[]": data } : data,
          _FormData && new _FormData(),
          this.formSerializer
        );
      }
    }
    if (isObjectPayload || hasJSONContentType) {
      headers.setContentType("application/json", false);
      return stringifySafely(data);
    }
    return data;
  }],
  transformResponse: [function transformResponse(data) {
    const transitional2 = this.transitional || defaults.transitional;
    const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
    const JSONRequested = this.responseType === "json";
    if (utils_default.isResponse(data) || utils_default.isReadableStream(data)) {
      return data;
    }
    if (data && utils_default.isString(data) && (forcedJSONParsing && !this.responseType || JSONRequested)) {
      const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
      const strictJSONParsing = !silentJSONParsing && JSONRequested;
      try {
        return JSON.parse(data, this.parseReviver);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === "SyntaxError") {
            throw AxiosError_default.from(e, AxiosError_default.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }
    return data;
  }],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: platform_default.classes.FormData,
    Blob: platform_default.classes.Blob
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
utils_default.forEach(["delete", "get", "head", "post", "put", "patch"], (method) => {
  defaults.headers[method] = {};
});
var defaults_default = defaults;

// crm-frontend/node_modules/axios/lib/helpers/parseHeaders.js
var ignoreDuplicateOf = utils_default.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
var parseHeaders_default = (rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i;
  rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
    i = line.indexOf(":");
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    if (!key || parsed[key] && ignoreDuplicateOf[key]) {
      return;
    }
    if (key === "set-cookie") {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
    }
  });
  return parsed;
};

// crm-frontend/node_modules/axios/lib/core/AxiosHeaders.js
var $internals = /* @__PURE__ */ Symbol("internals");
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils_default.isArray(value) ? value.map(normalizeValue) : String(value);
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;
  while (match = tokensRE.exec(str)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}
var isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
function matchHeaderValue(context, value, header, filter2, isHeaderNameFilter) {
  if (utils_default.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (isHeaderNameFilter) {
    value = header;
  }
  if (!utils_default.isString(value)) return;
  if (utils_default.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils_default.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils_default.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
var AxiosHeaders = class {
  constructor(headers) {
    headers && this.set(headers);
  }
  set(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        throw new Error("header name must be a non-empty string");
      }
      const key = utils_default.findKey(self2, lHeader);
      if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
        self2[key || _header] = normalizeValue(_value);
      }
    }
    const setHeaders = (headers, _rewrite) => utils_default.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
    if (utils_default.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils_default.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders_default(header), valueOrRewrite);
    } else if (utils_default.isObject(header) && utils_default.isIterable(header)) {
      let obj = {}, dest, key;
      for (const entry of header) {
        if (!utils_default.isArray(entry)) {
          throw TypeError("Object iterator must return a key-value pair");
        }
        obj[key = entry[0]] = (dest = obj[key]) ? utils_default.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]] : entry[1];
      }
      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  }
  get(header, parser) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils_default.findKey(this, header);
      if (key) {
        const value = this[key];
        if (!parser) {
          return value;
        }
        if (parser === true) {
          return parseTokens(value);
        }
        if (utils_default.isFunction(parser)) {
          return parser.call(this, value, key);
        }
        if (utils_default.isRegExp(parser)) {
          return parser.exec(value);
        }
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils_default.findKey(this, header);
      return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  }
  delete(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = utils_default.findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    if (utils_default.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  }
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;
    while (i--) {
      const key = keys[i];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }
    return deleted;
  }
  normalize(format) {
    const self2 = this;
    const headers = {};
    utils_default.forEach(this, (value, header) => {
      const key = utils_default.findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value);
      headers[normalized] = true;
    });
    return this;
  }
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }
  toJSON(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils_default.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils_default.isArray(value) ? value.join(", ") : value);
    });
    return obj;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }
  static concat(first, ...targets) {
    const computed = new this(first);
    targets.forEach((target) => computed.set(target));
    return computed;
  }
  static accessor(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype2 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype2, _header);
        accessors[lHeader] = true;
      }
    }
    utils_default.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
};
AxiosHeaders.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
utils_default.reduceDescriptors(AxiosHeaders.prototype, ({ value }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1);
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  };
});
utils_default.freezeMethods(AxiosHeaders);
var AxiosHeaders_default = AxiosHeaders;

// crm-frontend/node_modules/axios/lib/core/transformData.js
function transformData(fns, response) {
  const config = this || defaults_default;
  const context = response || config;
  const headers = AxiosHeaders_default.from(context.headers);
  let data = context.data;
  utils_default.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}

// crm-frontend/node_modules/axios/lib/cancel/isCancel.js
function isCancel(value) {
  return !!(value && value.__CANCEL__);
}

// crm-frontend/node_modules/axios/lib/cancel/CanceledError.js
var CanceledError = class extends AxiosError_default {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request) {
    super(message == null ? "canceled" : message, AxiosError_default.ERR_CANCELED, config, request);
    this.name = "CanceledError";
    this.__CANCEL__ = true;
  }
};
var CanceledError_default = CanceledError;

// crm-frontend/node_modules/axios/lib/core/settle.js
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError_default(
      "Request failed with status code " + response.status,
      [AxiosError_default.ERR_BAD_REQUEST, AxiosError_default.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
}

// crm-frontend/node_modules/axios/lib/helpers/parseProtocol.js
function parseProtocol(url) {
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || "";
}

// crm-frontend/node_modules/axios/lib/helpers/speedometer.js
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
var speedometer_default = speedometer;

// crm-frontend/node_modules/axios/lib/helpers/throttle.js
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1e3 / freq;
  let lastArgs;
  let timer;
  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn(...args);
  };
  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };
  const flush = () => lastArgs && invoke(lastArgs);
  return [throttled, flush];
}
var throttle_default = throttle;

// crm-frontend/node_modules/axios/lib/helpers/progressEventReducer.js
var progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer_default(50, 250);
  return throttle_default((e) => {
    const loaded = e.loaded;
    const total = e.lengthComputable ? e.total : void 0;
    const progressBytes = loaded - bytesNotified;
    const rate = _speedometer(progressBytes);
    const inRange = loaded <= total;
    bytesNotified = loaded;
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total && inRange ? (total - loaded) / rate : void 0,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? "download" : "upload"]: true
    };
    listener(data);
  }, freq);
};
var progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;
  return [(loaded) => throttled[0]({
    lengthComputable,
    total,
    loaded
  }), throttled[1]];
};
var asyncDecorator = (fn) => (...args) => utils_default.asap(() => fn(...args));

// crm-frontend/node_modules/axios/lib/helpers/isURLSameOrigin.js
var isURLSameOrigin_default = platform_default.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url) => {
  url = new URL(url, platform_default.origin);
  return origin2.protocol === url.protocol && origin2.host === url.host && (isMSIE || origin2.port === url.port);
})(
  new URL(platform_default.origin),
  platform_default.navigator && /(msie|trident)/i.test(platform_default.navigator.userAgent)
) : () => true;

// crm-frontend/node_modules/axios/lib/helpers/cookies.js
var cookies_default = platform_default.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path, domain, secure, sameSite) {
      if (typeof document === "undefined") return;
      const cookie = [`${name}=${encodeURIComponent(value)}`];
      if (utils_default.isNumber(expires)) {
        cookie.push(`expires=${new Date(expires).toUTCString()}`);
      }
      if (utils_default.isString(path)) {
        cookie.push(`path=${path}`);
      }
      if (utils_default.isString(domain)) {
        cookie.push(`domain=${domain}`);
      }
      if (secure === true) {
        cookie.push("secure");
      }
      if (utils_default.isString(sameSite)) {
        cookie.push(`SameSite=${sameSite}`);
      }
      document.cookie = cookie.join("; ");
    },
    read(name) {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : null;
    },
    remove(name) {
      this.write(name, "", Date.now() - 864e5, "/");
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);

// crm-frontend/node_modules/axios/lib/helpers/isAbsoluteURL.js
function isAbsoluteURL(url) {
  if (typeof url !== "string") {
    return false;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

// crm-frontend/node_modules/axios/lib/helpers/combineURLs.js
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}

// crm-frontend/node_modules/axios/lib/core/buildFullPath.js
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls == false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}

// crm-frontend/node_modules/axios/lib/core/mergeConfig.js
var headersToObject = (thing) => thing instanceof AxiosHeaders_default ? { ...thing } : thing;
function mergeConfig(config1, config2) {
  config2 = config2 || {};
  const config = {};
  function getMergedValue(target, source, prop, caseless) {
    if (utils_default.isPlainObject(target) && utils_default.isPlainObject(source)) {
      return utils_default.merge.call({ caseless }, target, source);
    } else if (utils_default.isPlainObject(source)) {
      return utils_default.merge({}, source);
    } else if (utils_default.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(a, b, prop, caseless) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(a, b, prop, caseless);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a, prop, caseless);
    }
  }
  function valueFromConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  function defaultToConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a);
    }
  }
  function mergeDirectKeys(a, b, prop) {
    if (prop in config2) {
      return getMergedValue(a, b);
    } else if (prop in config1) {
      return getMergedValue(void 0, a);
    }
  }
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
  };
  utils_default.forEach(
    Object.keys({ ...config1, ...config2 }),
    function computeConfigValue(prop) {
      if (prop === "__proto__" || prop === "constructor" || prop === "prototype")
        return;
      const merge2 = utils_default.hasOwnProp(mergeMap, prop) ? mergeMap[prop] : mergeDeepProperties;
      const configValue = merge2(config1[prop], config2[prop], prop);
      utils_default.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
    }
  );
  return config;
}

// crm-frontend/node_modules/axios/lib/helpers/resolveConfig.js
var resolveConfig_default = (config) => {
  const newConfig = mergeConfig({}, config);
  let { data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = newConfig;
  newConfig.headers = headers = AxiosHeaders_default.from(headers);
  newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url, newConfig.allowAbsoluteUrls), config.params, config.paramsSerializer);
  if (auth) {
    headers.set(
      "Authorization",
      "Basic " + btoa((auth.username || "") + ":" + (auth.password ? unescape(encodeURIComponent(auth.password)) : ""))
    );
  }
  if (utils_default.isFormData(data)) {
    if (platform_default.hasStandardBrowserEnv || platform_default.hasStandardBrowserWebWorkerEnv) {
      headers.setContentType(void 0);
    } else if (utils_default.isFunction(data.getHeaders)) {
      const formHeaders = data.getHeaders();
      const allowedHeaders = ["content-type", "content-length"];
      Object.entries(formHeaders).forEach(([key, val]) => {
        if (allowedHeaders.includes(key.toLowerCase())) {
          headers.set(key, val);
        }
      });
    }
  }
  if (platform_default.hasStandardBrowserEnv) {
    withXSRFToken && utils_default.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));
    if (withXSRFToken || withXSRFToken !== false && isURLSameOrigin_default(newConfig.url)) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies_default.read(xsrfCookieName);
      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }
  return newConfig;
};

// crm-frontend/node_modules/axios/lib/adapters/xhr.js
var isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
var xhr_default = isXHRAdapterSupported && function(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig_default(config);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders_default.from(_config.headers).normalize();
    let { responseType, onUploadProgress, onDownloadProgress } = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;
    function done() {
      flushUpload && flushUpload();
      flushDownload && flushDownload();
      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
      _config.signal && _config.signal.removeEventListener("abort", onCanceled);
    }
    let request = new XMLHttpRequest();
    request.open(_config.method.toUpperCase(), _config.url, true);
    request.timeout = _config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      const responseHeaders = AxiosHeaders_default.from(
        "getAllResponseHeaders" in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };
      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);
      request = null;
    }
    if ("onloadend" in request) {
      request.onloadend = onloadend;
    } else {
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
          return;
        }
        setTimeout(onloadend);
      };
    }
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError_default("Request aborted", AxiosError_default.ECONNABORTED, config, request));
      request = null;
    };
    request.onerror = function handleError(event) {
      const msg = event && event.message ? event.message : "Network Error";
      const err = new AxiosError_default(msg, AxiosError_default.ERR_NETWORK, config, request);
      err.event = event || null;
      reject(err);
      request = null;
    };
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = _config.transitional || transitional_default;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(new AxiosError_default(
        timeoutErrorMessage,
        transitional2.clarifyTimeoutError ? AxiosError_default.ETIMEDOUT : AxiosError_default.ECONNABORTED,
        config,
        request
      ));
      request = null;
    };
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request) {
      utils_default.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }
    if (!utils_default.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request.responseType = _config.responseType;
    }
    if (onDownloadProgress) {
      [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
      request.addEventListener("progress", downloadThrottled);
    }
    if (onUploadProgress && request.upload) {
      [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
      request.upload.addEventListener("progress", uploadThrottled);
      request.upload.addEventListener("loadend", flushUpload);
    }
    if (_config.cancelToken || _config.signal) {
      onCanceled = (cancel) => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError_default(null, config, request) : cancel);
        request.abort();
        request = null;
      };
      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol = parseProtocol(_config.url);
    if (protocol && platform_default.protocols.indexOf(protocol) === -1) {
      reject(new AxiosError_default("Unsupported protocol " + protocol + ":", AxiosError_default.ERR_BAD_REQUEST, config));
      return;
    }
    request.send(requestData || null);
  });
};

// crm-frontend/node_modules/axios/lib/helpers/composeSignals.js
var composeSignals = (signals, timeout) => {
  const { length } = signals = signals ? signals.filter(Boolean) : [];
  if (timeout || length) {
    let controller = new AbortController();
    let aborted;
    const onabort = function(reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(err instanceof AxiosError_default ? err : new CanceledError_default(err instanceof Error ? err.message : err));
      }
    };
    let timer = timeout && setTimeout(() => {
      timer = null;
      onabort(new AxiosError_default(`timeout of ${timeout}ms exceeded`, AxiosError_default.ETIMEDOUT));
    }, timeout);
    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach((signal2) => {
          signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
        });
        signals = null;
      }
    };
    signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
    const { signal } = controller;
    signal.unsubscribe = () => utils_default.asap(unsubscribe);
    return signal;
  }
};
var composeSignals_default = composeSignals;

// crm-frontend/node_modules/axios/lib/helpers/trackStream.js
var streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;
  if (!chunkSize || len < chunkSize) {
    yield chunk;
    return;
  }
  let pos = 0;
  let end;
  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};
var readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};
var readStream = async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }
  const reader = stream.getReader();
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
};
var trackStream = (stream, chunkSize, onProgress, onFinish) => {
  const iterator2 = readBytes(stream, chunkSize);
  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done: done2, value } = await iterator2.next();
        if (done2) {
          _onFinish();
          controller.close();
          return;
        }
        let len = value.byteLength;
        if (onProgress) {
          let loadedBytes = bytes += len;
          onProgress(loadedBytes);
        }
        controller.enqueue(new Uint8Array(value));
      } catch (err) {
        _onFinish(err);
        throw err;
      }
    },
    cancel(reason) {
      _onFinish(reason);
      return iterator2.return();
    }
  }, {
    highWaterMark: 2
  });
};

// crm-frontend/node_modules/axios/lib/adapters/fetch.js
var DEFAULT_CHUNK_SIZE = 64 * 1024;
var { isFunction: isFunction2 } = utils_default;
var globalFetchAPI = (({ Request, Response }) => ({
  Request,
  Response
}))(utils_default.global);
var {
  ReadableStream: ReadableStream2,
  TextEncoder
} = utils_default.global;
var test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e) {
    return false;
  }
};
var factory = (env) => {
  env = utils_default.merge.call({
    skipUndefined: true
  }, globalFetchAPI, env);
  const { fetch: envFetch, Request, Response } = env;
  const isFetchSupported = envFetch ? isFunction2(envFetch) : typeof fetch === "function";
  const isRequestSupported = isFunction2(Request);
  const isResponseSupported = isFunction2(Response);
  if (!isFetchSupported) {
    return false;
  }
  const isReadableStreamSupported = isFetchSupported && isFunction2(ReadableStream2);
  const encodeText = isFetchSupported && (typeof TextEncoder === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) : async (str) => new Uint8Array(await new Request(str).arrayBuffer()));
  const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
    let duplexAccessed = false;
    const hasContentType = new Request(platform_default.origin, {
      body: new ReadableStream2(),
      method: "POST",
      get duplex() {
        duplexAccessed = true;
        return "half";
      }
    }).headers.has("Content-Type");
    return duplexAccessed && !hasContentType;
  });
  const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils_default.isReadableStream(new Response("").body));
  const resolvers = {
    stream: supportsResponseStream && ((res) => res.body)
  };
  isFetchSupported && (() => {
    ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
      !resolvers[type] && (resolvers[type] = (res, config) => {
        let method = res && res[type];
        if (method) {
          return method.call(res);
        }
        throw new AxiosError_default(`Response type '${type}' is not supported`, AxiosError_default.ERR_NOT_SUPPORT, config);
      });
    });
  })();
  const getBodyLength = async (body) => {
    if (body == null) {
      return 0;
    }
    if (utils_default.isBlob(body)) {
      return body.size;
    }
    if (utils_default.isSpecCompliantForm(body)) {
      const _request = new Request(platform_default.origin, {
        method: "POST",
        body
      });
      return (await _request.arrayBuffer()).byteLength;
    }
    if (utils_default.isArrayBufferView(body) || utils_default.isArrayBuffer(body)) {
      return body.byteLength;
    }
    if (utils_default.isURLSearchParams(body)) {
      body = body + "";
    }
    if (utils_default.isString(body)) {
      return (await encodeText(body)).byteLength;
    }
  };
  const resolveBodyLength = async (headers, body) => {
    const length = utils_default.toFiniteNumber(headers.getContentLength());
    return length == null ? getBodyLength(body) : length;
  };
  return async (config) => {
    let {
      url,
      method,
      data,
      signal,
      cancelToken,
      timeout,
      onDownloadProgress,
      onUploadProgress,
      responseType,
      headers,
      withCredentials = "same-origin",
      fetchOptions
    } = resolveConfig_default(config);
    let _fetch = envFetch || fetch;
    responseType = responseType ? (responseType + "").toLowerCase() : "text";
    let composedSignal = composeSignals_default([signal, cancelToken && cancelToken.toAbortSignal()], timeout);
    let request = null;
    const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
    });
    let requestContentLength;
    try {
      if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
        let _request = new Request(url, {
          method: "POST",
          body: data,
          duplex: "half"
        });
        let contentTypeHeader;
        if (utils_default.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
          headers.setContentType(contentTypeHeader);
        }
        if (_request.body) {
          const [onProgress, flush] = progressEventDecorator(
            requestContentLength,
            progressEventReducer(asyncDecorator(onUploadProgress))
          );
          data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
        }
      }
      if (!utils_default.isString(withCredentials)) {
        withCredentials = withCredentials ? "include" : "omit";
      }
      const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;
      const resolvedOptions = {
        ...fetchOptions,
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: headers.normalize().toJSON(),
        body: data,
        duplex: "half",
        credentials: isCredentialsSupported ? withCredentials : void 0
      };
      request = isRequestSupported && new Request(url, resolvedOptions);
      let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url, resolvedOptions));
      const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
      if (supportsResponseStream && (onDownloadProgress || isStreamResponse && unsubscribe)) {
        const options = {};
        ["status", "statusText", "headers"].forEach((prop) => {
          options[prop] = response[prop];
        });
        const responseContentLength = utils_default.toFiniteNumber(response.headers.get("content-length"));
        const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
          responseContentLength,
          progressEventReducer(asyncDecorator(onDownloadProgress), true)
        ) || [];
        response = new Response(
          trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
            flush && flush();
            unsubscribe && unsubscribe();
          }),
          options
        );
      }
      responseType = responseType || "text";
      let responseData = await resolvers[utils_default.findKey(resolvers, responseType) || "text"](response, config);
      !isStreamResponse && unsubscribe && unsubscribe();
      return await new Promise((resolve, reject) => {
        settle(resolve, reject, {
          data: responseData,
          headers: AxiosHeaders_default.from(response.headers),
          status: response.status,
          statusText: response.statusText,
          config,
          request
        });
      });
    } catch (err) {
      unsubscribe && unsubscribe();
      if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
        throw Object.assign(
          new AxiosError_default("Network Error", AxiosError_default.ERR_NETWORK, config, request, err && err.response),
          {
            cause: err.cause || err
          }
        );
      }
      throw AxiosError_default.from(err, err && err.code, config, request, err && err.response);
    }
  };
};
var seedCache = /* @__PURE__ */ new Map();
var getFetch = (config) => {
  let env = config && config.env || {};
  const { fetch: fetch2, Request, Response } = env;
  const seeds = [
    Request,
    Response,
    fetch2
  ];
  let len = seeds.length, i = len, seed, target, map = seedCache;
  while (i--) {
    seed = seeds[i];
    target = map.get(seed);
    target === void 0 && map.set(seed, target = i ? /* @__PURE__ */ new Map() : factory(env));
    map = target;
  }
  return target;
};
var adapter = getFetch();

// crm-frontend/node_modules/axios/lib/adapters/adapters.js
var knownAdapters = {
  http: null_default,
  xhr: xhr_default,
  fetch: {
    get: getFetch
  }
};
utils_default.forEach(knownAdapters, (fn, value) => {
  if (fn) {
    try {
      Object.defineProperty(fn, "name", { value });
    } catch (e) {
    }
    Object.defineProperty(fn, "adapterName", { value });
  }
});
var renderReason = (reason) => `- ${reason}`;
var isResolvedHandle = (adapter2) => utils_default.isFunction(adapter2) || adapter2 === null || adapter2 === false;
function getAdapter(adapters, config) {
  adapters = utils_default.isArray(adapters) ? adapters : [adapters];
  const { length } = adapters;
  let nameOrAdapter;
  let adapter2;
  const rejectedReasons = {};
  for (let i = 0; i < length; i++) {
    nameOrAdapter = adapters[i];
    let id;
    adapter2 = nameOrAdapter;
    if (!isResolvedHandle(nameOrAdapter)) {
      adapter2 = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
      if (adapter2 === void 0) {
        throw new AxiosError_default(`Unknown adapter '${id}'`);
      }
    }
    if (adapter2 && (utils_default.isFunction(adapter2) || (adapter2 = adapter2.get(config)))) {
      break;
    }
    rejectedReasons[id || "#" + i] = adapter2;
  }
  if (!adapter2) {
    const reasons = Object.entries(rejectedReasons).map(
      ([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
    );
    let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
    throw new AxiosError_default(
      `There is no suitable adapter to dispatch the request ` + s,
      "ERR_NOT_SUPPORT"
    );
  }
  return adapter2;
}
var adapters_default = {
  /**
   * Resolve an adapter from a list of adapter names or functions.
   * @type {Function}
   */
  getAdapter,
  /**
   * Exposes all known adapters
   * @type {Object<string, Function|Object>}
   */
  adapters: knownAdapters
};

// crm-frontend/node_modules/axios/lib/core/dispatchRequest.js
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError_default(null, config);
  }
}
function dispatchRequest(config) {
  throwIfCancellationRequested(config);
  config.headers = AxiosHeaders_default.from(config.headers);
  config.data = transformData.call(
    config,
    config.transformRequest
  );
  if (["post", "put", "patch"].indexOf(config.method) !== -1) {
    config.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter2 = adapters_default.getAdapter(config.adapter || defaults_default.adapter, config);
  return adapter2(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);
    response.data = transformData.call(
      config,
      config.transformResponse,
      response
    );
    response.headers = AxiosHeaders_default.from(response.headers);
    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          config.transformResponse,
          reason.response
        );
        reason.response.headers = AxiosHeaders_default.from(reason.response.headers);
      }
    }
    return Promise.reject(reason);
  });
}

// crm-frontend/node_modules/axios/lib/env/data.js
var VERSION = "1.13.5";

// crm-frontend/node_modules/axios/lib/helpers/validator.js
var validators = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
  validators[type] = function validator(thing) {
    return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
  };
});
var deprecatedWarnings = {};
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  return (value, opt, opts) => {
    if (validator === false) {
      throw new AxiosError_default(
        formatMessage(opt, " has been removed" + (version ? " in " + version : "")),
        AxiosError_default.ERR_DEPRECATED
      );
    }
    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(
        formatMessage(
          opt,
          " has been deprecated since v" + version + " and will be removed in the near future"
        )
      );
    }
    return validator ? validator(value, opt, opts) : true;
  };
};
validators.spelling = function spelling(correctSpelling) {
  return (value, opt) => {
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  };
};
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object") {
    throw new AxiosError_default("options must be an object", AxiosError_default.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator = schema[opt];
    if (validator) {
      const value = options[opt];
      const result = value === void 0 || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError_default("option " + opt + " must be " + result, AxiosError_default.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError_default("Unknown option " + opt, AxiosError_default.ERR_BAD_OPTION);
    }
  }
}
var validator_default = {
  assertOptions,
  validators
};

// crm-frontend/node_modules/axios/lib/core/Axios.js
var validators2 = validator_default.validators;
var Axios = class {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager_default(),
      response: new InterceptorManager_default()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};
        Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
        const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, "") : "";
        try {
          if (!err.stack) {
            err.stack = stack;
          } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ""))) {
            err.stack += "\n" + stack;
          }
        } catch (e) {
        }
      }
      throw err;
    }
  }
  _request(configOrUrl, config) {
    if (typeof configOrUrl === "string") {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }
    config = mergeConfig(this.defaults, config);
    const { transitional: transitional2, paramsSerializer, headers } = config;
    if (transitional2 !== void 0) {
      validator_default.assertOptions(transitional2, {
        silentJSONParsing: validators2.transitional(validators2.boolean),
        forcedJSONParsing: validators2.transitional(validators2.boolean),
        clarifyTimeoutError: validators2.transitional(validators2.boolean),
        legacyInterceptorReqResOrdering: validators2.transitional(validators2.boolean)
      }, false);
    }
    if (paramsSerializer != null) {
      if (utils_default.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator_default.assertOptions(paramsSerializer, {
          encode: validators2.function,
          serialize: validators2.function
        }, true);
      }
    }
    if (config.allowAbsoluteUrls !== void 0) {
    } else if (this.defaults.allowAbsoluteUrls !== void 0) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }
    validator_default.assertOptions(config, {
      baseUrl: validators2.spelling("baseURL"),
      withXsrfToken: validators2.spelling("withXSRFToken")
    }, true);
    config.method = (config.method || this.defaults.method || "get").toLowerCase();
    let contextHeaders = headers && utils_default.merge(
      headers.common,
      headers[config.method]
    );
    headers && utils_default.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      (method) => {
        delete headers[method];
      }
    );
    config.headers = AxiosHeaders_default.concat(contextHeaders, headers);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      const transitional3 = config.transitional || transitional_default;
      const legacyInterceptorReqResOrdering = transitional3 && transitional3.legacyInterceptorReqResOrdering;
      if (legacyInterceptorReqResOrdering) {
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      } else {
        requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      }
    });
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let promise;
    let i = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), void 0];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;
      promise = Promise.resolve(config);
      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config;
    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }
    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }
    i = 0;
    len = responseInterceptorChain.length;
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }
    return promise;
  }
  getUri(config) {
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
};
utils_default.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method,
      url,
      data: (config || {}).data
    }));
  };
});
utils_default.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        headers: isForm ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url,
        data
      }));
    };
  }
  Axios.prototype[method] = generateHTTPMethod();
  Axios.prototype[method + "Form"] = generateHTTPMethod(true);
});
var Axios_default = Axios;

// crm-frontend/node_modules/axios/lib/cancel/CancelToken.js
var CancelToken = class _CancelToken {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners) return;
      let i = token._listeners.length;
      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve) => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };
      return promise;
    };
    executor(function cancel(message, config, request) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError_default(message, config, request);
      resolvePromise(token.reason);
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  toAbortSignal() {
    const controller = new AbortController();
    const abort = (err) => {
      controller.abort(err);
    };
    this.subscribe(abort);
    controller.signal.unsubscribe = () => this.unsubscribe(abort);
    return controller.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new _CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
};
var CancelToken_default = CancelToken;

// crm-frontend/node_modules/axios/lib/helpers/spread.js
function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}

// crm-frontend/node_modules/axios/lib/helpers/isAxiosError.js
function isAxiosError(payload) {
  return utils_default.isObject(payload) && payload.isAxiosError === true;
}

// crm-frontend/node_modules/axios/lib/helpers/HttpStatusCode.js
var HttpStatusCode = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(HttpStatusCode).forEach(([key, value]) => {
  HttpStatusCode[value] = key;
});
var HttpStatusCode_default = HttpStatusCode;

// crm-frontend/node_modules/axios/lib/axios.js
function createInstance(defaultConfig) {
  const context = new Axios_default(defaultConfig);
  const instance = bind(Axios_default.prototype.request, context);
  utils_default.extend(instance, Axios_default.prototype, context, { allOwnKeys: true });
  utils_default.extend(instance, context, null, { allOwnKeys: true });
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };
  return instance;
}
var axios = createInstance(defaults_default);
axios.Axios = Axios_default;
axios.CanceledError = CanceledError_default;
axios.CancelToken = CancelToken_default;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData_default;
axios.AxiosError = AxiosError_default;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread;
axios.isAxiosError = isAxiosError;
axios.mergeConfig = mergeConfig;
axios.AxiosHeaders = AxiosHeaders_default;
axios.formToJSON = (thing) => formDataToJSON_default(utils_default.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters_default.getAdapter;
axios.HttpStatusCode = HttpStatusCode_default;
axios.default = axios;
var axios_default = axios;

// crm-frontend/node_modules/axios/index.js
var {
  Axios: Axios2,
  AxiosError: AxiosError2,
  CanceledError: CanceledError2,
  isCancel: isCancel2,
  CancelToken: CancelToken2,
  VERSION: VERSION2,
  all: all2,
  Cancel,
  isAxiosError: isAxiosError2,
  spread: spread2,
  toFormData: toFormData2,
  AxiosHeaders: AxiosHeaders2,
  HttpStatusCode: HttpStatusCode2,
  formToJSON,
  getAdapter: getAdapter2,
  mergeConfig: mergeConfig2
} = axios_default;

// crm-frontend/src/lib/api.js
function normalizeBaseUrl(value) {
  const raw = String(value || "").trim();
  const unquoted = raw.replace(/^['"]|['"]$/g, "");
  const trimmed = unquoted.replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1")) {
    return `http://${trimmed}`;
  }
  if (trimmed.includes(".")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}
var API_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL) || "http://localhost:5000";
var API_BASE_FROM_ENV = normalizeBaseUrl(import.meta.env.VITE_API_BASE);
var API_BASE = API_BASE_FROM_ENV ? API_BASE_FROM_ENV : API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;
var api = axios_default.create({
  baseURL: API_BASE
});
var getMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("//") || url.startsWith("data:")) {
    return url;
  }
  const root = API_URL.replace(/\/api$/, "");
  return `${root}${url.startsWith("/") ? "" : "/"}${url}`;
};
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
var api_default = api;

// crm-frontend/src/components/ImageUploader.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, X, Loader2, Wand2, Sparkles, ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from "lucide-react";

// crm-frontend/src/lib/errorText.js
function errorText(value, fallback = "Something went wrong") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  const maybeAxios = value;
  const data = maybeAxios?.response?.data;
  if (typeof data === "string") return data;
  const candidate = data?.error ?? data?.message ?? maybeAxios?.message ?? maybeAxios?.error ?? value;
  if (typeof candidate === "string") return candidate;
  try {
    return JSON.stringify(candidate);
  } catch {
    return fallback;
  }
}

// crm-frontend/src/components/ImageUploader.jsx
var QUICK_PROMPTS = [
  { label: "\u2B1C Witte achtergrond", prompt: "Witte achtergrond, professionele studio-opname" },
  { label: "\u{1F4A1} Betere belichting", prompt: "Verbeter de belichting, zachte studio verlichting, geen harde schaduwen" },
  { label: "\u{1F3AF} Scherper beeld", prompt: "Maak het beeld scherper, hoge resolutie, meer detail" },
  { label: "\u{1F6CD}\uFE0F E-commerce stijl", prompt: "Professionele e-commerce productfoto, clean en minimalistisch" },
  { label: "\u{1F311} Schaduw toevoegen", prompt: "Voeg een subtiele zachte schaduw toe onder het product" },
  { label: "\u2728 Premium uitstraling", prompt: "Luxe premium uitstraling, high-end productfotografie" },
  { label: "\u{1F532} Transparante achtergrond", prompt: "Verwijder de achtergrond, transparant PNG" },
  { label: "\u{1F4D0} Product centreren", prompt: "Centreer het product, meer witruimte rondom, schone compositie" }
];
function normalizeImages(value) {
  if (!Array.isArray(value)) return [];
  const seen = /* @__PURE__ */ new Set();
  return value.map((url) => String(url || "").trim()).filter((url) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}
function ImageUploader({ value, onChange, label = "Afbeelding", height = "h-44", multiple = false }) {
  const images = useMemo(() => normalizeImages(multiple ? value : value ? [value] : []), [multiple, value]);
  const activeValue = images[0] || "";
  const [imgPreview, setImgPreview] = useState(activeValue ? getMediaUrl(activeValue) : null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("AI");
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const fileRef = useRef(null);
  useEffect(() => {
    setImgPreview(activeValue ? getMediaUrl(activeValue) : null);
    api_default.get("/content/ai_settings").then((r) => {
      if (r.data?.preferredImageProvider) {
        const p = r.data.preferredImageProvider;
        setProvider(p === "openai" ? "ChatGPT" : p === "google" ? "Nano Banana" : p === "stabilityai" ? "Stability AI" : p === "replicate" ? "Replicate" : p === "pollinations" ? "Pollinations" : "AI");
      } else {
        setProvider("Pollinations");
      }
    }).catch(() => {
      setProvider("Pollinations");
    });
  }, [activeValue]);
  const emit = (nextImages) => {
    const cleaned = normalizeImages(nextImages);
    onChange(multiple ? cleaned : cleaned[0] || "");
  };
  const handleFileChange = async (files) => {
    const selected = Array.from(files || []);
    if (selected.length === 0) return;
    const localUrl = URL.createObjectURL(selected[0]);
    setImgPreview(localUrl);
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of selected) {
        const fd = new FormData();
        fd.append("image", file);
        const r = await api_default.post("/uploads", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploaded.push(r.data.url);
      }
      emit(multiple ? [...images, ...uploaded] : uploaded.slice(-1));
    } catch (err) {
      setError(errorText(err, "Uploaden mislukt"));
      setImgPreview(activeValue ? getMediaUrl(activeValue) : null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const updateImageAt = (index, url) => {
    const next = [...images];
    next[index] = url;
    emit(next);
  };
  const handleAiImprove = async () => {
    if (!activeValue || !aiPrompt.trim()) return;
    setAiLoading(true);
    setError("");
    try {
      const r = await api_default.post("/products/improve-image", {
        imageUrl: activeValue,
        prompt: aiPrompt.trim()
      });
      updateImageAt(0, r.data.url);
      setAiPrompt("");
    } catch (err) {
      setError(errorText(err, "AI verbetering mislukt"));
    } finally {
      setAiLoading(false);
    }
  };
  const removeImage = (index = 0) => {
    emit(images.filter((_, i) => i !== index));
    setAiPrompt("");
    setError("");
  };
  const moveImage = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    emit(next);
  };
  const setPrimary = (index) => {
    if (index === 0) return;
    const next = [...images];
    const [selected] = next.splice(index, 1);
    emit([selected, ...next]);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, label && /* @__PURE__ */ React.createElement("label", { className: "block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]" }, label), /* @__PURE__ */ React.createElement("div", { className: `relative w-full ${height} rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group` }, imgPreview ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("img", { src: imgPreview, alt: "Preview", className: "w-full h-full object-cover" }), multiple && images.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "absolute left-2 top-2 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-black text-white" }, "Hoofdfoto"), (uploading || aiLoading) && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-2" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-6 h-6 text-blue-500 animate-spin" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-gray-600" }, uploading ? "Uploaden..." : "AI verbetert..."))), !uploading && !aiLoading && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => removeImage(0),
      className: "absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
    },
    /* @__PURE__ */ React.createElement(X, { size: 14 })
  )) : /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => fileRef.current?.click(),
      disabled: uploading,
      className: "w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
    },
    /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Upload, { size: 20 })),
    /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-gray-400" }, "Klik om te uploaden"),
    multiple && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-gray-300" }, "Meerdere foto's tegelijk mogelijk")
  )), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: fileRef,
      type: "file",
      accept: "image/*",
      multiple,
      className: "hidden",
      onChange: (e) => handleFileChange(e.target.files)
    }
  ), multiple && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => fileRef.current?.click(),
      disabled: uploading || aiLoading,
      className: "w-full py-2.5 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 text-xs font-black text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
    },
    "+ Foto's toevoegen"
  ), images.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2" }, images.map((url, index) => /* @__PURE__ */ React.createElement("div", { key: `${url}-${index}`, className: `relative aspect-square rounded-xl overflow-hidden border group/thumb ${index === 0 ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-100"}` }, /* @__PURE__ */ React.createElement("img", { src: getMediaUrl(url), alt: `Productfoto ${index + 1}`, className: "w-full h-full object-cover" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/45 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col justify-between p-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between gap-1" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => moveImage(index, -1), disabled: index === 0, className: "w-6 h-6 rounded-lg bg-white/90 text-gray-700 disabled:opacity-40 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 12 })), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => removeImage(index), className: "w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center" }, /* @__PURE__ */ React.createElement(X, { size: 12 })), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => moveImage(index, 1), disabled: index === images.length - 1, className: "w-6 h-6 rounded-lg bg-white/90 text-gray-700 disabled:opacity-40 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(ArrowRight, { size: 12 }))), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setPrimary(index), className: "rounded-lg bg-white/90 px-2 py-1 text-[9px] font-black text-gray-700 disabled:opacity-80", disabled: index === 0 }, index === 0 ? "Hoofdfoto" : "Maak hoofdfoto")))))), activeValue && !uploading && !aiLoading && /* @__PURE__ */ React.createElement("div", { className: "space-y-2 animate-in fade-in slide-in-from-top-2 duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-violet-500 uppercase tracking-widest flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Sparkles, { size: 10 }), " AI Verbetering via ", provider), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowQuickPrompts((v) => !v),
      className: "text-[10px] text-violet-400 hover:text-violet-600 font-bold flex items-center gap-0.5 transition-colors"
    },
    "Snelknoppen ",
    showQuickPrompts ? /* @__PURE__ */ React.createElement(ChevronUp, { size: 12 }) : /* @__PURE__ */ React.createElement(ChevronDown, { size: 12 })
  )), showQuickPrompts && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-1.5 pb-1" }, QUICK_PROMPTS.map((q) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: q.label,
      type: "button",
      onClick: () => {
        setAiPrompt(q.prompt);
        setShowQuickPrompts(false);
      },
      className: "text-left px-3 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-xl text-[11px] font-bold text-violet-700 transition-colors"
    },
    q.label
  ))), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: aiPrompt,
      onChange: (e) => setAiPrompt(e.target.value),
      placeholder: `Beschrijf de aanpassing...`,
      className: "w-full pl-4 pr-12 py-2.5 bg-violet-50 border border-violet-100 rounded-xl text-sm focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-violet-300",
      onKeyDown: (e) => e.key === "Enter" && (e.preventDefault(), handleAiImprove())
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleAiImprove,
      disabled: !aiPrompt.trim(),
      className: "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 disabled:bg-violet-200 transition-colors",
      title: `Verbeter met ${provider}`
    },
    /* @__PURE__ */ React.createElement(Wand2, { size: 14 })
  ))), error && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-500 font-bold" }, error));
}

// crm-frontend/src/pages/Pages.jsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Upload as Upload2,
  X as X2,
  Plus,
  Trash2,
  Save,
  Copy,
  ChevronDown as ChevronDown2,
  Home,
  Info,
  Phone,
  Settings,
  Image,
  CheckCircle,
  GripVertical,
  LayoutGrid,
  ShoppingBag
} from "lucide-react";
var iCls = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";
var taCls = "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white";
var iBdr = "border-gray-200";
function Field({ label, hint, children }) {
  return /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5" }, label), hint && /* @__PURE__ */ React2.createElement("p", { className: "text-xs text-gray-400 mb-1.5" }, hint), children);
}
function Section({ title, icon: Icon, children, defaultOpen = true, accent, dragHandleProps }) {
  const [open, setOpen] = useState2(defaultOpen);
  return /* @__PURE__ */ React2.createElement("div", { className: "rounded-2xl overflow-hidden", style: { border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" } }, /* @__PURE__ */ React2.createElement(
    "div",
    {
      className: "w-full px-5 py-3.5 flex items-center justify-between transition-colors hover:opacity-90",
      style: { background: accent || "linear-gradient(135deg,#1e293b,#334155)" }
    },
    /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-2.5" }, dragHandleProps && /* @__PURE__ */ React2.createElement(
      "span",
      {
        ...dragHandleProps,
        onClick: (e) => e.stopPropagation(),
        className: "text-white/60 cursor-grab active:cursor-grabbing",
        title: "Slepen"
      },
      /* @__PURE__ */ React2.createElement(GripVertical, { size: 14 })
    ), Icon && /* @__PURE__ */ React2.createElement(Icon, { size: 14, className: "text-white/60" }), /* @__PURE__ */ React2.createElement("h3", { className: "text-xs font-black text-white uppercase tracking-[0.15em]" }, title)),
    /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        onClick: () => setOpen((o) => !o),
        className: "p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors",
        title: open ? "Inklappen" : "Uitklappen"
      },
      /* @__PURE__ */ React2.createElement(ChevronDown2, { size: 14, className: `transition-transform duration-200 ${open ? "rotate-180" : ""}` })
    )
  ), open && /* @__PURE__ */ React2.createElement("div", { className: "p-5 space-y-4 bg-white" }, children));
}
function ImageField({ value, onChange, height = 36 }) {
  return /* @__PURE__ */ React2.createElement(ImageUploader, { value, onChange, label: null, height: `h-[${height * 4}px]` });
}
function SaveButton({ onSave, saving, saved }) {
  return /* @__PURE__ */ React2.createElement("div", { className: "flex justify-end pt-2" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: onSave,
      disabled: saving,
      className: "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50",
      style: { background: saved ? "linear-gradient(135deg,#065f46,#10b981)" : "linear-gradient(135deg,#1e40af,#3b82f6)", boxShadow: saved ? "0 4px 16px rgba(16,185,129,0.4)" : "0 4px 16px rgba(59,130,246,0.4)" }
    },
    saved ? /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(CheckCircle, { size: 15 }), " Opgeslagen!") : saving ? /* @__PURE__ */ React2.createElement(React2.Fragment, null, "Opslaan\u2026") : /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Save, { size: 15 }), " Opslaan")
  ));
}
function ItemCard({ number, onDuplicate, onDelete, children }) {
  return /* @__PURE__ */ React2.createElement("div", { className: "relative rounded-2xl p-4 space-y-4", style: { background: "#f8fafc", border: "1px solid #f1f5f9" } }, /* @__PURE__ */ React2.createElement("div", { className: "flex items-center justify-between mb-1" }, number !== void 0 && /* @__PURE__ */ React2.createElement(
    "span",
    {
      className: "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white",
      style: { background: "linear-gradient(135deg,#1e40af,#3b82f6)" }
    },
    number + 1
  ), /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-1 ml-auto" }, onDuplicate && /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: onDuplicate,
      className: "p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors",
      title: "Dupliceren"
    },
    /* @__PURE__ */ React2.createElement(Copy, { size: 13 })
  ), onDelete && /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: onDelete,
      className: "p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors",
      title: "Verwijderen"
    },
    /* @__PURE__ */ React2.createElement(Trash2, { size: 13 })
  ))), children);
}
function AddButton({ onClick, label }) {
  return /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick,
      className: "w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all"
    },
    /* @__PURE__ */ React2.createElement(Plus, { size: 15 }),
    " ",
    label
  );
}
function SortableSection({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return /* @__PURE__ */ React2.createElement("div", { ref: setNodeRef, style, className: isDragging ? "opacity-80" : "" }, children({ dragHandleProps: { ...attributes, ...listeners } }));
}
function SortableBuilderElement({ element, active, onSelect, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: element.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return /* @__PURE__ */ React2.createElement("div", { ref: setNodeRef, style, className: isDragging ? "opacity-80" : "" }, /* @__PURE__ */ React2.createElement("div", { className: "rounded-2xl overflow-hidden", style: { border: active ? "1px solid rgba(59,130,246,0.25)" : "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" } }, /* @__PURE__ */ React2.createElement("div", { className: "w-full px-5 py-3 flex items-center justify-between", style: { background: "linear-gradient(135deg,#1e293b,#334155)" } }, /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /* @__PURE__ */ React2.createElement("span", { ...attributes, ...listeners, className: "text-white/60 cursor-grab active:cursor-grabbing", title: "Slepen" }, /* @__PURE__ */ React2.createElement(GripVertical, { size: 14 })), /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => onSelect(element.id), className: "text-left min-w-0" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-xs font-black text-white uppercase tracking-[0.15em] truncate" }, element.type))), /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => onDelete(element.id),
      className: "p-2 rounded-xl text-white/40 hover:text-red-300 hover:bg-white/10 transition-colors",
      title: "Verwijderen"
    },
    /* @__PURE__ */ React2.createElement(Trash2, { size: 14 })
  ))));
}
function BuilderEditor({ blockId, data, onChangeData }) {
  const [activeElementId, setActiveElementId] = useState2(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const applyStylePreset = (preset) => {
    if (preset === "card_light") {
      onChangeData({ ...data || {}, background: "white", variant: "card", container: "normal", padding: "lg", gap: "md", elements });
      return;
    }
    if (preset === "dark_cta") {
      onChangeData({ ...data || {}, background: "dark", variant: "plain", container: "normal", padding: "lg", gap: "md", elements });
      return;
    }
    onChangeData({ ...data || {}, background: "white", variant: "plain", container: "wide", padding: "lg", gap: "md", elements });
  };
  const setBackground = (background) => {
    onChangeData({ ...data || {}, background, elements });
  };
  const setLayout = (patch) => {
    onChangeData({ ...data || {}, ...patch, background: data?.background || "white", elements });
  };
  const updateElement = (id, patch) => {
    onChangeData({
      ...data || {},
      background: data?.background,
      elements: elements.map((e) => e.id === id ? { ...e, ...patch } : e)
    });
  };
  const addElement = (type) => {
    const id = crypto.randomUUID();
    const defaults2 = type === "heading" ? { text: "Titel", level: 2, align: "left" } : type === "text" ? { text: "Tekst", align: "left" } : type === "image" ? { url: "", alt: "", rounded: true, size: "lg", align: "center", aspect: "16:9", fit: "cover", style: "shadow", height: 320 } : type === "button" ? { text: "Knop", href: "/contact", variant: "primary", align: "left" } : { size: 24 };
    const next = [...elements, { id, type, ...defaults2 }];
    onChangeData({ ...data || {}, background: data?.background, elements: next });
    setActiveElementId(id);
  };
  const deleteElement = (id) => {
    const next = elements.filter((e) => e.id !== id);
    onChangeData({ ...data || {}, background: data?.background, elements: next });
    if (activeElementId === id) setActiveElementId(null);
  };
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Achtergrond" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: data?.background || "white", onChange: (e) => setBackground(e.target.value) }, /* @__PURE__ */ React2.createElement("option", { value: "white" }, "Wit"), /* @__PURE__ */ React2.createElement("option", { value: "gray" }, "Grijs"), /* @__PURE__ */ React2.createElement("option", { value: "dark" }, "Donker"))), /* @__PURE__ */ React2.createElement(Field, { label: "Stijl" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: data?.variant || "plain", onChange: (e) => setLayout({ variant: e.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "plain" }, "Normaal"), /* @__PURE__ */ React2.createElement("option", { value: "card" }, "Card"))), /* @__PURE__ */ React2.createElement(Field, { label: "Container" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: data?.container || "wide", onChange: (e) => setLayout({ container: e.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "narrow" }, "Smal"), /* @__PURE__ */ React2.createElement("option", { value: "normal" }, "Normaal"), /* @__PURE__ */ React2.createElement("option", { value: "wide" }, "Breed"))), /* @__PURE__ */ React2.createElement(Field, { label: "Spacing" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: data?.gap || "md", onChange: (e) => setLayout({ gap: e.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "sm" }, "Compact"), /* @__PURE__ */ React2.createElement("option", { value: "md" }, "Normaal"), /* @__PURE__ */ React2.createElement("option", { value: "lg" }, "Ruim")))), /* @__PURE__ */ React2.createElement("div", { className: "flex flex-wrap gap-2" }, /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => applyStylePreset("default"), className: "px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50" }, "Default"), /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => applyStylePreset("card_light"), className: "px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50" }, "Card"), /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => applyStylePreset("dark_cta"), className: "px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50" }, "Donker")), /* @__PURE__ */ React2.createElement("div", { className: "flex flex-wrap gap-2" }, /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => addElement("heading"), className: "px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50" }, "Titel"), /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => addElement("text"), className: "px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50" }, "Tekst"), /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => addElement("image"), className: "px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50" }, "Afbeelding"), /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => addElement("button"), className: "px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50" }, "Knop"), /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => addElement("divider"), className: "px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50" }, "Divider"), /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => addElement("spacer"), className: "px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 hover:bg-gray-50" }, "Spacer")), /* @__PURE__ */ React2.createElement(
    DndContext,
    {
      sensors,
      collisionDetection: closestCenter,
      onDragEnd: (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = elements.findIndex((e) => e.id === active.id);
        const newIndex = elements.findIndex((e) => e.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        onChangeData({ ...data || {}, background: data?.background, elements: arrayMove(elements, oldIndex, newIndex) });
      }
    },
    /* @__PURE__ */ React2.createElement(SortableContext, { items: elements.map((e) => e.id), strategy: verticalListSortingStrategy }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, elements.map((e) => /* @__PURE__ */ React2.createElement("div", { key: e.id, className: "space-y-2" }, /* @__PURE__ */ React2.createElement(
      SortableBuilderElement,
      {
        element: e,
        active: activeElementId === e.id,
        onSelect: (id) => setActiveElementId((p) => p === id ? null : id),
        onDelete: deleteElement
      }
    ), activeElementId === e.id && /* @__PURE__ */ React2.createElement("div", { className: "px-5 py-4 rounded-2xl bg-white", style: { border: "1px solid #f1f5f9" } }, e.type === "heading" && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: e.text || "", onChange: (ev) => updateElement(e.id, { text: ev.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Grootte" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: String(e.level || 2), onChange: (ev) => updateElement(e.id, { level: Number(ev.target.value) }) }, /* @__PURE__ */ React2.createElement("option", { value: "2" }, "H2"), /* @__PURE__ */ React2.createElement("option", { value: "3" }, "H3"), /* @__PURE__ */ React2.createElement("option", { value: "4" }, "H4"))), /* @__PURE__ */ React2.createElement(Field, { label: "Uitlijning" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.align || "left", onChange: (ev) => updateElement(e.id, { align: ev.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "left" }, "Links"), /* @__PURE__ */ React2.createElement("option", { value: "center" }, "Midden")))), e.type === "text" && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement("div", { className: "sm:col-span-2" }, /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 5, value: e.text || "", onChange: (ev) => updateElement(e.id, { text: ev.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Uitlijning" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.align || "left", onChange: (ev) => updateElement(e.id, { align: ev.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "left" }, "Links"), /* @__PURE__ */ React2.createElement("option", { value: "center" }, "Midden")))), e.type === "image" && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Afbeelding" }, /* @__PURE__ */ React2.createElement(ImageField, { value: e.url || "", onChange: (v) => updateElement(e.id, { url: v }), height: 20 })), /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Alt tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: e.alt || "", onChange: (ev) => updateElement(e.id, { alt: ev.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Breedte (px)" }, /* @__PURE__ */ React2.createElement(
      "input",
      {
        className: `${iCls} ${iBdr}`,
        value: e.widthPx ?? "",
        onChange: (ev) => {
          const v = ev.target.value;
          const n = v === "" ? void 0 : Number(v);
          updateElement(e.id, { widthPx: Number.isFinite(n) ? n : void 0 });
        },
        placeholder: "bv. 720",
        inputMode: "numeric"
      }
    )), /* @__PURE__ */ React2.createElement(Field, { label: "Hoogte (px)" }, /* @__PURE__ */ React2.createElement(
      "input",
      {
        className: `${iCls} ${iBdr}`,
        value: e.heightPx ?? "",
        onChange: (ev) => {
          const v = ev.target.value;
          const n = v === "" ? void 0 : Number(v);
          updateElement(e.id, { heightPx: Number.isFinite(n) ? n : void 0 });
        },
        placeholder: "bv. 360",
        inputMode: "numeric"
      }
    ))), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Breedte" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.size || "lg", onChange: (ev) => updateElement(e.id, { size: ev.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "sm" }, "S"), /* @__PURE__ */ React2.createElement("option", { value: "md" }, "M"), /* @__PURE__ */ React2.createElement("option", { value: "lg" }, "L"), /* @__PURE__ */ React2.createElement("option", { value: "xl" }, "XL"), /* @__PURE__ */ React2.createElement("option", { value: "full" }, "Vol"))), /* @__PURE__ */ React2.createElement(Field, { label: "Uitlijning" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.align || "center", onChange: (ev) => updateElement(e.id, { align: ev.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "left" }, "Links"), /* @__PURE__ */ React2.createElement("option", { value: "center" }, "Midden"), /* @__PURE__ */ React2.createElement("option", { value: "right" }, "Rechts")))), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Aspect ratio" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.aspect || "16:9", onChange: (ev) => updateElement(e.id, { aspect: ev.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "auto" }, "Auto"), /* @__PURE__ */ React2.createElement("option", { value: "16:9" }, "16:9"), /* @__PURE__ */ React2.createElement("option", { value: "4:3" }, "4:3"), /* @__PURE__ */ React2.createElement("option", { value: "1:1" }, "1:1"))), /* @__PURE__ */ React2.createElement(Field, { label: "Fit" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.fit || "cover", onChange: (ev) => updateElement(e.id, { fit: ev.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "cover" }, "Cover"), /* @__PURE__ */ React2.createElement("option", { value: "contain" }, "Contain")))), String(e.aspect || "16:9") === "auto" && /* @__PURE__ */ React2.createElement(Field, { label: "Hoogte" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: String(e.height || 320), onChange: (ev) => updateElement(e.id, { height: Number(ev.target.value) }) }, /* @__PURE__ */ React2.createElement("option", { value: "180" }, "S"), /* @__PURE__ */ React2.createElement("option", { value: "240" }, "M"), /* @__PURE__ */ React2.createElement("option", { value: "320" }, "L"), /* @__PURE__ */ React2.createElement("option", { value: "420" }, "XL"))), /* @__PURE__ */ React2.createElement(Field, { label: "Hoeken" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.rounded === false ? "square" : "rounded", onChange: (ev) => updateElement(e.id, { rounded: ev.target.value !== "square" }) }, /* @__PURE__ */ React2.createElement("option", { value: "rounded" }, "Rond"), /* @__PURE__ */ React2.createElement("option", { value: "square" }, "Vierkant"))), /* @__PURE__ */ React2.createElement(Field, { label: "Stijl" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.style || "shadow", onChange: (ev) => updateElement(e.id, { style: ev.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "plain" }, "Zonder"), /* @__PURE__ */ React2.createElement("option", { value: "frame" }, "Frame"), /* @__PURE__ */ React2.createElement("option", { value: "shadow" }, "Shadow"))))), e.type === "button" && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: e.text || "", onChange: (ev) => updateElement(e.id, { text: ev.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Link" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: e.href || "", onChange: (ev) => updateElement(e.id, { href: ev.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Stijl" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.variant || "primary", onChange: (ev) => updateElement(e.id, { variant: ev.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "primary" }, "Primair"), /* @__PURE__ */ React2.createElement("option", { value: "secondary" }, "Secundair"))), /* @__PURE__ */ React2.createElement(Field, { label: "Uitlijning" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: e.align || "left", onChange: (ev) => updateElement(e.id, { align: ev.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "left" }, "Links"), /* @__PURE__ */ React2.createElement("option", { value: "center" }, "Midden")))), e.type === "spacer" && /* @__PURE__ */ React2.createElement(Field, { label: "Hoogte" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: String(e.size || 24), onChange: (ev) => updateElement(e.id, { size: Number(ev.target.value) }) }, /* @__PURE__ */ React2.createElement("option", { value: "12" }, "12px"), /* @__PURE__ */ React2.createElement("option", { value: "24" }, "24px"), /* @__PURE__ */ React2.createElement("option", { value: "36" }, "36px"), /* @__PURE__ */ React2.createElement("option", { value: "48" }, "48px"), /* @__PURE__ */ React2.createElement("option", { value: "64" }, "64px"))))))))
  ), /* @__PURE__ */ React2.createElement("div", { className: "rounded-2xl overflow-hidden", style: { border: "1px solid #f1f5f9" } }, /* @__PURE__ */ React2.createElement("div", { className: "px-5 py-3", style: { background: "#f8fafc" } }, /* @__PURE__ */ React2.createElement("p", { className: "text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]" }, "Preview")), /* @__PURE__ */ React2.createElement("div", { className: "p-5 bg-white" }, /* @__PURE__ */ React2.createElement("div", { className: `${data?.background === "dark" ? "bg-secondary text-white" : data?.background === "gray" ? "bg-gray-50 text-secondary" : "bg-white text-secondary"} ${data?.variant === "card" ? "rounded-3xl p-10" : "rounded-3xl p-8"}`, style: { border: "1px solid #f1f5f9" } }, /* @__PURE__ */ React2.createElement("div", { className: `${data?.gap === "sm" ? "space-y-3" : data?.gap === "lg" ? "space-y-8" : "space-y-4"}` }, elements.map((e) => {
    if (!e || !e.type) return null;
    if (e.type === "spacer") return /* @__PURE__ */ React2.createElement("div", { key: e.id, style: { height: Number(e.size) || 24 } });
    if (e.type === "heading") {
      const level = Number(e.level) || 2;
      const cls = level === 3 ? "text-2xl font-black" : level === 4 ? "text-xl font-black" : "text-3xl font-black";
      const align = e.align === "center" ? "text-center" : "text-left";
      const Tag = level === 4 ? "h4" : level === 3 ? "h3" : "h2";
      return /* @__PURE__ */ React2.createElement(Tag, { key: e.id, className: `${cls} ${align}` }, e.text);
    }
    if (e.type === "text") {
      const align = e.align === "center" ? "text-center" : "text-left";
      return /* @__PURE__ */ React2.createElement("p", { key: e.id, className: `${data?.background === "dark" ? "text-white/70" : "text-gray-500"} ${align}` }, e.text);
    }
    if (e.type === "image") {
      if (!e.url) return null;
      const maxWidth = e.size === "sm" ? 420 : e.size === "md" ? 640 : e.size === "xl" ? 1024 : e.size === "full" ? "100%" : 800;
      const explicitW = Number(e.widthPx);
      const explicitH = Number(e.heightPx);
      const computedMaxWidth = Number.isFinite(explicitW) && explicitW > 0 ? explicitW : maxWidth;
      const align = e.align === "left" ? "justify-start" : e.align === "right" ? "justify-end" : "justify-center";
      const ratio = e.aspect === "4:3" ? "4 / 3" : e.aspect === "1:1" ? "1 / 1" : e.aspect === "auto" ? null : "16 / 9";
      const frame = e.style === "frame";
      const shadow = e.style === "shadow";
      return /* @__PURE__ */ React2.createElement("div", { key: e.id, className: `flex ${align}` }, /* @__PURE__ */ React2.createElement("div", { style: { width: "100%", maxWidth: computedMaxWidth } }, /* @__PURE__ */ React2.createElement(
        "div",
        {
          className: `overflow-hidden ${e.rounded === false ? "rounded-xl" : "rounded-3xl"} ${shadow ? "shadow-2xl" : ""}`,
          style: {
            border: frame ? data?.background === "dark" ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0" : "none",
            aspectRatio: Number.isFinite(explicitH) && explicitH > 0 ? void 0 : ratio || void 0,
            height: Number.isFinite(explicitH) && explicitH > 0 ? explicitH : ratio ? void 0 : Number(e.height) || 320,
            background: data?.background === "dark" ? "rgba(255,255,255,0.06)" : "#f8fafc"
          }
        },
        /* @__PURE__ */ React2.createElement(
          "img",
          {
            src: e.url,
            alt: e.alt || "",
            className: "w-full h-full",
            style: { objectFit: e.fit === "contain" ? "contain" : "cover" }
          }
        )
      )));
    }
    if (e.type === "button") {
      const variant = e.variant || "primary";
      const className = variant === "secondary" ? data?.background === "dark" ? "px-6 py-3 bg-white/10 border border-white/20 text-white rounded-full font-black text-sm inline-flex" : "px-6 py-3 bg-secondary text-white rounded-full font-black text-sm inline-flex" : "px-6 py-3 bg-primary text-white rounded-full font-black text-sm inline-flex";
      const align = e.align === "center" ? "justify-center" : "justify-start";
      return /* @__PURE__ */ React2.createElement("div", { key: e.id, className: `flex ${align}` }, /* @__PURE__ */ React2.createElement("span", { className }, e.text));
    }
    if (e.type === "divider") {
      return /* @__PURE__ */ React2.createElement("div", { key: e.id, className: `h-px w-full ${data?.background === "dark" ? "bg-white/10" : "bg-gray-100"}` });
    }
    return null;
  }))))));
}
function BannerEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.heading || "", onChange: (e) => set({ heading: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: d.subtext || "", onChange: (e) => set({ subtext: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Knop" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.buttonText || "", onChange: (e) => set({ buttonText: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Achtergrond kleur" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.bgColor || "", onChange: (e) => set({ bgColor: e.target.value }), placeholder: "#0c4684" })), /* @__PURE__ */ React2.createElement(Field, { label: "Tekst kleur" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.textColor || "", onChange: (e) => set({ textColor: e.target.value }), placeholder: "#ffffff" }))));
}
function TextBlockEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.heading || "", onChange: (e) => set({ heading: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 6, value: d.body || "", onChange: (e) => set({ body: e.target.value }) })));
}
function FeatureGridEditor({ data, onChange }) {
  const d = data || {};
  const items = Array.isArray(d.items) ? d.items : [];
  const set = (patch) => onChange({ ...d, ...patch });
  const setItems = (next) => set({ items: next });
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.heading || "", onChange: (e) => set({ heading: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, items.map((it, i) => /* @__PURE__ */ React2.createElement(
    ItemCard,
    {
      key: i,
      number: i,
      onDuplicate: () => setItems([...items.slice(0, i + 1), { ...items[i] || {} }, ...items.slice(i + 1)]),
      onDelete: () => setItems(items.filter((_, j) => j !== i))
    },
    /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Icoon" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.icon || "", onChange: (e) => {
      const a = [...items];
      a[i] = { ...a[i], icon: e.target.value };
      setItems(a);
    }, placeholder: "\u26A1" })), /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.title || "", onChange: (e) => {
      const a = [...items];
      a[i] = { ...a[i], title: e.target.value };
      setItems(a);
    } })), /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.description || "", onChange: (e) => {
      const a = [...items];
      a[i] = { ...a[i], description: e.target.value };
      setItems(a);
    } })))
  )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setItems([...items, { icon: "\u2728", title: "", description: "" }]), label: "Item toevoegen" })));
}
function ImageTextEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.heading || "", onChange: (e) => set({ heading: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Afbeelding positie" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: d.imagePosition || "left", onChange: (e) => set({ imagePosition: e.target.value }) }, /* @__PURE__ */ React2.createElement("option", { value: "left" }, "Links"), /* @__PURE__ */ React2.createElement("option", { value: "right" }, "Rechts")))), /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 5, value: d.body || "", onChange: (e) => set({ body: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Afbeelding" }, /* @__PURE__ */ React2.createElement(ImageField, { value: d.imageUrl || "", onChange: (v) => set({ imageUrl: v }), height: 22 })));
}
function StatsRowEditor({ data, onChange }) {
  const d = data || {};
  const items = Array.isArray(d.items) ? d.items : [];
  const setItems = (next) => onChange({ ...d, items: next });
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, items.map((it, i) => /* @__PURE__ */ React2.createElement(
    ItemCard,
    {
      key: i,
      number: i,
      onDuplicate: () => setItems([...items.slice(0, i + 1), { ...items[i] || {} }, ...items.slice(i + 1)]),
      onDelete: () => setItems(items.filter((_, j) => j !== i))
    },
    /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Nummer" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.number || "", onChange: (e) => {
      const a = [...items];
      a[i] = { ...a[i], number: e.target.value };
      setItems(a);
    } })), /* @__PURE__ */ React2.createElement(Field, { label: "Label" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.label || "", onChange: (e) => {
      const a = [...items];
      a[i] = { ...a[i], label: e.target.value };
      setItems(a);
    } })))
  )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setItems([...items, { number: "", label: "" }]), label: "Stat toevoegen" }));
}
function CtaBlockEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.heading || "", onChange: (e) => set({ heading: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: d.subtext || "", onChange: (e) => set({ subtext: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Primaire knop" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.primaryButton || "", onChange: (e) => set({ primaryButton: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Secundaire knop" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.secondaryButton || "", onChange: (e) => set({ secondaryButton: e.target.value }) }))));
}
function StepsEditor({ data, onChange }) {
  const d = data || {};
  const items = Array.isArray(d.items) ? d.items : [];
  const set = (patch) => onChange({ ...d, ...patch });
  const setItems = (next) => set({ items: next });
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.heading || "", onChange: (e) => set({ heading: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, items.map((it, i) => /* @__PURE__ */ React2.createElement(
    ItemCard,
    {
      key: i,
      number: i,
      onDuplicate: () => setItems([...items.slice(0, i + 1), { ...items[i] || {} }, ...items.slice(i + 1)]),
      onDelete: () => setItems(items.filter((_, j) => j !== i))
    },
    /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Nummer" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.number || String(i + 1), onChange: (e) => {
      const a = [...items];
      a[i] = { ...a[i], number: e.target.value };
      setItems(a);
    } })), /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.title || "", onChange: (e) => {
      const a = [...items];
      a[i] = { ...a[i], title: e.target.value };
      setItems(a);
    } })), /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.description || "", onChange: (e) => {
      const a = [...items];
      a[i] = { ...a[i], description: e.target.value };
      setItems(a);
    } })))
  )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setItems([...items, { number: String(items.length + 1), title: "", description: "" }]), label: "Stap toevoegen" })));
}
function BlogPostEditor({ data, onChange }) {
  const d = data || {};
  const set = (patch) => onChange({ ...d, ...patch });
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.title || "", onChange: (e) => set({ title: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Excerpt" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: d.excerpt || "", onChange: (e) => set({ excerpt: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Datum" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.date || "", onChange: (e) => set({ date: e.target.value }), placeholder: "2026-01-01" })), /* @__PURE__ */ React2.createElement(Field, { label: "Auteur" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: d.author || "", onChange: (e) => set({ author: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Afbeelding" }, /* @__PURE__ */ React2.createElement(ImageField, { value: d.imageUrl || "", onChange: (v) => set({ imageUrl: v }), height: 22 })));
}
function BlockFormEditor({ type, data, onChange }) {
  if (type === "banner") return /* @__PURE__ */ React2.createElement(BannerEditor, { data, onChange });
  if (type === "text_block") return /* @__PURE__ */ React2.createElement(TextBlockEditor, { data, onChange });
  if (type === "feature_grid") return /* @__PURE__ */ React2.createElement(FeatureGridEditor, { data, onChange });
  if (type === "image_text") return /* @__PURE__ */ React2.createElement(ImageTextEditor, { data, onChange });
  if (type === "stats_row") return /* @__PURE__ */ React2.createElement(StatsRowEditor, { data, onChange });
  if (type === "cta_block") return /* @__PURE__ */ React2.createElement(CtaBlockEditor, { data, onChange });
  if (type === "steps") return /* @__PURE__ */ React2.createElement(StepsEditor, { data, onChange });
  if (type === "blog_post") return /* @__PURE__ */ React2.createElement(BlogPostEditor, { data, onChange });
  return null;
}
function hasFormEditor(type) {
  return ["banner", "text_block", "feature_grid", "image_text", "stats_row", "cta_block", "steps", "blog_post"].includes(type);
}
function SortableBlockCard({ block, active, draft, error, mountOptions, onSelect, onDuplicate, onDelete, onChangeType, onToggleVisible, onChangeMount, onChangeDraft }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return /* @__PURE__ */ React2.createElement(
    "div",
    {
      ref: setNodeRef,
      className: `rounded-2xl overflow-hidden transition-all ${isDragging ? "opacity-80" : ""}`,
      style: { ...style, border: active ? "1px solid rgba(59,130,246,0.25)" : "1px solid #f1f5f9", boxShadow: active ? "0 6px 24px rgba(59,130,246,0.12)" : "0 2px 12px rgba(0,0,0,0.04)" }
    },
    /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        onClick: () => onSelect(block.id),
        className: "w-full px-5 py-3.5 flex items-center justify-between transition-colors hover:opacity-90",
        style: { background: "linear-gradient(135deg,#1e293b,#334155)" }
      },
      /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /* @__PURE__ */ React2.createElement(
        "span",
        {
          ...attributes,
          ...listeners,
          className: "text-white/60 shrink-0",
          title: "Slepen"
        },
        /* @__PURE__ */ React2.createElement(GripVertical, { size: 14 })
      ), /* @__PURE__ */ React2.createElement("h3", { className: "text-xs font-black text-white uppercase tracking-[0.15em] truncate" }, block.type, block.visible === false ? " (verborgen)" : "")),
      /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-1.5 shrink-0" }, /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            onDuplicate(block.id);
          },
          className: "p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors",
          title: "Dupliceren"
        },
        /* @__PURE__ */ React2.createElement(Copy, { size: 14 })
      ), /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            onDelete(block.id);
          },
          className: "p-1.5 rounded-lg text-white/40 hover:text-red-300 hover:bg-white/10 transition-colors",
          title: "Verwijderen"
        },
        /* @__PURE__ */ React2.createElement(Trash2, { size: 14 })
      ), /* @__PURE__ */ React2.createElement(ChevronDown2, { size: 14, className: `text-white/40 transition-transform duration-200 ${active ? "rotate-180" : ""}` }))
    ),
    active && /* @__PURE__ */ React2.createElement("div", { className: "p-4 border-t border-gray-100 bg-white space-y-3" }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Type" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: block.type, onChange: (e) => onChangeType(block.id, e.target.value) }, ["banner", "text_block", "feature_grid", "image_text", "stats_row", "cta_block", "steps", "blog_post", "layout_builder"].map((t) => /* @__PURE__ */ React2.createElement("option", { key: t, value: t }, t)))), /* @__PURE__ */ React2.createElement(Field, { label: "Plaatsing" }, /* @__PURE__ */ React2.createElement(
      "select",
      {
        className: `${iCls} ${iBdr}`,
        value: block.mount || mountOptions?.[0]?.value || "end",
        onChange: (e) => onChangeMount(block.id, e.target.value)
      },
      (mountOptions || [{ value: "end", label: "Onder aan pagina" }]).map((o) => /* @__PURE__ */ React2.createElement("option", { key: o.value, value: o.value }, o.label))
    )), /* @__PURE__ */ React2.createElement(Field, { label: "Zichtbaar" }, /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        onClick: () => onToggleVisible(block.id),
        className: `w-full px-4 py-2.5 rounded-xl text-sm font-black transition-colors ${block.visible === false ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}`
      },
      block.visible === false ? "Verborgen" : "Zichtbaar"
    ))), error && /* @__PURE__ */ React2.createElement("div", { className: "px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold" }, String(error)), /* @__PURE__ */ React2.createElement(Field, { label: "Data (JSON)" }, /* @__PURE__ */ React2.createElement(
      "textarea",
      {
        className: `${taCls} ${iBdr}`,
        rows: 10,
        value: draft,
        onChange: (e) => onChangeDraft(block.id, e.target.value),
        placeholder: '{\n  "heading": "..." \n}'
      }
    )))
  );
}
var HOME_DEFAULTS = {
  hero: { title: "Kwaliteit die straalt.", titlePrefix: "Verlichting voor", subtitle: "", backgroundImage: "", primaryButtonText: "START PROJECT", secondaryButtonText: "BEKIJK CASES", typewriterWords: ["bedrijfswagens.", "bouwplaatsen.", "werkplaatsen.", "professionals."] },
  introduction: { badge: "Duurzame Toekomst", marqueeText: "LED SPECIALISTS" },
  introSection: { badge: "Over ALRA LED", heading: "Professionele LED-oplossingen voor de moderne werkplek", description: "Wij zijn specialist in hoogwaardige LED-verlichting voor bedrijfswagens, bouwplaatsen en werkplaatsen.", linkText: "Meer over ons", deliveryTitle: "Direct leverbaar uit voorraad", deliverySubtitle: "Snelle levering in heel Nederland en Belgi\xEB" },
  dealersCta: { title: "Waar te koop?", subtitle: "Vind een verkooppunt bij jou in de buurt.", buttonText: "Bekijk verkooppunten" },
  specializations: [],
  stats: [],
  process: { title: "", description: "", buttonText: "", steps: [] },
  highlights: {
    title: "",
    subtitle: "",
    items: []
  },
  cta: { title: "", subtitle: "", primaryButton: "", secondaryButton: "" }
};
var SHOP_DEFAULTS = {
  hero: {
    eyebrow: "Onze collectie",
    title: "LED verlichting",
    titleAccent: "voor elke toepassing",
    subtitle: "Krachtig. Betrouwbaar. Voor professionals. Rechtstreeks van de fabrikant voor de beste prijs.",
    imageUrl: "",
    usps: [
      { title: "Snel geleverd", text: "Uit voorraad leverbaar" },
      { title: "Garantie", text: "Kwaliteit verzekerd" },
      { title: "Voor professionals", text: "Scherpe prijzen" },
      { title: "Persoonlijk advies", text: "Wij denken met je mee" }
    ]
  }
};
var BLOCK_PRESETS = {
  banner_primary: {
    label: "Banner \u2013 Primair",
    type: "banner",
    data: {
      heading: "Klaar voor een upgrade?",
      subtext: "Neem contact op voor advies of een oplossing op maat.",
      buttonText: "Neem contact op",
      bgColor: "#0c4684",
      textColor: "#ffffff"
    }
  },
  banner_dark: {
    label: "Banner \u2013 Donker",
    type: "banner",
    data: {
      heading: "Professionele LED-oplossingen",
      subtext: "Kwaliteit, duurzaamheid en betrouwbare prestaties.",
      buttonText: "Offerte aanvragen",
      bgColor: "#0f172a",
      textColor: "#ffffff"
    }
  },
  text_block_intro: {
    label: "Tekstblok \u2013 Intro",
    type: "text_block",
    data: {
      heading: "Waarom kiezen voor ALRA LED?",
      body: "Wij leveren professionele LED-verlichting voor de moderne werkplek.\n\nVoeg hier je eigen tekst toe."
    }
  },
  feature_grid_3: {
    label: "Voordelen grid \u2013 3 items",
    type: "feature_grid",
    data: {
      heading: "Voordelen",
      items: [
        { icon: "\u26A1", title: "Hoge lichtopbrengst", description: "Helder, effici\xEBnt en betrouwbaar." },
        { icon: "\u{1F6E1}\uFE0F", title: "Duurzaam", description: "Gemaakt voor intensief professioneel gebruik." },
        { icon: "\u{1F527}", title: "Maatwerk", description: "Wij denken mee van idee tot oplossing." }
      ]
    }
  },
  image_text_left: {
    label: "Afbeelding + tekst \u2013 Links",
    type: "image_text",
    data: {
      heading: "Project in beeld",
      body: "Beschrijf hier een toepassing, product of resultaat.\n\nJe kan meerdere regels gebruiken.",
      imageUrl: "",
      imagePosition: "left"
    }
  },
  stats_row_4: {
    label: "Statistieken \u2013 4 items",
    type: "stats_row",
    data: {
      items: [
        { number: "2014", label: "Opgericht" },
        { number: "225+", label: "Partners" },
        { number: "A++", label: "Kwaliteit" },
        { number: "2018", label: "Eigen lijn" }
      ]
    }
  },
  cta_contact: {
    label: "CTA \u2013 Contact",
    type: "cta_block",
    data: {
      heading: "Hulp nodig bij jouw project?",
      subtext: "Laat je adviseren door onze specialisten.",
      primaryButton: "Contact",
      secondaryButton: "Webshop"
    }
  },
  blog_post: {
    label: "Blogbericht",
    type: "blog_post",
    data: {
      title: "Titel van het artikel",
      excerpt: "Korte samenvatting van het artikel.",
      date: "2026-01-01",
      author: "ALRA LED",
      imageUrl: ""
    }
  },
  layout_builder: {
    label: "Layout builder",
    type: "layout_builder",
    data: {
      background: "white",
      elements: [
        { id: "e1", type: "heading", text: "Titel", level: 2, align: "left" },
        { id: "e2", type: "text", text: "Tekst", align: "left" }
      ]
    }
  }
};
var TABS = [
  { id: "home", label: "Homepagina", icon: Home },
  { id: "shop", label: "Webshop", icon: ShoppingBag },
  { id: "about", label: "Over Ons", icon: Info },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "general", label: "Instellingen", icon: Settings },
  { id: "logos", label: "Partner Logo's", icon: Image }
];
var DEFAULT_HOME_LAYOUT = [
  "hero",
  "intro_banner",
  "over_ons",
  "cases",
  "stats",
  "logos",
  "featured",
  "testimonials",
  "process",
  "highlights",
  "cta",
  "dealers_cta"
];
function Pages() {
  const [tab, setTab] = useState2("home");
  const [lang, setLang] = useState2("nl");
  const [saving, setSaving] = useState2(false);
  const [saved, setSaved] = useState2(false);
  const [loading, setLoading] = useState2(false);
  const [homeAllSaving, setHomeAllSaving] = useState2(false);
  const [homeAllSaved, setHomeAllSaved] = useState2(false);
  const [homeLayoutRaw, setHomeLayoutRaw] = useState2(null);
  const [homeSectionOrder, setHomeSectionOrder] = useState2(DEFAULT_HOME_LAYOUT);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [home, setHome] = useState2(HOME_DEFAULTS);
  const [pageBlocks, setPageBlocks] = useState2([]);
  const [blocksLoading, setBlocksLoading] = useState2(false);
  const [blocksSaving, setBlocksSaving] = useState2(false);
  const [blocksSaved, setBlocksSaved] = useState2(false);
  const [activeBlockId, setActiveBlockId] = useState2(null);
  const [showNewBlock, setShowNewBlock] = useState2(false);
  const [newBlockPreset, setNewBlockPreset] = useState2("banner_primary");
  const [newBlockSearch, setNewBlockSearch] = useState2("");
  const [blockDrafts, setBlockDrafts] = useState2({});
  const [blockErrors, setBlockErrors] = useState2({});
  const [about, setAbout] = useState2({ eyebrow: "", title: "", description: "", image: "", stats: [], values: [], timelineTitle: "", timeline: [] });
  const [contact, setContact] = useState2({
    eyebrow: "",
    title: "",
    description: "",
    detailsTitle: "",
    addressLabel: "",
    phoneLabel: "",
    emailLabel: "",
    callTitle: "",
    callText: "",
    companyDetails: "",
    kvkLabel: "",
    vatLabel: "",
    kvkValue: "",
    vatValue: "",
    phone: "",
    email: "",
    address: "",
    successTitle: "",
    successText: "",
    newMessage: "",
    form: {
      nameLabel: "",
      emailLabel: "",
      subjectLabel: "",
      messageLabel: "",
      namePlaceholder: "",
      emailPlaceholder: "",
      subjectPlaceholder: "",
      messagePlaceholder: "",
      submit: ""
    }
  });
  const [general, setGeneral] = useState2({
    tagline: "",
    footerDescription: "",
    footerPhone: "",
    footerEmail: "",
    footerAddress: "",
    newsletterTitle: "",
    newsletterText: "",
    newsletterPlaceholder: "",
    newsletterButton: "",
    navigationTitle: "",
    productsTitle: "",
    contactTitle: "",
    productLinks: [],
    privacyLabel: "",
    termsLabel: "",
    bottomCopy: "",
    logoUrl: "",
    webkeurmerkId: ""
  });
  const [logos, setLogos] = useState2([]);
  const [logoUploading, setLogoUploading] = useState2(false);
  const [shop, setShop] = useState2(SHOP_DEFAULTS);
  const setShopHero = (v) => setShop((p) => ({
    ...p,
    hero: { ...SHOP_DEFAULTS.hero, ...p && p.hero || {}, ...v }
  }));
  const loadTab = async (key) => {
    setLoading(true);
    try {
      const res = await api_default.get(`/content/${key}`, { params: { lang } });
      if (key === "home") setHome({ ...HOME_DEFAULTS, ...res.data });
      if (key === "shop") setShop({ ...SHOP_DEFAULTS, ...res.data });
      if (key === "about") setAbout(res.data);
      if (key === "contact") setContact(res.data);
      if (key === "general") setGeneral(res.data);
      if (key === "logos") setLogos(Array.isArray(res.data) ? res.data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  useEffect2(() => {
    loadTab(tab);
  }, [tab, lang]);
  const save = async (key, value) => {
    setSaving(true);
    try {
      await api_default.put(`/content/${key}`, value, { params: { lang } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  const saveHomeAll = async () => {
    if (Object.keys(blockErrors).length > 0) return;
    setHomeAllSaving(true);
    try {
      await api_default.put("/content/home", home, { params: { lang } });
      await api_default.put("/content/page_blocks_home", pageBlocks, { params: { lang } });
      await api_default.put("/content/layout_home_sections", homeSectionOrder, { params: { lang } });
      setHomeAllSaved(true);
      setTimeout(() => setHomeAllSaved(false), 2500);
    } catch {
    } finally {
      setHomeAllSaving(false);
    }
  };
  useEffect2(() => {
    if (showNewBlock) setNewBlockSearch("");
  }, [showNewBlock]);
  useEffect2(() => {
    const pageKey = tab === "home" ? "page_blocks_home" : tab === "about" ? "page_blocks_about" : tab === "contact" ? "page_blocks_contact" : null;
    if (!pageKey) return;
    setBlocksLoading(true);
    api_default.get(`/content/${pageKey}`, { params: { lang } }).then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setPageBlocks(list);
      const nextDrafts = {};
      list.forEach((b) => {
        nextDrafts[b.id] = JSON.stringify(b.data || {}, null, 2);
      });
      setBlockDrafts(nextDrafts);
      setBlockErrors({});
      setActiveBlockId(null);
    }).catch(() => {
      setPageBlocks([]);
      setBlockDrafts({});
      setBlockErrors({});
      setActiveBlockId(null);
    }).finally(() => setBlocksLoading(false));
  }, [tab, lang]);
  const saveHomeBlocks = async () => {
    const pageKey = tab === "home" ? "page_blocks_home" : tab === "about" ? "page_blocks_about" : tab === "contact" ? "page_blocks_contact" : null;
    if (!pageKey) return;
    setBlocksSaving(true);
    try {
      await api_default.put(`/content/${pageKey}`, pageBlocks, { params: { lang } });
      setBlocksSaved(true);
      setTimeout(() => setBlocksSaved(false), 2500);
    } catch {
    } finally {
      setBlocksSaving(false);
    }
  };
  const onSelectBlock = (id) => setActiveBlockId((p) => p === id ? null : id);
  const onDeleteBlock = (id) => {
    setPageBlocks((prev) => prev.filter((b) => b.id !== id));
    setBlockDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setBlockErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveBlockId((p) => p === id ? null : p);
  };
  const onDuplicateBlock = (id) => {
    const original = pageBlocks.find((b) => b.id === id);
    if (!original) return;
    const newId = crypto.randomUUID();
    const copy = { ...original, id: newId, data: original.data ? JSON.parse(JSON.stringify(original.data)) : {} };
    setPageBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return [copy, ...prev];
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
    setBlockDrafts((prev) => ({ ...prev, [newId]: JSON.stringify(copy.data || {}, null, 2) }));
    return newId;
  };
  const onToggleVisible = (id) => {
    setPageBlocks((prev) => prev.map((b) => b.id === id ? { ...b, visible: b.visible === false ? true : false } : b));
  };
  const onChangeMount = (id, mount) => {
    setPageBlocks((prev) => prev.map((b) => b.id === id ? { ...b, mount } : b));
  };
  const onChangeType = (id, type) => {
    setPageBlocks((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      if (type === "layout_builder") {
        const data = b.data && typeof b.data === "object" ? b.data : {};
        const elements = Array.isArray(data.elements) ? data.elements : [];
        const nextData = { background: data.background || "white", elements };
        return { ...b, type, data: nextData };
      }
      return { ...b, type };
    }));
  };
  const onChangeDraft = (id, text) => {
    setBlockDrafts((prev) => ({ ...prev, [id]: text }));
    try {
      const parsed = text.trim() ? JSON.parse(text) : {};
      setPageBlocks((prev) => prev.map((b) => b.id === id ? { ...b, data: parsed } : b));
      setBlockErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      setBlockErrors((prev) => ({ ...prev, [id]: "Ongeldige JSON." }));
    }
  };
  const onChangeData = (id, data) => {
    setPageBlocks((prev) => prev.map((b) => b.id === id ? { ...b, data } : b));
    setBlockDrafts((prev) => ({ ...prev, [id]: JSON.stringify(data || {}, null, 2) }));
    setBlockErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  const mountOptions = tab === "home" ? [
    { value: "after_marquee", label: "Na marquee" },
    { value: "after_intro", label: "Na intro + stats" },
    { value: "after_specializations", label: "Na specialisaties" },
    { value: "before_dealers_cta", label: "Voor verkooppunten CTA" },
    { value: "before_testimonials", label: "Voor ervaringen" },
    { value: "after_testimonials", label: "Na ervaringen" },
    { value: "before_cta_banner", label: "Voor CTA banner" },
    { value: "after_cta_banner", label: "Na CTA banner" },
    { value: "end", label: "Onder aan pagina" }
  ] : [
    { value: "top", label: "Boven aan pagina" },
    { value: "bottom", label: "Onder aan pagina" }
  ];
  useEffect2(() => {
    if (tab !== "home") return;
    api_default.get("/content/layout_home_sections", { params: { lang } }).then((res) => {
      const raw = Array.isArray(res.data) ? res.data : [];
      const allowedFixed = new Set(DEFAULT_HOME_LAYOUT);
      const next = raw.filter((x) => typeof x === "string").filter((x) => allowedFixed.has(x) || x.startsWith("block:"));
      setHomeLayoutRaw(next);
    }).catch(() => {
    });
  }, [tab, lang]);
  useEffect2(() => {
    if (tab !== "home") return;
    const fixed = DEFAULT_HOME_LAYOUT;
    const fixedSet = new Set(fixed);
    const blockIds = pageBlocks.map((b) => b.id);
    const blockSet = new Set(blockIds);
    const raw = Array.isArray(homeLayoutRaw) ? homeLayoutRaw : fixed;
    const cleaned = raw.filter((x) => {
      if (fixedSet.has(x)) return true;
      if (x.startsWith("block:")) return blockSet.has(x.slice("block:".length));
      return false;
    });
    const withMissingFixed = [...cleaned, ...fixed.filter((x) => !cleaned.includes(x))];
    const withMissingBlocks = [...withMissingFixed];
    blockIds.forEach((id) => {
      const key = `block:${id}`;
      if (!withMissingBlocks.includes(key)) withMissingBlocks.push(key);
    });
    setHomeSectionOrder(withMissingBlocks);
  }, [tab, homeLayoutRaw, pageBlocks]);
  const saveHomeLayout = async (order) => {
    try {
      await api_default.put("/content/layout_home_sections", order, { params: { lang } });
    } catch {
    }
  };
  const h = home.hero;
  const setH = (v) => setHome((p) => ({ ...p, hero: { ...p.hero, ...v } }));
  const intro = home.introduction;
  const setIntro = (v) => setHome((p) => ({ ...p, introduction: { ...p.introduction, ...v } }));
  const is = home.introSection || HOME_DEFAULTS.introSection;
  const setIs = (v) => setHome((p) => ({ ...p, introSection: { ...p.introSection || HOME_DEFAULTS.introSection, ...v } }));
  const dealersCta = home.dealersCta || HOME_DEFAULTS.dealersCta;
  const setDealersCta = (v) => setHome((p) => ({ ...p, dealersCta: { ...p.dealersCta || HOME_DEFAULTS.dealersCta, ...v } }));
  const specs = home.specializations || [];
  const setSpecs = (v) => setHome((p) => ({ ...p, specializations: v }));
  const stats = home.stats || [];
  const setStats = (v) => setHome((p) => ({ ...p, stats: v }));
  const cta = home.cta;
  const setCta = (v) => setHome((p) => ({ ...p, cta: { ...p.cta, ...v } }));
  const proc = home.process || { title: "", description: "", buttonText: "", steps: [] };
  const setProc = (v) => setHome((p) => ({ ...p, process: { ...p.process || {}, ...v } }));
  const steps = proc.steps || [];
  const setSteps = (v) => setHome((p) => ({ ...p, process: { ...p.process || {}, steps: v } }));
  const hl = home.highlights || HOME_DEFAULTS.highlights;
  const setHlItems = (v) => setHome((p) => ({ ...p, highlights: { ...p.highlights || HOME_DEFAULTS.highlights, items: v } }));
  const setHlMeta = (v) => setHome((p) => ({ ...p, highlights: { ...p.highlights || HOME_DEFAULTS.highlights, ...v } }));
  return /* @__PURE__ */ React2.createElement("div", { className: "space-y-6 max-w-3xl" }, /* @__PURE__ */ React2.createElement("div", { className: "flex items-start justify-between gap-4" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("h1", { className: "text-3xl font-black text-gray-900 tracking-tight" }, "Pagina Inhoud"), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-gray-400 font-medium mt-1" }, "Beheer teksten, afbeeldingen en secties op de storefront.")), /* @__PURE__ */ React2.createElement("div", { className: "shrink-0 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowNewBlock(true),
      className: "flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-black hover:bg-gray-700 transition-colors"
    },
    /* @__PURE__ */ React2.createElement(Plus, { size: 16 }),
    " Blok aanmaken"
  ), /* @__PURE__ */ React2.createElement(
    "select",
    {
      value: lang,
      onChange: (e) => setLang(e.target.value),
      className: "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
    },
    /* @__PURE__ */ React2.createElement("option", { value: "nl" }, "\u{1F1F3}\u{1F1F1} Nederlands"),
    /* @__PURE__ */ React2.createElement("option", { value: "en" }, "\u{1F1EC}\u{1F1E7} English"),
    /* @__PURE__ */ React2.createElement("option", { value: "de" }, "\u{1F1E9}\u{1F1EA} Deutsch")
  ))), /* @__PURE__ */ React2.createElement("div", { className: "flex gap-1 p-1 rounded-2xl", style: { background: "#f1f5f9" } }, TABS.map((t) => {
    const Icon = t.icon;
    const active = tab === t.id;
    return /* @__PURE__ */ React2.createElement(
      "button",
      {
        key: t.id,
        onClick: () => setTab(t.id),
        className: "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all",
        style: {
          background: active ? "#fff" : "transparent",
          color: active ? "#1e40af" : "#94a3b8",
          boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none"
        }
      },
      /* @__PURE__ */ React2.createElement(Icon, { size: 12 }),
      /* @__PURE__ */ React2.createElement("span", { className: "hidden sm:inline" }, t.label)
    );
  })), loading ? /* @__PURE__ */ React2.createElement("div", { className: "py-24 flex flex-col items-center gap-3" }, /* @__PURE__ */ React2.createElement("div", { className: "w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-gray-400" }, "Laden\u2026")) : /* @__PURE__ */ React2.createElement("div", { className: "space-y-4" }, tab === "home" && /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(
    DndContext,
    {
      sensors,
      collisionDetection: closestCenter,
      onDragEnd: (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = homeSectionOrder.indexOf(active.id);
        const newIndex = homeSectionOrder.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const next = arrayMove(homeSectionOrder, oldIndex, newIndex);
        setHomeSectionOrder(next);
        setHomeLayoutRaw(next);
        saveHomeLayout(next);
      }
    },
    /* @__PURE__ */ React2.createElement(SortableContext, { items: homeSectionOrder, strategy: verticalListSortingStrategy }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-4" }, homeSectionOrder.map((id) => {
      if (id === "hero") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: "Hero Sectie", icon: Home, dragHandleProps }, /* @__PURE__ */ React2.createElement(Field, { label: "Hoofdtitel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: h.title, onChange: (e) => setH({ title: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Titel prefix (v\xF3\xF3r roterende tekst)" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: h.titlePrefix || "", onChange: (e) => setH({ titlePrefix: e.target.value }), placeholder: "Verlichting voor" })), /* @__PURE__ */ React2.createElement(Field, { label: "Ondertitel" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: h.subtitle, onChange: (e) => setH({ subtitle: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Primaire knop" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: h.primaryButtonText, onChange: (e) => setH({ primaryButtonText: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Secundaire knop" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: h.secondaryButtonText, onChange: (e) => setH({ secondaryButtonText: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Roterende tekst (komma-gescheiden)" }, /* @__PURE__ */ React2.createElement(
          "input",
          {
            className: `${iCls} ${iBdr}`,
            value: (h.typewriterWords || []).join(", "),
            onChange: (e) => setH({ typewriterWords: e.target.value.split(",").map((w) => w.trim()).filter(Boolean) }),
            placeholder: "bedrijfswagens., bouwplaatsen., werkplaatsen."
          }
        )), /* @__PURE__ */ React2.createElement(Field, { label: "Achtergrondafbeelding" }, /* @__PURE__ */ React2.createElement(ImageField, { value: h.backgroundImage, onChange: (v) => setH({ backgroundImage: v }), height: 28 }))));
      }
      if (id === "intro_banner") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: "Introductie banner", icon: LayoutGrid, defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Badge tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: intro.badge, onChange: (e) => setIntro({ badge: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Marquee tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: intro.marqueeText, onChange: (e) => setIntro({ marqueeText: e.target.value }) })))));
      }
      if (id === "over_ons") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: "Over ons blok", defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Badge label" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: is.badge || "", onChange: (e) => setIs({ badge: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Link tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: is.linkText || "", onChange: (e) => setIs({ linkText: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Koptekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: is.heading || "", onChange: (e) => setIs({ heading: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Beschrijving" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: is.description || "", onChange: (e) => setIs({ description: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Afbeelding" }, /* @__PURE__ */ React2.createElement(ImageField, { value: is.image || "", onChange: (v) => setIs({ image: v }), height: 24 })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3 pt-3 border-t border-gray-100" }, /* @__PURE__ */ React2.createElement(Field, { label: "Levering kaart \u2014 titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: is.deliveryTitle || "", onChange: (e) => setIs({ deliveryTitle: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Levering kaart \u2014 subtitel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: is.deliverySubtitle || "", onChange: (e) => setIs({ deliverySubtitle: e.target.value }) })))));
      }
      if (id === "cases") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: `Cases / Specialisaties (${specs.length})`, defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, specs.map((s, i) => /* @__PURE__ */ React2.createElement(
          ItemCard,
          {
            key: i,
            number: i,
            onDuplicate: () => setSpecs([...specs.slice(0, i + 1), { ...specs[i] }, ...specs.slice(i + 1)]),
            onDelete: () => setSpecs(specs.filter((_, j) => j !== i))
          },
          /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: s.title || "", onChange: (e) => {
            const a = [...specs];
            a[i] = { ...a[i], title: e.target.value };
            setSpecs(a);
          } })),
          /* @__PURE__ */ React2.createElement(Field, { label: "Beschrijving" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 2, value: s.desc || "", onChange: (e) => {
            const a = [...specs];
            a[i] = { ...a[i], desc: e.target.value };
            setSpecs(a);
          } })),
          /* @__PURE__ */ React2.createElement(Field, { label: "Afbeelding" }, /* @__PURE__ */ React2.createElement(ImageField, { value: s.image || "", onChange: (v) => {
            const a = [...specs];
            a[i] = { ...a[i], image: v };
            setSpecs(a);
          }, height: 24 }))
        )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setSpecs([...specs, { title: "", desc: "", image: "" }]), label: "Case toevoegen" }))));
      }
      if (id === "stats") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: `Statistieken (${stats.length})`, defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, stats.map((s, i) => /* @__PURE__ */ React2.createElement(
          ItemCard,
          {
            key: i,
            number: i,
            onDuplicate: () => setStats([...stats.slice(0, i + 1), { ...stats[i] }, ...stats.slice(i + 1)]),
            onDelete: () => setStats(stats.filter((_, j) => j !== i))
          },
          /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React2.createElement(Field, { label: "Waarde" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "bv. 10", value: s.value || "", onChange: (e) => {
            const a = [...stats];
            a[i] = { ...a[i], value: e.target.value };
            setStats(a);
          } })), /* @__PURE__ */ React2.createElement(Field, { label: "Suffix" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "bv. +", value: s.suffix || "", onChange: (e) => {
            const a = [...stats];
            a[i] = { ...a[i], suffix: e.target.value };
            setStats(a);
          } })), /* @__PURE__ */ React2.createElement(Field, { label: "Label" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "bv. Jaar ervaring", value: s.label || "", onChange: (e) => {
            const a = [...stats];
            a[i] = { ...a[i], label: e.target.value };
            setStats(a);
          } })))
        )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setStats([...stats, { value: "", suffix: "", label: "" }]), label: "Statistiek toevoegen" }))));
      }
      if (id === "logos") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: "Partner logo's", icon: Image, defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-gray-400" }, "Deze sectie heeft geen velden. Verplaats om de positie op de homepage te bepalen.")));
      }
      if (id === "featured") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: "Uitgelichte producten", icon: LayoutGrid, defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-gray-400" }, "Deze sectie toont automatisch producten. Verplaats om de positie op de homepage te bepalen.")));
      }
      if (id === "testimonials") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: "Ervaringen", icon: LayoutGrid, defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-gray-400" }, "Deze sectie heeft nu vaste content. Verplaats om de positie op de homepage te bepalen.")));
      }
      if (id === "process") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: "Ontwikkeling / Process", defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: proc.title || "", onChange: (e) => setProc({ title: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Knop tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: proc.buttonText || "", onChange: (e) => setProc({ buttonText: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Beschrijving" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: proc.description || "", onChange: (e) => setProc({ description: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "space-y-2 pt-2" }, /* @__PURE__ */ React2.createElement("p", { className: "text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]" }, "Stappen"), steps.map((s, i) => /* @__PURE__ */ React2.createElement(
          ItemCard,
          {
            key: i,
            number: i,
            onDuplicate: () => setSteps([...steps.slice(0, i + 1), { ...steps[i] }, ...steps.slice(i + 1)]),
            onDelete: () => setSteps(steps.filter((_, j) => j !== i))
          },
          /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "bv. Idee", value: s.title || "", onChange: (e) => {
            const a = [...steps];
            a[i] = { ...a[i], title: e.target.value };
            setSteps(a);
          } })), /* @__PURE__ */ React2.createElement(Field, { label: "Beschrijving" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "Korte omschrijving", value: s.description || s.desc || "", onChange: (e) => {
            const a = [...steps];
            a[i] = { ...a[i], description: e.target.value };
            setSteps(a);
          } })))
        )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setSteps([...steps, { title: "", description: "" }]), label: "Stap toevoegen" }))));
      }
      if (id === "highlights") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: `Groothandel (${(hl.items || []).length})`, defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement(Field, { label: "Sectietitel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: hl.title || "", onChange: (e) => setHlMeta({ title: e.target.value }), placeholder: "Voor de Groothandel" })), /* @__PURE__ */ React2.createElement(Field, { label: "Ondertitel" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 2, value: hl.subtitle || "", onChange: (e) => setHlMeta({ subtitle: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, (hl.items || []).map((it, i) => /* @__PURE__ */ React2.createElement(
          ItemCard,
          {
            key: i,
            number: i,
            onDuplicate: () => setHlItems([...hl.items.slice(0, i + 1), { ...hl.items[i] }, ...hl.items.slice(i + 1)]),
            onDelete: () => setHlItems(hl.items.filter((_, j) => j !== i))
          },
          /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.title || "", onChange: (e) => {
            const a = [...hl.items];
            a[i] = { ...a[i], title: e.target.value };
            setHlItems(a);
          } })),
          /* @__PURE__ */ React2.createElement(Field, { label: "Beschrijving" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 2, value: it.description || "", onChange: (e) => {
            const a = [...hl.items];
            a[i] = { ...a[i], description: e.target.value };
            setHlItems(a);
          } })),
          /* @__PURE__ */ React2.createElement(Field, { label: "Afbeelding" }, /* @__PURE__ */ React2.createElement(ImageField, { value: it.image || "", onChange: (v) => {
            const a = [...hl.items];
            a[i] = { ...a[i], image: v };
            setHlItems(a);
          }, height: 24 })),
          /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Link (bv. /producten)" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.link || "", onChange: (e) => {
            const a = [...hl.items];
            a[i] = { ...a[i], link: e.target.value };
            setHlItems(a);
          } })), /* @__PURE__ */ React2.createElement(Field, { label: "Link tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: it.linkText || "", onChange: (e) => {
            const a = [...hl.items];
            a[i] = { ...a[i], linkText: e.target.value };
            setHlItems(a);
          } }))),
          /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React2.createElement("p", { className: "text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]" }, "Features"), (it.features || []).map((f, fi) => /* @__PURE__ */ React2.createElement("div", { key: fi, className: "flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(
            "input",
            {
              className: `${iCls} ${iBdr}`,
              value: f || "",
              placeholder: "bv. IP67 waterdicht",
              onChange: (e) => {
                const a = [...hl.items];
                const feats = [...a[i].features || []];
                feats[fi] = e.target.value;
                a[i] = { ...a[i], features: feats };
                setHlItems(a);
              }
            }
          ), /* @__PURE__ */ React2.createElement(
            "button",
            {
              type: "button",
              onClick: () => {
                const a = [...hl.items];
                a[i] = { ...a[i], features: (a[i].features || []).filter((_, j) => j !== fi) };
                setHlItems(a);
              },
              className: "p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0",
              title: "Verwijderen"
            },
            /* @__PURE__ */ React2.createElement(Trash2, { size: 14 })
          ))), /* @__PURE__ */ React2.createElement(
            "button",
            {
              type: "button",
              onClick: () => {
                const a = [...hl.items];
                a[i] = { ...a[i], features: [...a[i].features || [], ""] };
                setHlItems(a);
              },
              className: "flex items-center gap-1.5 text-sm font-bold text-blue-500 hover:text-blue-600"
            },
            /* @__PURE__ */ React2.createElement(Plus, { size: 14 }),
            " Feature toevoegen"
          ))
        )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setHlItems([...hl.items, { title: "", description: "", image: "", link: "", linkText: "", features: [] }]), label: "Product item toevoegen" }))));
      }
      if (id === "cta") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: "CTA Sectie", defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Primaire knop" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: cta.primaryButton || "", onChange: (e) => setCta({ primaryButton: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Secundaire knop" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: cta.secondaryButton || "", onChange: (e) => setCta({ secondaryButton: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: cta.title || "", onChange: (e) => setCta({ title: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Ondertitel" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 2, value: cta.subtitle || "", onChange: (e) => setCta({ subtitle: e.target.value }) }))));
      }
      if (id === "dealers_cta") {
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: "Verkooppunten CTA", defaultOpen: false, dragHandleProps }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: dealersCta.title || "", onChange: (e) => setDealersCta({ title: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Ondertitel" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 2, value: dealersCta.subtitle || "", onChange: (e) => setDealersCta({ subtitle: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Knoptekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: dealersCta.buttonText || "", onChange: (e) => setDealersCta({ buttonText: e.target.value }) }))));
      }
      if (id.startsWith("block:")) {
        const blockId = id.slice("block:".length);
        const b = pageBlocks.find((x) => x.id === blockId);
        if (!b) return null;
        return /* @__PURE__ */ React2.createElement(SortableSection, { key: id, id }, ({ dragHandleProps }) => /* @__PURE__ */ React2.createElement(Section, { title: `${b.type}${b.visible === false ? " (verborgen)" : ""}`, icon: LayoutGrid, defaultOpen: b.type === "layout_builder", dragHandleProps }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Type" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: b.type, onChange: (e) => onChangeType(blockId, e.target.value) }, ["banner", "text_block", "feature_grid", "image_text", "stats_row", "cta_block", "steps", "blog_post", "layout_builder"].map((t) => /* @__PURE__ */ React2.createElement("option", { key: t, value: t }, t)))), /* @__PURE__ */ React2.createElement(Field, { label: "Zichtbaar" }, /* @__PURE__ */ React2.createElement(
          "button",
          {
            type: "button",
            onClick: () => onToggleVisible(blockId),
            className: `w-full px-4 py-2.5 rounded-xl text-sm font-black transition-colors ${b.visible === false ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}`
          },
          b.visible === false ? "Verborgen" : "Zichtbaar"
        ))), blockErrors[blockId] && /* @__PURE__ */ React2.createElement("div", { className: "px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold" }, blockErrors[blockId]), b.type === "layout_builder" ? /* @__PURE__ */ React2.createElement(
          BuilderEditor,
          {
            blockId,
            data: b.data || {},
            onChangeData: (next) => onChangeData(blockId, next)
          }
        ) : (() => {
          if (hasFormEditor(b.type)) {
            return /* @__PURE__ */ React2.createElement(BlockFormEditor, { type: b.type, data: b.data || {}, onChange: (next) => onChangeData(blockId, next) });
          }
          return /* @__PURE__ */ React2.createElement(Field, { label: "Data (JSON)" }, /* @__PURE__ */ React2.createElement(
            "textarea",
            {
              className: `${taCls} ${iBdr}`,
              rows: 10,
              value: blockDrafts[blockId] ?? JSON.stringify(b.data || {}, null, 2),
              onChange: (e) => onChangeDraft(blockId, e.target.value),
              placeholder: '{\n  "heading": "..." \n}'
            }
          ));
        })(), /* @__PURE__ */ React2.createElement("div", { className: "flex justify-end gap-2 pt-1" }, /* @__PURE__ */ React2.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              const newId = onDuplicateBlock(blockId);
              if (!newId) return;
              const next = [...homeSectionOrder];
              const idx = next.indexOf(id);
              if (idx !== -1) next.splice(idx + 1, 0, `block:${newId}`);
              else next.push(`block:${newId}`);
              setHomeLayoutRaw(next);
              saveHomeLayout(next);
            },
            className: "px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-600 hover:bg-gray-50"
          },
          "Dupliceren"
        ), /* @__PURE__ */ React2.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              onDeleteBlock(blockId);
              const next = homeSectionOrder.filter((x) => x !== id);
              setHomeLayoutRaw(next);
              saveHomeLayout(next);
            },
            className: "px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700"
          },
          "Verwijderen"
        ))));
      }
      return null;
    })))
  ), /* @__PURE__ */ React2.createElement(SaveButton, { onSave: saveHomeAll, saving: homeAllSaving, saved: homeAllSaved })), tab === "about" && /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Section, { title: "Over Ons Pagina", icon: Info }, /* @__PURE__ */ React2.createElement(Field, { label: "Eyebrow" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: about.eyebrow || "", onChange: (e) => setAbout({ ...about, eyebrow: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Paginatitel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: about.title || "", onChange: (e) => setAbout({ ...about, title: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Beschrijving" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 5, value: about.description || "", onChange: (e) => setAbout({ ...about, description: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Afbeelding" }, /* @__PURE__ */ React2.createElement(ImageField, { value: about.image || "", onChange: (v) => setAbout({ ...about, image: v }), height: 28 }))), /* @__PURE__ */ React2.createElement(Section, { title: `Statistieken (${(about.stats || []).length})`, defaultOpen: false }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, (about.stats || []).map((s, i) => /* @__PURE__ */ React2.createElement(
    ItemCard,
    {
      key: i,
      number: i,
      onDuplicate: () => {
        const a = about.stats || [];
        setAbout({ ...about, stats: [...a.slice(0, i + 1), { ...a[i] }, ...a.slice(i + 1)] });
      },
      onDelete: () => setAbout({ ...about, stats: (about.stats || []).filter((_, j) => j !== i) })
    },
    /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Label" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "bv. Opgericht", value: s.label || "", onChange: (e) => {
      const a = [...about.stats || []];
      a[i] = { ...a[i], label: e.target.value };
      setAbout({ ...about, stats: a });
    } })), /* @__PURE__ */ React2.createElement(Field, { label: "Waarde" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "bv. 2014", value: s.value || "", onChange: (e) => {
      const a = [...about.stats || []];
      a[i] = { ...a[i], value: e.target.value };
      setAbout({ ...about, stats: a });
    } })))
  )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setAbout({ ...about, stats: [...about.stats || [], { label: "", value: "" }] }), label: "Statistiek toevoegen" }))), /* @__PURE__ */ React2.createElement(Section, { title: `Kernwaarden (${(about.values || []).length})`, defaultOpen: false }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, (about.values || []).map((v, i) => /* @__PURE__ */ React2.createElement(
    ItemCard,
    {
      key: i,
      number: i,
      onDuplicate: () => {
        const a = about.values || [];
        setAbout({ ...about, values: [...a.slice(0, i + 1), { ...a[i] }, ...a.slice(i + 1)] });
      },
      onDelete: () => setAbout({ ...about, values: (about.values || []).filter((_, j) => j !== i) })
    },
    /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Icoon (emoji)" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "bv. \u26A1", value: v.icon || "", onChange: (e) => {
      const a = [...about.values || []];
      a[i] = { ...a[i], icon: e.target.value };
      setAbout({ ...about, values: a });
    } })), /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: v.title || "", onChange: (e) => {
      const a = [...about.values || []];
      a[i] = { ...a[i], title: e.target.value };
      setAbout({ ...about, values: a });
    } }))),
    /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: v.text || "", onChange: (e) => {
      const a = [...about.values || []];
      a[i] = { ...a[i], text: e.target.value };
      setAbout({ ...about, values: a });
    } }))
  )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setAbout({ ...about, values: [...about.values || [], { icon: "", title: "", text: "" }] }), label: "Waarde toevoegen" }))), /* @__PURE__ */ React2.createElement(Section, { title: "Tijdlijn", defaultOpen: false }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: about.timelineTitle || "", onChange: (e) => setAbout({ ...about, timelineTitle: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, (about.timeline || []).map((t, i) => /* @__PURE__ */ React2.createElement(
    ItemCard,
    {
      key: i,
      number: i,
      onDuplicate: () => {
        const a = about.timeline || [];
        setAbout({ ...about, timeline: [...a.slice(0, i + 1), { ...a[i] }, ...a.slice(i + 1)] });
      },
      onDelete: () => setAbout({ ...about, timeline: (about.timeline || []).filter((_, j) => j !== i) })
    },
    /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Jaar" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "bv. 2014", value: t.year || "", onChange: (e) => {
      const a = [...about.timeline || []];
      a[i] = { ...a[i], year: e.target.value };
      setAbout({ ...about, timeline: a });
    } })), /* @__PURE__ */ React2.createElement(Field, { label: "Label" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: t.label || "", onChange: (e) => {
      const a = [...about.timeline || []];
      a[i] = { ...a[i], label: e.target.value };
      setAbout({ ...about, timeline: a });
    } })))
  )), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setAbout({ ...about, timeline: [...about.timeline || [], { year: "", label: "" }] }), label: "Tijdlijn item toevoegen" }))), /* @__PURE__ */ React2.createElement(Section, { title: `Pagina opbouw (${pageBlocks.length})`, icon: LayoutGrid, defaultOpen: false }, blocksLoading ? /* @__PURE__ */ React2.createElement("div", { className: "py-10 flex flex-col items-center gap-3" }, /* @__PURE__ */ React2.createElement("div", { className: "w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-gray-400" }, "Laden\u2026")) : /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(
    DndContext,
    {
      sensors,
      collisionDetection: closestCenter,
      onDragEnd: (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = pageBlocks.findIndex((b) => b.id === active.id);
        const newIndex = pageBlocks.findIndex((b) => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        setPageBlocks((items) => arrayMove(items, oldIndex, newIndex));
      }
    },
    /* @__PURE__ */ React2.createElement(SortableContext, { items: pageBlocks.map((b) => b.id), strategy: verticalListSortingStrategy }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, pageBlocks.map((b) => /* @__PURE__ */ React2.createElement(
      SortableBlockCard,
      {
        key: b.id,
        block: b,
        active: activeBlockId === b.id,
        draft: blockDrafts[b.id] ?? JSON.stringify(b.data || {}, null, 2),
        error: blockErrors[b.id] || "",
        mountOptions,
        onSelect: onSelectBlock,
        onDuplicate: onDuplicateBlock,
        onDelete: onDeleteBlock,
        onChangeType,
        onToggleVisible,
        onChangeMount,
        onChangeDraft
      }
    ))))
  ), /* @__PURE__ */ React2.createElement("div", { className: "flex justify-end gap-2 pt-2" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowNewBlock(true),
      className: "px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50"
    },
    "Nieuw blok"
  ), /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: saveHomeBlocks,
      disabled: blocksSaving || Object.keys(blockErrors).length > 0,
      className: `px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-60 ${blocksSaved ? "bg-emerald-600" : "bg-gray-900 hover:bg-gray-700"}`
    },
    blocksSaving ? "Opslaan\u2026" : blocksSaved ? "Opgeslagen!" : "Blokken opslaan"
  )))), /* @__PURE__ */ React2.createElement(SaveButton, { onSave: () => save("about", about), saving, saved })), tab === "contact" && /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Section, { title: "Contact Pagina", icon: Phone }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Eyebrow" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.eyebrow || "", onChange: (e) => setContact({ ...contact, eyebrow: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.title || "", onChange: (e) => setContact({ ...contact, title: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Beschrijving" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: contact.description || "", onChange: (e) => setContact({ ...contact, description: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Section, { title: "Contactgegevens", defaultOpen: false }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Telefoonnummer" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "+31 6 12345678", value: contact.phone || "", onChange: (e) => setContact({ ...contact, phone: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "E-mailadres" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "info@alraled.nl", value: contact.email || "", onChange: (e) => setContact({ ...contact, email: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Adres" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, placeholder: "Straat 1, 1234 AB Stad", value: contact.address || "", onChange: (e) => setContact({ ...contact, address: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Section, { title: "Labels & meldingen", defaultOpen: false }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel: Gegevens" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.detailsTitle || "", onChange: (e) => setContact({ ...contact, detailsTitle: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Bedrijfsgegevens titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.companyDetails || "", onChange: (e) => setContact({ ...contact, companyDetails: e.target.value }) }))), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Label: Adres" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.addressLabel || "", onChange: (e) => setContact({ ...contact, addressLabel: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Label: Telefoon" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.phoneLabel || "", onChange: (e) => setContact({ ...contact, phoneLabel: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Label: Email" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.emailLabel || "", onChange: (e) => setContact({ ...contact, emailLabel: e.target.value }) }))), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Callout titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.callTitle || "", onChange: (e) => setContact({ ...contact, callTitle: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Callout tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.callText || "", onChange: (e) => setContact({ ...contact, callText: e.target.value }) }))), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Label: KvK" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.kvkLabel || "", onChange: (e) => setContact({ ...contact, kvkLabel: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "KvK nummer" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.kvkValue || "", onChange: (e) => setContact({ ...contact, kvkValue: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Label: BTW" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.vatLabel || "", onChange: (e) => setContact({ ...contact, vatLabel: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "BTW nummer" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.vatValue || "", onChange: (e) => setContact({ ...contact, vatValue: e.target.value }) }))), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Succes titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.successTitle || "", onChange: (e) => setContact({ ...contact, successTitle: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Succes tekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.successText || "", onChange: (e) => setContact({ ...contact, successText: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Nieuw bericht knop" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.newMessage || "", onChange: (e) => setContact({ ...contact, newMessage: e.target.value }) })))), /* @__PURE__ */ React2.createElement(Section, { title: "Contactformulier", defaultOpen: false }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Label: Naam" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.form?.nameLabel || "", onChange: (e) => setContact({ ...contact, form: { ...contact.form || {}, nameLabel: e.target.value } }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Placeholder: Naam" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.form?.namePlaceholder || "", onChange: (e) => setContact({ ...contact, form: { ...contact.form || {}, namePlaceholder: e.target.value } }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Label: Email" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.form?.emailLabel || "", onChange: (e) => setContact({ ...contact, form: { ...contact.form || {}, emailLabel: e.target.value } }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Placeholder: Email" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.form?.emailPlaceholder || "", onChange: (e) => setContact({ ...contact, form: { ...contact.form || {}, emailPlaceholder: e.target.value } }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Label: Onderwerp" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.form?.subjectLabel || "", onChange: (e) => setContact({ ...contact, form: { ...contact.form || {}, subjectLabel: e.target.value } }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Placeholder: Onderwerp" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.form?.subjectPlaceholder || "", onChange: (e) => setContact({ ...contact, form: { ...contact.form || {}, subjectPlaceholder: e.target.value } }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Label: Bericht" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.form?.messageLabel || "", onChange: (e) => setContact({ ...contact, form: { ...contact.form || {}, messageLabel: e.target.value } }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Placeholder: Bericht" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.form?.messagePlaceholder || "", onChange: (e) => setContact({ ...contact, form: { ...contact.form || {}, messagePlaceholder: e.target.value } }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Knoptekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: contact.form?.submit || "", onChange: (e) => setContact({ ...contact, form: { ...contact.form || {}, submit: e.target.value } }) })))), /* @__PURE__ */ React2.createElement(Section, { title: `Pagina opbouw (${pageBlocks.length})`, icon: LayoutGrid, defaultOpen: false }, blocksLoading ? /* @__PURE__ */ React2.createElement("div", { className: "py-10 flex flex-col items-center gap-3" }, /* @__PURE__ */ React2.createElement("div", { className: "w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-gray-400" }, "Laden\u2026")) : /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(
    DndContext,
    {
      sensors,
      collisionDetection: closestCenter,
      onDragEnd: (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = pageBlocks.findIndex((b) => b.id === active.id);
        const newIndex = pageBlocks.findIndex((b) => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        setPageBlocks((items) => arrayMove(items, oldIndex, newIndex));
      }
    },
    /* @__PURE__ */ React2.createElement(SortableContext, { items: pageBlocks.map((b) => b.id), strategy: verticalListSortingStrategy }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, pageBlocks.map((b) => /* @__PURE__ */ React2.createElement(
      SortableBlockCard,
      {
        key: b.id,
        block: b,
        active: activeBlockId === b.id,
        draft: blockDrafts[b.id] ?? JSON.stringify(b.data || {}, null, 2),
        error: blockErrors[b.id] || "",
        mountOptions,
        onSelect: onSelectBlock,
        onDuplicate: onDuplicateBlock,
        onDelete: onDeleteBlock,
        onChangeType,
        onToggleVisible,
        onChangeMount,
        onChangeDraft
      }
    ))))
  ), /* @__PURE__ */ React2.createElement("div", { className: "flex justify-end gap-2 pt-2" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowNewBlock(true),
      className: "px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50"
    },
    "Nieuw blok"
  ), /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: saveHomeBlocks,
      disabled: blocksSaving || Object.keys(blockErrors).length > 0,
      className: `px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-60 ${blocksSaved ? "bg-emerald-600" : "bg-gray-900 hover:bg-gray-700"}`
    },
    blocksSaving ? "Opslaan\u2026" : blocksSaved ? "Opgeslagen!" : "Blokken opslaan"
  )))), /* @__PURE__ */ React2.createElement(SaveButton, { onSave: () => save("contact", contact), saving, saved })), tab === "general" && /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Section, { title: "Header & Logo", icon: Settings }, /* @__PURE__ */ React2.createElement(Field, { label: "Logo afbeelding URL" }, /* @__PURE__ */ React2.createElement(ImageField, { value: general.logoUrl || "", onChange: (v) => setGeneral({ ...general, logoUrl: v }), height: 16 })), /* @__PURE__ */ React2.createElement(Field, { label: "Tagline (top bar)" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.tagline || "", onChange: (e) => setGeneral({ ...general, tagline: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Section, { title: "Webkeurmerk", defaultOpen: false }, /* @__PURE__ */ React2.createElement(Field, { label: "Webkeurmerk ID (optioneel)", hint: "Vul hier je Webkeurmerk klant-ID in om het keurmerk op de site te tonen." }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.webkeurmerkId || "", onChange: (e) => setGeneral({ ...general, webkeurmerkId: e.target.value }), placeholder: "bv. WK-123456" }))), /* @__PURE__ */ React2.createElement(Section, { title: "Newsletter", defaultOpen: false }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.newsletterTitle || "", onChange: (e) => setGeneral({ ...general, newsletterTitle: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Knoptekst" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.newsletterButton || "", onChange: (e) => setGeneral({ ...general, newsletterButton: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Tekst" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 2, value: general.newsletterText || "", onChange: (e) => setGeneral({ ...general, newsletterText: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Placeholder email" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.newsletterPlaceholder || "", onChange: (e) => setGeneral({ ...general, newsletterPlaceholder: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Section, { title: "Footer", defaultOpen: false }, /* @__PURE__ */ React2.createElement(Field, { label: "Bedrijfsbeschrijving" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: general.footerDescription || "", onChange: (e) => setGeneral({ ...general, footerDescription: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Telefoon" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.footerPhone || "", onChange: (e) => setGeneral({ ...general, footerPhone: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Email" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.footerEmail || "", onChange: (e) => setGeneral({ ...general, footerEmail: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Adres" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.footerAddress || "", onChange: (e) => setGeneral({ ...general, footerAddress: e.target.value }) })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Titel: Navigatie" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.navigationTitle || "", onChange: (e) => setGeneral({ ...general, navigationTitle: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Titel: Producten" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.productsTitle || "", onChange: (e) => setGeneral({ ...general, productsTitle: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Titel: Contact" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.contactTitle || "", onChange: (e) => setGeneral({ ...general, contactTitle: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Product links" }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, (general.productLinks || []).map((p, i) => /* @__PURE__ */ React2.createElement("div", { key: i, className: "flex gap-2" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr} flex-1`, value: p || "", onChange: (e) => {
    const a = [...general.productLinks || []];
    a[i] = e.target.value;
    setGeneral({ ...general, productLinks: a });
  } }), /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => setGeneral({ ...general, productLinks: (general.productLinks || []).filter((_, j) => j !== i) }),
      className: "px-3 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
    },
    "\xD7"
  ))), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setGeneral({ ...general, productLinks: [...general.productLinks || [], ""] }), label: "Product link toevoegen" }))), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Label: Privacy" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.privacyLabel || "", onChange: (e) => setGeneral({ ...general, privacyLabel: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Label: Voorwaarden" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.termsLabel || "", onChange: (e) => setGeneral({ ...general, termsLabel: e.target.value }) }))), /* @__PURE__ */ React2.createElement(Field, { label: "Bottom copy" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: general.bottomCopy || "", onChange: (e) => setGeneral({ ...general, bottomCopy: e.target.value }) }))), /* @__PURE__ */ React2.createElement(SaveButton, { onSave: () => save("general", general), saving, saved })), tab === "logos" && /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Section, { title: `Partner Logo's (${logos.length})`, icon: Image }, /* @__PURE__ */ React2.createElement("p", { className: "text-xs text-gray-400 leading-relaxed" }, "Logo's die in de carrousel op de homepage verschijnen. Voeg een afbeelding toe of gebruik alleen een naam."), /* @__PURE__ */ React2.createElement("div", { className: "space-y-2 mt-1" }, logos.map((logo, i) => /* @__PURE__ */ React2.createElement("div", { key: i, className: "flex items-center gap-3 px-4 py-3 rounded-2xl", style: { background: "#f8fafc", border: "1px solid #f1f5f9" } }, logo.imageUrl ? /* @__PURE__ */ React2.createElement("div", { className: "relative w-16 h-10 shrink-0" }, /* @__PURE__ */ React2.createElement("img", { src: logo.imageUrl, alt: logo.name, className: "w-full h-full object-contain rounded-lg" }), /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => setLogos(logos.map((l, j) => j === i ? { ...l, imageUrl: "" } : l)),
      className: "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow"
    },
    "\xD7"
  )) : /* @__PURE__ */ React2.createElement("label", { className: "w-16 h-10 shrink-0 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-400 transition-colors", style: { background: "#fff" } }, /* @__PURE__ */ React2.createElement("input", { type: "file", accept: "image/*", className: "hidden", onChange: async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const r = await api_default.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setLogos(logos.map((l, j) => j === i ? { ...l, imageUrl: r.data.url } : l));
    } catch {
    } finally {
      setLogoUploading(false);
    }
  } }), /* @__PURE__ */ React2.createElement(Upload2, { size: 14, className: "text-gray-300" })), /* @__PURE__ */ React2.createElement(
    "input",
    {
      className: `${iCls} ${iBdr} flex-1`,
      placeholder: "Bedrijfsnaam",
      value: logo.name || "",
      onChange: (e) => setLogos(logos.map((l, j) => j === i ? { ...l, name: e.target.value } : l))
    }
  ), /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => setLogos(logos.filter((_, j) => j !== i)),
      className: "p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
    },
    /* @__PURE__ */ React2.createElement(Trash2, { size: 14 })
  ))), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setLogos([...logos, { name: "", imageUrl: "" }]), label: "Logo toevoegen" }), logoUploading && /* @__PURE__ */ React2.createElement("p", { className: "text-xs text-blue-500 font-medium text-center" }, "Uploaden\u2026"))), /* @__PURE__ */ React2.createElement(SaveButton, { onSave: () => save("logos", logos), saving, saved })), tab === "shop" && /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Section, { title: "Webshop hero", icon: ShoppingBag, defaultOpen: true }, /* @__PURE__ */ React2.createElement("p", { className: "text-xs text-gray-400 leading-relaxed" }, "De banner bovenaan de webshop (pagina Producten). Zonder hero-afbeelding wordt automatisch een productfoto gebruikt."), /* @__PURE__ */ React2.createElement(Field, { label: "Hero afbeelding (optioneel)" }, /* @__PURE__ */ React2.createElement(ImageField, { value: shop.hero.imageUrl || "", onChange: (url) => setShopHero({ imageUrl: url }) })), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement(Field, { label: "Badge" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: shop.hero.eyebrow || "", onChange: (e) => setShopHero({ eyebrow: e.target.value }), placeholder: "Onze collectie" })), /* @__PURE__ */ React2.createElement(Field, { label: "Accent-tekst (zwart/zaak)" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: shop.hero.titleAccent || "", onChange: (e) => setShopHero({ titleAccent: e.target.value }), placeholder: "voor elke toepassing" }))), /* @__PURE__ */ React2.createElement(Field, { label: "Hoofdtitel" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: shop.hero.title || "", onChange: (e) => setShopHero({ title: e.target.value }), placeholder: "LED verlichting" })), /* @__PURE__ */ React2.createElement(Field, { label: "Ondertitel" }, /* @__PURE__ */ React2.createElement("textarea", { className: `${taCls} ${iBdr}`, rows: 3, value: shop.hero.subtitle || "", onChange: (e) => setShopHero({ subtitle: e.target.value }) })), /* @__PURE__ */ React2.createElement(Field, { label: "Waarden / USP's", hint: "4 punten onder de tekst. Titel + toelichting per item." }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-2 mt-1" }, Array.isArray(shop.hero.usps) && shop.hero.usps.map((usp, i) => /* @__PURE__ */ React2.createElement(ItemCard, { key: i, number: i, onDelete: () => setShopHero({ usps: shop.hero.usps.filter((_, j) => j !== i) }) }, /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: usp.title || "", onChange: (e) => setShopHero({ usps: shop.hero.usps.map((u, j) => j === i ? { ...u, title: e.target.value } : u) }), placeholder: "Titel" }), /* @__PURE__ */ React2.createElement("input", { className: `${iCls} ${iBdr}`, value: usp.text || "", onChange: (e) => setShopHero({ usps: shop.hero.usps.map((u, j) => j === i ? { ...u, text: e.target.value } : u) }), placeholder: "Toelichting" })))), /* @__PURE__ */ React2.createElement(AddButton, { onClick: () => setShopHero({ usps: [...shop.hero.usps || [], { title: "", text: "" }] }), label: "Waarde toevoegen" })))), /* @__PURE__ */ React2.createElement(SaveButton, { onSave: () => save("shop", shop), saving, saved })), showNewBlock && ["home", "about", "contact"].includes(tab) && /* @__PURE__ */ React2.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4" }, /* @__PURE__ */ React2.createElement("div", { className: "absolute inset-0 bg-black/40", onClick: () => setShowNewBlock(false) }), /* @__PURE__ */ React2.createElement("div", { className: "relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" }, /* @__PURE__ */ React2.createElement("div", { className: "px-6 py-4 border-b bg-gray-50 flex items-center justify-between" }, /* @__PURE__ */ React2.createElement("p", { className: "font-black text-gray-900" }, "Nieuw blok"), /* @__PURE__ */ React2.createElement("button", { onClick: () => setShowNewBlock(false), className: "text-gray-400 hover:text-gray-700" }, "\u2715")), /* @__PURE__ */ React2.createElement("div", { className: "p-6 space-y-4" }, /* @__PURE__ */ React2.createElement(Field, { label: "Preset" }, /* @__PURE__ */ React2.createElement("select", { className: `${iCls} ${iBdr}`, value: newBlockPreset, onChange: (e) => setNewBlockPreset(e.target.value) }, Object.entries(BLOCK_PRESETS).map(([key, preset]) => /* @__PURE__ */ React2.createElement("option", { key, value: key }, preset.label)))), /* @__PURE__ */ React2.createElement(Field, { label: "Zoeken" }, /* @__PURE__ */ React2.createElement(
    "input",
    {
      className: `${iCls} ${iBdr}`,
      value: newBlockSearch,
      onChange: (e) => setNewBlockSearch(e.target.value),
      placeholder: "Zoek blokken\u2026"
    }
  )), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" }, Object.entries(BLOCK_PRESETS).filter(([key, preset]) => {
    const q = String(newBlockSearch || "").trim().toLowerCase();
    if (!q) return true;
    return `${key} ${preset.label} ${preset.type}`.toLowerCase().includes(q);
  }).map(([key, preset]) => /* @__PURE__ */ React2.createElement(
    "button",
    {
      key,
      type: "button",
      onClick: () => setNewBlockPreset(key),
      className: `px-4 py-3 rounded-2xl border text-left transition-colors ${newBlockPreset === key ? "border-blue-200 bg-blue-50/40" : "border-gray-100 bg-white hover:bg-gray-50"}`
    },
    /* @__PURE__ */ React2.createElement("p", { className: "text-sm font-black text-gray-900" }, preset.label),
    /* @__PURE__ */ React2.createElement("p", { className: "text-xs text-gray-400 mt-0.5" }, preset.type)
  )))), /* @__PURE__ */ React2.createElement("div", { className: "px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowNewBlock(false),
      className: "px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50"
    },
    "Annuleren"
  ), /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const id = crypto.randomUUID();
        const preset = BLOCK_PRESETS[newBlockPreset] || BLOCK_PRESETS.banner_primary;
        const mount = tab === "home" ? void 0 : "bottom";
        const data = preset.type === "layout_builder" ? {
          ...preset.data || {},
          elements: (preset.data?.elements || []).map((el) => ({ ...el, id: crypto.randomUUID() }))
        } : preset.data;
        const block = { id, type: preset.type, visible: true, ...mount ? { mount } : {}, data };
        setPageBlocks((prev) => [block, ...prev]);
        setBlockDrafts((prev) => ({ ...prev, [id]: JSON.stringify(block.data || {}, null, 2) }));
        setActiveBlockId(id);
        if (tab === "home") {
          const next = [...Array.isArray(homeLayoutRaw) ? homeLayoutRaw : homeSectionOrder, `block:${id}`];
          setHomeLayoutRaw(next);
          saveHomeLayout(next);
        }
        setShowNewBlock(false);
      },
      className: "px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
    },
    "Toevoegen"
  ))))));
}
export {
  Pages as default
};

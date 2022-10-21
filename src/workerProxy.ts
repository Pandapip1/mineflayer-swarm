import { createThreadPool } from "thread-puddle";

export default 
const docCookies = new Proxy(docCookies, {
  get(target, key) {
    return target[key] || target.getItem(key) || undefined;
  },
  set(target, key, value) {
    if (key in target) { return false; }
    return target.setItem(key, value);
  },
  deleteProperty(target, key) {
    if (!(key in target)) { return false; }
    return target.removeItem(key);
  },
  ownKeys(target) {
    return target.keys();
  },
  has(target, key) {
    return key in target || target.hasItem(key);
  },
  defineProperty(target, key, descriptor) {
    if (descriptor && 'value' in descriptor) {
      target.setItem(key, descriptor.value);
    }
    return target;
  },
  getOwnPropertyDescriptor(target, key) {
    const value = target.getItem(key);
    return value ? {
      value,
      writable: true,
      enumerable: true,
      configurable: false,
    } : undefined;
  },
});
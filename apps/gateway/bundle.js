var Entry = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../../testing-repo/complex/index.js
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });

  // ../../testing-repo/complex/helpers.js
  function add(a, b) {
    return a + b;
  }
  function format(msg) {
    return `[COMPLEX] ${msg.toUpperCase()}`;
  }

  // ../../testing-repo/complex/index.js
  async function index_default(args) {
    const sum = add(10, 20);
    const msg = format("Math check: " + sum);
    return {
      message: msg,
      status: 200,
      timestamp: Date.now()
    };
  }
  return __toCommonJS(index_exports);
})();
if (typeof Entry.default === 'function') { Entry.default(); } else { Entry.default; }

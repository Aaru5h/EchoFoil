"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\nasync function register() {\n    if ( true && process.env.DATABASE_URL) {\n        await Promise.all(/*! import() */[__webpack_require__.e(\"vendor-chunks/zod\"), __webpack_require__.e(\"vendor-chunks/@t3-oss\"), __webpack_require__.e(\"_instrument_lib_env_ts\")]).then(__webpack_require__.bind(__webpack_require__, /*! ./lib/env */ \"(instrument)/./lib/env.ts\"));\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBTyxlQUFlQTtJQUFXLElBQUdDLEtBQW1DLElBQUVBLFFBQVFDLEdBQUcsQ0FBQ0UsWUFBWSxFQUFDO1FBQUMsTUFBTSwyUUFBbUI7SUFBQztBQUFDIiwic291cmNlcyI6WyIvVXNlcnMvYWFydXNoZ3VwdGEvRGVza3RvcC9FY2hvRm9pbC9pbnN0cnVtZW50YXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZ2lzdGVyKCl7aWYocHJvY2Vzcy5lbnYuTkVYVF9SVU5USU1FPT09J25vZGVqcycmJnByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCl7YXdhaXQgaW1wb3J0KCcuL2xpYi9lbnYnKTt9fVxuIl0sIm5hbWVzIjpbInJlZ2lzdGVyIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUlVOVElNRSIsIkRBVEFCQVNFX1VSTCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(instrument)/./instrumentation.ts"));
module.exports = __webpack_exports__;

})();
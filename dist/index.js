/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 647:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 891:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 955:
/***/ ((module) => {

module.exports = eval("require")("xml2json");


/***/ }),

/***/ 113:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(647);
const github = __nccwpck_require__(891);
var fs = __nccwpck_require__(147);
var crypto = __nccwpck_require__(113);

var parser = __nccwpck_require__(955);
var sarf_result = {};
var sarf_result_buffer = null;

const readFile = (filename) => {
  try {
    data = fs.readFileSync(filename, 'utf-8')
    var json = parser.toJson(data);
    // let try to explorer file element
  
    const obj = JSON.parse(json);
  
    /*
      RULES SECTION
    "rules": [
      {
          "id": "3f292041e51d22005ce48f39df3585d44ce1b0ad",
          "name": "js/unused-local-variable",
          "shortDescription": {
          "text": "Unused variable, import, function or class"
          },
          "fullDescription": {
          "text": "Unused variables, imports, functions or classes may be a symptom of a bug and should be examined carefully."
          },
          "defaultConfiguration": {
          "level": "note"
          },
          "properties": {
          "tags": ["maintainability"],
          "precision": "very-high"
          }
      },
    */
    var rules = [];
    for (i in obj.CodeNarc.Rules.Rule) {
        const current = obj.CodeNarc.Rules.Rule[i];
        const rule = {
          id: crypto.createHash("md5").update(current.name).digest("hex"),
          name: current.name,
          shortDescription: {
            text: current.Description,
          },
          fullDescription: {
            text: current.Description,
          },
          properties: {
            tags: ["code-narc"],
            precision: "very-high",
          },
        };
        rules.push(rule);
    }
    // console.log(rules);
  
    /*
      RESULT SECTION
    */
    var results = [];
    /*
    "results": [
      {
          "ruleId": "3f292041e51d22005ce48f39df3585d44ce1b0ad",
          "ruleIndex": 0,
          "message": {
          "text": "Unused variable foo."
          },
          "locations": [
          {
              "physicalLocation": {
              "artifactLocation": {
                  "uri": "main.js",
                  "uriBaseId": "%SRCROOT%"
              },
              "region": {
                  "startLine": 2,
                  "startColumn": 7,
                  "endColumn": 10
              }
              }
          }
          ],
          "partialFingerprints": {
          "primaryLocationLineHash": "39fa2ee980eb94b0:1",
          "primaryLocationStartColumnFingerprint": "4"
          }
      },
    */
    for (i in obj.CodeNarc.Package.File) {
      const current = obj.CodeNarc.Package.File[i];
      console.log(current.name);
  
      for( j in current.Violation )
      {
          const violation = current.Violation[j];
  
          const result = {
            ruleId: crypto
              .createHash("md5")
              .update(violation.ruleName)
              .digest("hex"),
            ruleIndex: parseInt(j),
            message: {
              text: violation.Message,
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: current.name,
                    uriBaseId: "%SRCROOT%",
                  },
                  region: {
                    startLine: parseInt(violation.lineNumber),
                  },
                },
              },
            ],
          };
          results.push(result);
      }
    }
    console.log(results);
  
    sarf_result = {
      $schema:
        "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "CodeNARC",
              semanticVersion: "2.0.0",
              rules: rules,
            },
          },
          results: results,
          columnKind: "utf16CodeUnits",
        },
      ],
    };
    sarf_result_buffer = JSON.stringify(sarf_result);
    return sarf_result_buffer;
    // console.log(sarf_result_buffer);
    // console.log(JSON.stringify(sarf_result));
  }
  catch (error) {
    console.error(error)
  }
};

const writeFile = (filename, data) => {
  try {
    fs.writeFileSync(filename, data);
  } catch (error) {
    console.log(error)
  }
}

function readFileAndWriteJson() {
  let data = readFile("input_codenarc.xml");
  writeFile("output_codenarc_sarif.json", data);
}
try {
  // 'input_filename' xml to convert to sarif json
  console.log(`Converting... input_codenarc.xml!`);

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
  readFileAndWriteJson();
  console.log()
} catch (error) {
  core.setFailed(error.message);
}
})();

module.exports = __webpack_exports__;
/******/ })()
;
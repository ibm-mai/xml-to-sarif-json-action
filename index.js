const core = require('@actions/core');
const github = require('@actions/github');
var fs = require("fs");
var crypto = require('crypto');

var parser = require("xml2json");
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
  let data = readFile("./input_codenarc.xml");
  writeFile("./output_codenarc_sarif.json", data);
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
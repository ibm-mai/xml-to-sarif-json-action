const { XMLFile, SarifConverter } = require("./utils")
const fs = require("fs");
const core = require('@actions/core');

function main() {
    const getXmlInputFileName = core.getInput('xml-input-filepath');

    const xmlFile = new XMLFile(getXmlInputFileName);
    const json = xmlFile.getFileAsJson();

    const sarifConverter = new SarifConverter(json);
    const rules = sarifConverter.getRules();
    const results = sarifConverter.getResults();

    const sarf_result = {
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
                        informationUri: "http://www.codenarc.org"
                    },
                },
                results: results,
                columnKind: "utf16CodeUnits",
            },
        ],
    };

    let data = JSON.stringify(sarf_result, null, 2);
    fs.writeFileSync('codenarc-sarif.json', data);
}

main();

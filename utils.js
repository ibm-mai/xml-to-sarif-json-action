const fs = require("fs");
const { XMLParser } = require("fast-xml-parser")
const crypto = require("crypto");

class SarifConverter {
    jsonObj = null;

    /**
     * 
     * @param {object} obj A JSON object 
     */
    constructor(obj) {
        this.jsonObj = obj;
    }

    /**
     * Returns the rules of this.jsonObj in sarif format
     * 
     * @return {any[]}
     */
    getRules() {
        const rules = [];
        if (!this.jsonObj.CodeNarc || !this.jsonObj.CodeNarc.Rules || !this.jsonObj.CodeNarc.Rules.Rule) throw new Error("The input object cannot be converted")
        for (const rule of this.jsonObj.CodeNarc.Rules.Rule) {
            rules.push({
                id: crypto.createHash("md5").update(rule.name).digest("hex"),
                name: rule.name,
                shortDescription: {
                    text: rule.Description,
                },
                fullDescription: {
                    text: rule.Description,
                },
                properties: {
                    tags: ["code-narc"],
                    precision: "very-high",
                },
            })
        }
        return rules;
    }

    /**
     * Return the results of this.jsonObj in sarif format
     * 
     * @returns {any[]}
     */
    getResults() {
        const results = [];
        if (!this.jsonObj.CodeNarc || !this.jsonObj.CodeNarc.Package || !this.jsonObj.CodeNarc.Package.File) throw new Error("The input object cannot be converted")
        for (const file of this.jsonObj.CodeNarc.Package.File) {
            if (!file.Violation) continue;
            const { Violation } = file;
            for (const [index, violation] of Violation.entries()) {
                results.push({
                    ruleId: crypto
                        .createHash("md5")
                        .update(violation.ruleName)
                        .digest("hex"),
                    ruleIndex: index,
                    message: {
                        text: violation.Message,
                    },
                    locations: [
                        {
                            physicalLocation: {
                                artifactLocation: {
                                    uri: file.name,
                                    uriBaseId: "%SRCROOT%",
                                },
                                region: {
                                    startLine: parseInt(violation.lineNumber || '0')
                                },
                            },
                        },
                    ],
                })
            }
        }
        return results;
    }
}

class XMLFile {
    filepath = "./input_codenarc.xml";
    parser = new XMLParser({
        attributeNamePrefix: '',
        ignoreAttributes: false,
        ignoreNameSpace: false,
    });

    /**
     * @param {string} filepath  A path to the XML file
     */
    constructor(filepath = "./input_codenarc.xml") {
        this.filepath = filepath;
    }

    /**
     * Returns file content of this.filepath
     *
     * @return {object}
     */
    readFileRaw() {
        const file = fs.readFileSync(this.filepath, { encoding: 'utf-8' })
        return file;
    }

    /**
     * Returns the file content of this.filepath in JSON format
     *
     * @return {object} 
     */
    getFileAsJson() {
        const rawFile = this.readFileRaw();
        const jsonObj = this.parser.parse(rawFile);
        return jsonObj;
    }
}



module.exports = {
    XMLFile,
    SarifConverter
}
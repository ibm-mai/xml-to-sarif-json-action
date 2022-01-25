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
                id: rule.name,
                shortDescription: {
                    text: rule.name,
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
     * @param {any[]} rules Array of rules
     * @returns {any[]}
     */
    getResults(rules) {
        const ruleIndexMap = {};
        for (const [index,r] of rules.entries()) {
            ruleIndexMap[r.id] = index;
        }

        const results = [];
        if (!this.jsonObj.CodeNarc || !this.jsonObj.CodeNarc.Package) throw new Error("The input object cannot be converted")
        for (const pack of this.jsonObj.CodeNarc.Package) {
            console.log("Package: "+ pack.path);
            if(pack.File == undefined) continue;

            else if(Array.isArray(pack.File)) {
                for (const file of pack.File) {
                    results.push(this.parseFileViolations(file, ruleIndexMap, pack.path));
                }

            }else { 
                //In case of a package contains only 1 file, json result will be a file object instead of a list of files
                results.push(this.parseFileViolations(pack.File, ruleIndexMap, pack.path));
            }
        }
        return results;
    }

    /**
     * Return a list of violations object for an input file in sarif format
     * @returns {any[]}
     */
    parseFileViolations(file, ruleIndexMap, packagePath) {
        const violationList = []
        if(Array.isArray(file.Violation)){
            for (const violation of file.Violation) {
                violationList.push(this.parseViolation(violation, ruleIndexMap, packagePath));
            }
        
        } else {
            violationList.push(this.parseViolation(file.Violation, ruleIndexMap, packagePath + '/' + file.name));
        }
        return violationList;
    }

    /**
     * Return a violation object in sarif format
     * @returns {any}
     */
    parseViolation(violation, ruleIndexMap, fileNameAndPackagePath) {
        const priorityLevelMap = {"1" : "error", "2": "warning", "3": "note"};
        const groovyCodeBasePath = "src/main/groovy/";

        return {
            ruleId: violation.ruleName,
            ruleIndex: ruleIndexMap[violation.ruleName],
            level: priorityLevelMap[violation.priority] || priorityLevelMap.get("3"),
            message: {
                text: violation.Message || violation.ruleName,
            },
            locations: [
                {
                    physicalLocation: {
                        artifactLocation: {
                            uri: groovyCodeBasePath + fileNameAndPackagePath,
                            uriBaseId: "%SRCROOT%",
                        },
                        region: {
                            startLine: parseInt(violation.lineNumber || '1')
                        },
                    },
                },
            ],
        }
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
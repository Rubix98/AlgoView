import { getDefines } from "@/javascript/languages/cpp";
import { getDefaultConverters } from "@/javascript/languages/cpp";

const variableTagName = "algodebug-variable";
const breakpointTagName = "algodebug-breakpoint";

export class CodeParserUtils {
    static insertVariableTags(code, variables) {
        for (let variable of variables.sortedBy("start", -1)) {
            code =
                code.slice(0, variable.start) +
                this.encloseInTag(variable.id, variableTagName) +
                code.slice(variable.end);
        }
        return code;
    }

    static insertBreakpointTags(code, breakpoints) {
        let lines = code.split("\n");
        for (let breakpoint of breakpoints.sortedBy("id", -1)) {
            lines[breakpoint.id] += this.encloseInTag(breakpoint.id, breakpointTagName);
        }
        code = lines.join("\n");
        return code;
    }

    static removeVariableTags(code) {
        code = this.removeTagsAndMapContent(code, variableTagName, (content) => {
            return content.split("@")[0];
        });
        return code;
    }

    static replaceBreakpointTags(code, sceneObjectsFlat, parsedBreakpoints) {
        for (let breakpoint of parsedBreakpoints) {
            let breakpointText = `ALGODEBUG_BREAKPOINT_START(${breakpoint.line}); `;
            for (let sceneObject of sceneObjectsFlat) {
                const isEveryVariableAvailable = sceneObject.variables.every((v1) =>
                    breakpoint.variables.find((v2) => v1.id == v2.id)
                );
                if (!isEveryVariableAvailable) continue;

                let converterName = sceneObject.converter ? `algodebug_converter_${sceneObject.converter._id}` : "";
                let variables = sceneObject.variables.map((v) => v.name).join(", ");
                let converterText = `${converterName}(${variables})`;

                breakpointText += `ALGODEBUG_OBJECT(${sceneObject.id}, ${converterText}); `;
            }
            breakpointText += "ALGODEBUG_BREAKPOINT_END();";

            code = code.replace(this.encloseInTag(breakpoint.line, breakpointTagName), breakpointText);
        }
        return code;
    }

    static insertAlgodebugMacros(code) {
        return getDefines() + code;
    }

    static insertConvertersAfterIncludes(code, converters) {
        converters = converters
            .map((converter) => {
                let code = this.getRenamedConverterCode(converter);
                return code.slice(0, code.indexOf("{")).trim() + ";";
            })
            .join("\n");

        converters += "\n" + getDefaultConverters();

        let includeStartPosition = code.lastIndexOf("#include");
        let includeEndPosition = code.indexOf(">", includeStartPosition);
        let usingNamespaceStartPosition = code.lastIndexOf("using namespace");
        let usingNamespaceEndPosition = code.indexOf(";", usingNamespaceStartPosition);

        let position = Math.max(includeEndPosition, usingNamespaceEndPosition) + 1;
        code = code.slice(0, position) + "\n\n" + converters + code.slice(position);
        return code;
    }

    static insertConvertersAtTheEnd(code, converters) {
        converters = converters.map((converter) => this.getRenamedConverterCode(converter)).join("\n\n");
        return code + "\n\n" + converters;
    }

    static insertNecessaryIncludes(code) {
        const necessaryIncludes = ["iostream", "vector", "tuple"];
        for (let include of necessaryIncludes) {
            code = this.insertIncludeIfNotPresent(code, include);
        }
        return code;
    }

    static getRenamedConverterCode(converter) {
        let newConverterName = `algodebug_converter_${converter._id}`;
        return converter.code.replace("convert", newConverterName);
    }

    static removeTagsAndMapContent(code, tag, mappingFunction) {
        let i = 0;
        while ((i = code.indexOf(`<${tag}>`)) > 0) {
            let start = i + `<${tag}>`.length;
            let end = code.indexOf(`</${tag}>`, start);
            let content = code.substring(start, end);
            code = code.substring(0, i) + mappingFunction(content) + code.substring(end + `</${tag}>`.length);
        }
        return code;
    }

    static insertIncludeIfNotPresent(code, library) {
        const regex = new RegExp(`#include[ \t]*<${library}>`);
        if (!regex.test(code)) {
            return `#include <${library}>\n` + code;
        }
        return code;
    }

    static encloseInTag(content, tag) {
        return `<${tag}>${content}</${tag}>`;
    }
}

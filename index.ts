import * as ts from "typescript/lib/tsserverlibrary";
import * as fs from "fs";
import * as readline from "readline";

class StatsRecord
{
    clazz: string;
    func: string;
    ret: string;
    args: string[];

    constructor(clazz: string, func: string, ret: string, args: string[])
    {
        this.clazz = clazz;
        this.func = func;
        this.ret = ret;
        this.args = args;
    }
}

const factory: ts.server.PluginModuleFactory = (mod: { typescript: typeof ts }) =>
{
    const pluginModule: ts.server.PluginModule =
    {
        create: create,
    };
    return pluginModule;
}

function create (info: ts.server.PluginCreateInfo): ts.LanguageService
{
    info.project.projectService.logger.info("Creating typescript-planner.");

    const ls = info.languageService;
    let records = loadStats();

    const delegate = ls.getApplicableRefactors;
    ls.getApplicableRefactors = (fileName, positionOrRange, preferences, triggerReason?) =>
    {
        const result = delegate(fileName, positionOrRange, preferences, triggerReason);
        let ext = getApplicableRefactors(positionOrRange, ls, fileName, records, info.project.projectService.logger);
        if (ext)
        {
            result.push(ext);
        }
        return result;
    };

    return ls;
}

function getApplicableRefactors(positionOrRange: number | ts.TextRange,
    ls: ts.LanguageService,
    fileName: string,
    records: Array<StatsRecord>,
    logger: ts.server.Logger): ts.ApplicableRefactorInfo | null
{
    if (!(typeof positionOrRange == "number"))
    {
        logger.info(`position is range; pos=${positionOrRange.pos}, end=${positionOrRange.end}`);
        positionOrRange = positionOrRange.pos;
    }

    logger.info(`analyze ${fileName}, position ${positionOrRange}`);
    const defs = ls.getDefinitionAtPosition(fileName, positionOrRange);

    if (!(defs))
    {
        logger.info("Language service cannot find definition.")
        return null;
    }

    for (const element of defs)
    {
        logger.info(`Definition found: ${element.containerName}.${element.name}: ${element.kind}`);
    }

    let def = defs
        .filter((value, index, obj) => value.kind == ts.ScriptElementKind.functionElement
            || value.kind == ts.ScriptElementKind.memberFunctionElement)
        .find((value, index, obj) =>
        {
            logger.info(`Comparing ${value.containerName}.${value.name}`);
            return records.find((v, i, o) => v.clazz == value.containerName)
                && records.find((v, i, o) => v.func == value.name);
        });

    if (def)
    {
        let refactor = {
            name: "Load type definition from stats file",
            description: "",
            actions: [
                {
                    name: "Load type definition from stats file",
                    description: "",
                }
            ]
        };
        return refactor;
    }

    return null;
}

function loadStats(): Array<StatsRecord>
{
    const filePath = "D:/Naohiro/Documents/Repos2/Tools/TypeScriptPlanner/stats.csv";

    try
    {
        fs.statSync(filePath);
    }
    catch(error)
    {
        if (error.code == "ENOENT")
        {
            console.log(filePath + " が存在しません。");
        }
    }

    const stream = fs.createReadStream(filePath);
    const reader = readline.createInterface(stream);

    let records = new Array<StatsRecord>();
    reader.on("line", (data) =>
    {
        const elements = data.split(",");
        let args = elements.slice(4,11).filter((value, index, array) => value);
        records.push(new StatsRecord(elements[1], elements[2], elements[3], args));
    });

    return records;
}

export = factory;
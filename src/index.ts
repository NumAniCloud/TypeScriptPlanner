import * as ts from "typescript/lib/tsserverlibrary";
import { Refactor } from "./refactor";

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
    let refactor = new Refactor(ls, info);
    refactor.loadStats();

    const delegate = ls.getApplicableRefactors;
    ls.getApplicableRefactors = (fileName, positionOrRange, preferences) =>
    {
        const result = delegate(fileName, positionOrRange, preferences);
        let ext = refactor.getApplicableRefactors(positionOrRange, fileName);
        if (ext)
        {
            result.push(ext);
        }
        return result;
    };

    const delegate2 = ls.getEditsForRefactor;
    ls.getEditsForRefactor = (fileName, formatOptions, positionOrRange, refactorName, actionName, preferences) =>
    {
        let result = delegate2(fileName, formatOptions, positionOrRange, refactorName, actionName, preferences);
        const ext = refactor.getFileTextChanges(fileName, positionOrRange);

        if (!result)
        {
            result = {
                edits: [ext]
            };
        }
        else if (ext)
        {
            result.edits.push(ext);
        }

        return result;
    };

    return ls;
}

export = factory;
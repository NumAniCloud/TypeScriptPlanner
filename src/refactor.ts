import * as ts from "typescript/lib/tsserverlibrary";
import { DumpNodeVisitor, FindNodeVisitor } from "./visitors";
import { StatsRecord, StatsRecordRepo } from "./stats_record";
import { FunctionInfo } from "./function_info";

export class Refactor
{
	private ls: ts.LanguageService;
	private logger: ts.server.Logger;
	private recordRepo: StatsRecordRepo;

	public constructor(ls: ts.LanguageService, info: ts.server.PluginCreateInfo)
	{
		this.ls = ls;
		this.logger = info.project.projectService.logger;

		let statsPath = info.config.statsFilePath;
		if (!statsPath)
		{
			throw new Error("Stats file path is not set. please specify in tsconfig.json.");
		}

		this.recordRepo = new StatsRecordRepo(statsPath, info.project.projectService.logger);
	}

	public loadStats()
	{
		this.recordRepo.loadStats();
	}

	public getApplicableRefactors(positionOrRange: number | ts.TextRange, fileName: string)
		: ts.ApplicableRefactorInfo | null
	{
		const position = this.ensureNumber(positionOrRange);
		const def = this.getSubjectDefinition(fileName, position);
		return def && this.makeRefactorInfo();
	}

	private makeRefactorInfo(): ts.ApplicableRefactorInfo
	{
		return {
			name: "Load type definition from stats file",
			description: "Load type definition from stats file",
			actions: [
				{
					name: "Load type definition from stats file",
					description: "Load type definition from stats file",
				}
			]
		};
	}

	public getFileTextChanges(fileName: string, positionOrRange: number | ts.TextRange)
		: ts.FileTextChanges | null
	{
		const position = this.ensureNumber(positionOrRange);
		const def = this.getSubjectDefinition(fileName, position);
		const record = def && this.getSubjectRecord(def);
		if (!record)
		{
			this.logger.info(`Definition or record not found.`);
			return null;
		}

		this.logger.info(`Edit target range; start=${def.textSpan.start}, length=${def.textSpan.length}`);
		this.logger.info(`Context span: start=${def.contextSpan?.start}, length=${def.contextSpan?.length}`);

		const result = this.getStatement(fileName, def, record);
		const span = def.contextSpan ?? def.textSpan;

		return {
			fileName: fileName,
			textChanges: [
				{ "span": span, "newText": result }
			]
		};
	}

	private getSubjectRecord(definition: ts.DefinitionInfo)
		: StatsRecord | undefined
	{
		return this.recordRepo.findSubjectMatch(definition);
	}

	private getStatement(fileName: string, def: ts.DefinitionInfo, record: StatsRecord)
		: string | undefined
	{
		const program = this.ls.getProgram();
		const source = program.getSourceFile(fileName);

		return this.findNode(source, def.textSpan.start)
			?.getStatement(record);
	}	

	private findNode(sourceFile: ts.SourceFile, position: number): FunctionInfo | undefined
	{
		return new FindNodeVisitor(position).visit(sourceFile);
	}

	private ensureNumber(position: number | ts.TextRange): number
	{
		if (!(typeof position == "number"))
		{
			return position.pos;
		}
		return position;
	}

	private getSubjectDefinition(fileName: string, position: number): ts.DefinitionInfo
	{
		const defs = this.getDefinitions(fileName, position);
		const result = defs && this.findSubjectDefinition(defs);
		if (!result)
		{
			this.logger.info("Subject definition not found.");
		}
		return result;
	}
	
	private getDefinitions(fileName: string, positionOrRange: number)
		: readonly ts.DefinitionInfo[] | null
	{
		const defs = this.ls.getDefinitionAtPosition(fileName, positionOrRange);
		if (!defs)
		{
			this.logger.info(`Definition not found. fileName:${fileName}, position:${positionOrRange}`);
			return null;
		}

		for (const element of defs)
		{
			this.logger.info(`Definition found: ${element.containerName}.${element.name}: ${element.kind}`);
		}

		return defs;
	}
	
	private findSubjectDefinition(definitions: readonly ts.DefinitionInfo[])
		: ts.DefinitionInfo | undefined
	{
		return definitions
			.filter((value) => value.kind == ts.ScriptElementKind.functionElement
				|| value.kind == ts.ScriptElementKind.memberFunctionElement)
			.find((value) => this.recordRepo.findMatch(value));
	}
}

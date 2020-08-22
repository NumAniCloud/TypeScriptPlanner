import * as ts from "typescript/lib/tsserverlibrary";
import * as fs from "fs";
import * as readline from "readline";
import { DumpNodeVisitor, FindNodeVisitor } from "./visitors";
import { StatsRecord, StatsRecordRepo } from "./stats_record";
import { FunctionInfo } from "./function_info";

export class Refactor
{
	readonly statsPath: "D:/Naohiro/Documents/Repos2/Tools/TypeScriptPlanner/stats.csv";
	ls: ts.LanguageService;
	logger: ts.server.Logger;
	_records?: Array<StatsRecord>;
	recordRepo: StatsRecordRepo;

	public constructor(ls: ts.LanguageService, logger: ts.server.Logger)
	{
		this.ls = ls;
		this.logger = logger;
		this.recordRepo = new StatsRecordRepo(this.statsPath);
	}

	public loadStats()
	{
		this.recordRepo.loadStats();
	}

	private loadRecords(filePath: string)
	{
		const stream = fs.createReadStream(filePath);
		const reader = readline.createInterface(stream);

		let records = new Array<StatsRecord>();
		reader.on("line", (data) =>
		{
			const elements = data.split(",");
			let args = elements.slice(4, 11).filter((value, index, array) => value);
			records.push(new StatsRecord(elements[1], elements[2], elements[3], args));
		});
		return records;
	}

	public getApplicableRefactors(positionOrRange: number | ts.TextRange, fileName: string)
		: ts.ApplicableRefactorInfo | null
	{
		const position = this.ensureNumber(positionOrRange);
		let def = this.getSubjectDefinitionXX(fileName, position);
		return def && this.makeRefactorInfo(def);
	}

	private getDefinitions(fileName: string, positionOrRange: number)
		: readonly ts.DefinitionInfo[] | null
	{
		let defs = this.ls.getDefinitionAtPosition(fileName, positionOrRange);
		if (!defs)
		{
			return null;
		}

		for (const element of defs)
		{
			this.logger.info(`Definition found: ${element.containerName}.${element.name}: ${element.kind}`);
		}

		return defs;
	}

	private getSubjectDefinition(definitions: readonly ts.DefinitionInfo[])
		: ts.DefinitionInfo | undefined
	{
		return definitions
			.filter((value) => value.kind == ts.ScriptElementKind.functionElement
				|| value.kind == ts.ScriptElementKind.memberFunctionElement)
			.find((value) =>
			{
				return this.recordRepo.findMatch(value);
			});
	}

	private makeRefactorInfo(definition: ts.DefinitionInfo): ts.ApplicableRefactorInfo
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

	private getSubjectRecord(definition: ts.DefinitionInfo)
		: StatsRecord | undefined
	{
		return this.recordRepo.findMatch(definition);
	}

	private ensureNumber(position: number | ts.TextRange): number
	{
		if (!(typeof position == "number"))
		{
			return position.pos;
		}
		return position;
	}

	private getSubjectDefinitionXX(fileName: string, position: number): ts.DefinitionInfo
	{
		let defs = this.getDefinitions(fileName, position);
		return defs && this.getSubjectDefinition(defs);
	}

	public getFileTextChanges(fileName: string, positionOrRange: number | ts.TextRange)
		: ts.FileTextChanges | null
	{
		let position = this.ensureNumber(positionOrRange);

		let def = this.getSubjectDefinitionXX(fileName, position);
		let record = def && this.getSubjectRecord(def);
		if (!record)
		{
			return null;
		}

		this.logger.info(`Edit target range; start=${def.textSpan.start}, length=${def.textSpan.length}`);
		this.logger.info(`Context span: start=${def.contextSpan?.start}, length=${def.contextSpan?.length}`);

		let result = this.getStatement(fileName, def, record);
		let span = def.contextSpan ?? def.textSpan;

		return {
			fileName: fileName,
			textChanges: [
				{ "span": span, "newText": result }
			]
		};
	}

	private getStatement(fileName: string, def: ts.DefinitionInfo, record: StatsRecord)
		: string | undefined
	{
		const program = this.ls.getProgram();
		const source = program.getSourceFile(fileName);
		
		this.visitNodes(source);

		return this.findNode(source, def.textSpan.start)
			?.getStatement(record);
	}	

	private visitNodes(sourceFile: ts.SourceFile): void
	{
		let visitor = new DumpNodeVisitor(this.logger);
		visitor.visit(sourceFile);
	}

	private findNode(sourceFile: ts.SourceFile, position: number): FunctionInfo | undefined
	{
		let visitor = new FindNodeVisitor(position);
		return visitor.visit(sourceFile);
	}
}

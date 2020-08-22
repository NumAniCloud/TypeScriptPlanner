import * as ts from "typescript/lib/tsserverlibrary";
import * as fs from "fs";
import * as readline from "readline";
import { FunctionDeclaration } from "typescript/lib/tsserverlibrary";
import { DumpNodeVisitor, FindNodeVisitor } from "./visitors";

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

export class Refactor
{
	ls: ts.LanguageService;
	logger: ts.server.Logger;
	records?: Array<StatsRecord>;

	public constructor(ls: ts.LanguageService, logger: ts.server.Logger)
	{
		this.ls = ls;
		this.logger = logger;
	}

	public loadStats()
	{
		const filePath = "D:/Naohiro/Documents/Repos2/Tools/TypeScriptPlanner/stats.csv";

		try
		{
			fs.statSync(filePath);
		}
		catch (error)
		{
			if (error.code == "ENOENT")
			{
				console.log(filePath + " が存在しません。");
			}
		}

		this.records = this.loadRecords(filePath);
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
		if (this.records === null)
		{
			return null;
		}

		let defs = this.getDefinitions(fileName, positionOrRange);
		if (!defs)
		{
			this.logger.info("Language service cannot find definition.")
			return null;
		}

		let def = this.getSubjectDefinition(defs);
		if (!def)
		{
			return null;
		}

		return this.makeRefactorInfo(def);
	}

	private getDefinitions(fileName: string, positionOrRange: number | ts.TextRange)
		: readonly ts.DefinitionInfo[] | null
	{
		if (!(typeof positionOrRange == "number"))
		{
			this.logger.info(`position is range; pos=${positionOrRange.pos}, end=${positionOrRange.end}`);
			positionOrRange = positionOrRange.pos;
		}

		this.logger.info(`analyze ${fileName}, position ${positionOrRange}`);

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
			.filter((value, index, obj) => value.kind == ts.ScriptElementKind.functionElement
				|| value.kind == ts.ScriptElementKind.memberFunctionElement)
			.find((value, index, obj) =>
			{
				this.logger.info(`Comparing ${value.containerName}.${value.name}`);
				return this.records.find((v, i, o) => v.clazz == value.containerName)
					&& this.records.find((v, i, o) => v.func == value.name);
			});
	}

	private makeRefactorInfo(definition: ts.DefinitionInfo): ts.ApplicableRefactorInfo
	{
		return {
			name: "Load type definition from stats file",
			description: "",
			actions: [
				{
					name: "Load type definition from stats file",
					description: "",
				}
			]
		};
	}

	private getSubjectRecord(definition: ts.DefinitionInfo)
		: StatsRecord | undefined
	{
		if (this.records === null)
		{
			return undefined;
		}

		return this.records
			.find((value) =>
			{
				return definition.name == value.func
					&& definition.containerName == value.clazz;
			});
	}

	public getFileTextChanges(fileName: string, positionOrRange: number | ts.TextRange)
		: ts.FileTextChanges | null
	{
		if (!(typeof positionOrRange == "number"))
		{
			positionOrRange = positionOrRange.pos;
		}

		let defs = this.getDefinitions(fileName, positionOrRange);
		if (!defs)
		{
			return null;
		}

		let def = this.getSubjectDefinition(defs);
		if (!def)
		{
			return null;
		}

		let record = this.getSubjectRecord(def);
		if (!record)
		{
			return null;
		}

		this.logger.info(`Edit target range; start=${def.textSpan.start}, length=${def.textSpan.length}`);
		this.logger.info(`Context span: start=${def.contextSpan?.start}, length=${def.contextSpan?.length}`);

		let result = this.getStatement(fileName, def, record);
		let span = def.contextSpan;

		if (!span)
		{
			span = def.textSpan;
		}

		this.logger.info(`Resulting definition; ${result}`);

		return {
			fileName: fileName,
			textChanges: [
				{ "span": span, "newText": result }
			]
		};
	}

	private getStatement(fileName: string, def: ts.DefinitionInfo, record: StatsRecord)
	{
		let args = this.getArgumentList(fileName, def, record);
		let result = `function ${record.func}(${args}): ${record.ret}`;
		return result;
	}

	private getArgumentList(fileName: string, func: ts.DefinitionInfo, stats: StatsRecord): string
	{
		this.logger.info(`${ts.SyntaxKind.FunctionDeclaration}`);

		const program = this.ls.getProgram();
		const source = program.getSourceFile(fileName);
		this.logger.info(`${fileName}=\n${source.text}`);
		this.logger.info(`sourcefile: childCount = ${source.getChildCount()}`);
		for (const element of source.getChildren()) {
			this.logger.info(`childNode: ${element.kind}`);
		}

		this.visitNodes(source);
		const node = this.findNode(source, func.textSpan.start);

		this.logger.info(`AST node is ${node.kind}`);

		let func_node = node as FunctionDeclaration;
		if (func_node.kind == ts.SyntaxKind.FunctionDeclaration)
		{
			return this.parametersToString(func_node.parameters, stats);
		}

		let method_node = node as ts.MethodSignature;
		if (method_node.kind == ts.SyntaxKind.MethodSignature)
		{
			return this.parametersToString(method_node.parameters, stats);
		}

		return stats.args.map((value, index) => `arg${index}: ${value}`).join(", ");
	}

	private parametersToString(parameters: ts.NodeArray<ts.ParameterDeclaration>,
		stats: StatsRecord): string
	{
		return parameters
			.map((value, index) => `${value.name.getText()}: ${stats.args[index]}`)
			.join(", ");
	}

	private visitNodes(sourceFile: ts.SourceFile): void
	{
		let visitor = new DumpNodeVisitor(this.logger);
		visitor.visit(sourceFile);
	}

	private findNode(sourceFile: ts.SourceFile, position: number): ts.Node | undefined
	{
		let visitor = new FindNodeVisitor(position);
		return visitor.visit(sourceFile);
	}
}

/* FunctionDeclaration/MethodSignature
* パラメータを取れるという点が同じ
* SyntaxKindが異なる
* Nodeの型が異なる
* 生成するステートメントが異なる
*
* 必要そうな型：
* interface TypedefStatement
* class FunctionTypedefStatement extends TypedefStatement
* class MethodTypedefStatement extends TypedefStatement
* class TypedefStatementFactory
*/

class FunctionStatement
{
	node: ts.FunctionDeclaration;

	constructor(node: ts.FunctionDeclaration)
	{
		this.node = node;
	}

	public getStatement(record: StatsRecord)
	{
		let args = this.parametersToString(record);
		let result = `function ${record.func}(${args}): ${record.ret}`;
		return result;
	}

	private parametersToString(stats: StatsRecord): string
	{
		return this.node.parameters
			.map((value, index) => `${value.name.getText()}: ${stats.args[index]}`)
			.join(", ");
	}
}
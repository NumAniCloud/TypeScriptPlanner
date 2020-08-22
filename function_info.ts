import * as ts from "typescript/lib/tsserverlibrary";
import { StatsRecord } from "./stats_record";

export interface FunctionInfo
{
	getStatement(record: StatsRecord): string;
}

export class FunctionInfoFactory
{
	public static create(node: ts.Node): FunctionInfo | undefined
	{
		if (node.kind == ts.SyntaxKind.FunctionDeclaration)
		{
			return new FunctionStatement(node as ts.FunctionDeclaration);
		}

		if (node.kind == ts.SyntaxKind.MethodSignature)
		{
			return new MethodSignatureStatement(node as ts.MethodSignature);
		}

		return undefined;
	}
}

class FunctionStatement implements FunctionInfo
{
	node: ts.FunctionDeclaration;

	constructor(node: ts.FunctionDeclaration)
	{
		this.node = node;
	}

	public getStatement(record: StatsRecord): string
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

class MethodSignatureStatement implements FunctionInfo
{
	node: ts.MethodSignature;

	constructor(node: ts.MethodSignature)
	{
		this.node = node;
	}

	public getStatement(record: StatsRecord): string
	{
		let args = this.parametersToString(record);
		return `${record.func}(${args}): ${record.ret}`;
	}

	private parametersToString(stats: StatsRecord): string
	{
		return this.node.parameters
			.map((value, index) => `${value.name.getText()}: ${stats.args[index]}`)
			.join(", ");
	}
}
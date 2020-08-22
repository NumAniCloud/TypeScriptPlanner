import * as ts from "typescript/lib/tsserverlibrary";
import * as funinf from "./function_info";

class NodeVisitor<T>
{
	public visit(node: ts.Node): T | undefined
	{
		for (const child of node.getChildren())
		{
			let result = this.visit(child);
			if (result)
			{
				return result;
			}
		}
	}
}

export class DumpNodeVisitor extends NodeVisitor<undefined>
{
	indent: Array<string> = [];
	logger: ts.server.Logger;

	constructor(logger: ts.server.Logger)
	{
		super();
		this.logger = logger;
	}

	public visit(node: ts.Node): undefined
	{
		let header = this.indent.join("");
		this.logger.info(header + `node.kind:${node.kind}, ${node.getFullText()}`);
		this.indent.push("→");

		let result = super.visit(node);
		if (result)
		{
			return result;
		}

		this.indent.pop();
	}
}

export class FindNodeVisitor extends NodeVisitor<funinf.FunctionInfo>
{
	position: number;

	constructor(position: number)
	{
		super();
		this.position = position;
	}

	public visit(node: ts.Node): funinf.FunctionInfo | undefined
	{
		if (this.position < node.getStart() || this.position > node.getEnd())
		{
			return undefined;
		}

		let result = super.visit(node);
		if (result)
		{
			return result;
        }
        
        return funinf.FunctionInfoFactory.create(node);
	}
}
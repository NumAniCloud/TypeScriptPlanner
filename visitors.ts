import * as ts from "typescript/lib/tsserverlibrary";

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
		this.logger.info(header + `node.kind:${node.kind}, ${node.getText()}\n${node.getFullText()}`);
		this.indent.push("→");

		let result = super.visit(node);
		if (result)
		{
			return result;
		}

		this.indent.pop();
	}
}

export class FindNodeVisitor extends NodeVisitor<ts.Node>
{
	position: number;

	constructor(position: number)
	{
		super();
		this.position = position;
	}

	public visit(node: ts.Node): ts.Node | undefined
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

		if (node.kind == ts.SyntaxKind.FunctionDeclaration
			|| node.kind == ts.SyntaxKind.MethodSignature)
		{
			return node;
		}
	}
}
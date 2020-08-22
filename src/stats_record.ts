import * as fs from "fs";
import * as readline from "readline";
import * as ts from "typescript/lib/tsserverlibrary";

export class StatsRecord
{
	clazz: string;
	func: string;
	ret: string;
	args: string[];

	constructor(clazz: string, func: string, ret: string, args: string[])
	{
		this.clazz = clazz;
		this.func = func;
		this.ret = ret === "undefined" ? "void" : ret;
		this.args = args;
	}
}

export class StatsRecordRepo
{
	statsFilePath: string;
	records?: Array<StatsRecord>;

	constructor(statsFilePath: string)
	{
		this.statsFilePath = statsFilePath;
	}

	public loadStats()
	{
		try
		{
			fs.statSync(this.statsFilePath);
		}
		catch (error)
		{
			if (error.code == "ENOENT")
			{
				console.log(this.statsFilePath + " が存在しません。");
			}
		}

		this.records = this.loadRecords(this.statsFilePath);
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

	public filterMatch(definition: ts.DefinitionInfo): readonly StatsRecord[] | undefined
	{
		if (this.records === null)
		{
			return undefined;
		}
		
		return this.records
			.filter((value) =>
			{
				return definition.name == value.func
					&& definition.containerName == value.clazz;
			});
	}
	
	public findMatch(definition: ts.DefinitionInfo): StatsRecord | undefined
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
}
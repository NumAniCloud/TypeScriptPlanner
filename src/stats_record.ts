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
		this.ret = ret;
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
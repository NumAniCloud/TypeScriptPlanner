
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
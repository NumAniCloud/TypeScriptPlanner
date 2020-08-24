using System;
using System.Collections.Generic;
using System.Text;

namespace TypeAggregator.Stats
{
	public interface IStatsFileLoader
	{
		IEnumerable<string> EnumerateFilePathes(string extension);
	}
}

using System;
using System.Collections.Generic;
using System.Text;

namespace TypeAggregator.Stats
{
	public interface IStatsSourceSelector
	{
		IEnumerable<string> GetFilePathes(IStatsFileLoader loader);
		(int count, string key) ExtractRecord(string line);
	}
}

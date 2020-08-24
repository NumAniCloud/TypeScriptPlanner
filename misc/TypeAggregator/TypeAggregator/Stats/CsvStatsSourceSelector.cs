using System.Collections.Generic;

namespace TypeAggregator.Stats
{
	class CsvStatsSourceSelector : IStatsSourceSelector
	{
		public (int count, string key) ExtractRecord(string line)
		{
			var splitted = line.Split(",");
			var count = int.Parse(splitted[0]);
			var key = string.Join(",", splitted[1..]);
			return (count, key);
		}

		public IEnumerable<string> GetFilePathes(IStatsFileLoader loader)
		{
			return loader.EnumerateFilePathes("*.csv");
		}
	}
}

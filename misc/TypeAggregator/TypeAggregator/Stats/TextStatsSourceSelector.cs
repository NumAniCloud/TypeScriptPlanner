using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace TypeAggregator.Stats
{
	class TextStatsSourceSelector : IStatsSourceSelector
	{
		public (int count, string key) ExtractRecord(string line)
		{
			return (1, line);
		}

		public IEnumerable<string> GetFilePathes(IStatsFileLoader loader)
		{
			return loader.EnumerateFilePathes("*.txt");
		}
	}
}

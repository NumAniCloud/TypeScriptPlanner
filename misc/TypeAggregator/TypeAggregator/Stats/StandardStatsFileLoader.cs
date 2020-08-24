using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace TypeAggregator.Stats
{
	internal class StandardStatsFileLoader : IStatsFileLoader
	{
		public IEnumerable<string> EnumerateFilePathes(string extension)
		{
			return Directory.EnumerateFiles(Environment.CurrentDirectory,
				extension,
				SearchOption.TopDirectoryOnly);
		}
	}
}

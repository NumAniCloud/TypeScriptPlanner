using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using TypeAggregator.Stream;

namespace TypeAggregator.Stats
{
	internal class StatsDeserializer
	{
		private readonly Func<string, (int count, string key)> _selector;

		public StatsDeserializer(Func<string, (int count, string key)> selector)
		{
			_selector = selector;
		}

		public async Task<IDictionary<string, int>> ReadRecordsAsync(IReadLineStream reader)
		{
			var result = new Dictionary<string, int>();
			while (await reader.ReadLineAsync() is { } line)
			{
				ApplyRecord(line);
			}

			return result;
			
			void ApplyRecord(string line)
			{
				var (count, key) = _selector(line);

				if (result!.ContainsKey(key))
				{
					result[key] += count;
				}
				else
				{
					result[key] = count;
				}
			}
		}
	}
}

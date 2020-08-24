using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TypeAggregator.Stats;
using TypeAggregator.Stream;

namespace TypeAggregator
{
	// いくつもインターフェースを噛ませて複雑な形状にするより、ファイルを読み込むクラスと文字列を解釈するクラスに分けたい

	internal class RecordLoader
	{
		private readonly IReadLineStreamFactory _readLineStreamFactory;
		private readonly IStatsFileLoader _fileLoader;

		public RecordLoader(IReadLineStreamFactory readLineStreamFactory, IStatsFileLoader fileLoader)
		{
			_readLineStreamFactory = readLineStreamFactory;
			_fileLoader = fileLoader;
		}

		public async Task<Record[]?> LoadAsync(string[] options)
		{
			if (options.Length == 0)
			{
				return null;
			}

			var subCommand = options[0];

			switch (subCommand)
			{
			case "txt":
				Console.WriteLine("テキストファイルから読み込みます");
				return await LoadRecordsAsync_refactor(new TextStatsSourceSelector());
			case "csv":
				Console.WriteLine("csvファイルから読み込みます");
				return await LoadRecordsAsync_refactor(new CsvStatsSourceSelector());
			default:
				return null;
			}
		}

		private async Task<Record[]> LoadRecordsAsync_refactor(IStatsSourceSelector provider)
		{
			var deserializer = new StatsDeserializer(provider.ExtractRecord);
			var aggregations = new List<IDictionary<string, int>>();
			foreach (var path in provider.GetFilePathes(_fileLoader))
			{
				using var reader = _readLineStreamFactory.Create(path);
				aggregations.Add(await deserializer.ReadRecordsAsync(reader));
			}

			return aggregations.SelectMany(x => x)
				.GroupBy(pair => pair.Key)
				.Select(group => new Record(group.Key,
					group.Sum(x => x.Value)))
				.ToArray();
		}

		public async Task<Record[]> LoadRecordsAsync(IStatsSourceSelector provider)
		{
			var records = new Dictionary<string, int>();
			foreach (var path in provider.GetFilePathes(_fileLoader))
			{
				await ReadRecordsXxx(path);
			}

			return records.Select(r => new Record(r.Key, r.Value))
				.ToArray();

			async Task ReadRecordsXxx(string path)
			{
				using var reader = _readLineStreamFactory.Create(path);

				while (await reader.ReadLineAsync() is { } line)
				{
					ApplyRecord(line);
				}
			}

			void ApplyRecord(string line)
			{
				var (count, key) = provider.ExtractRecord(line);

				if (records!.ContainsKey(key))
				{
					records[key] += count;
				}
				else
				{
					records[key] = count;
				}
			}
		}
	}
}

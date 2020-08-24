using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TypeAggregator.Stats;
using TypeAggregator.Stream;

namespace TypeAggregator
{
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
				return await LoadRecordsAsync(new TextStatsSourceSelector());
			case "csv":
				Console.WriteLine("csvファイルから読み込みます");
				return await LoadRecordsAsync(new CsvStatsSourceSelector());
			default:
				return null;
			}
		}

		private async Task<Record[]> LoadRecordsFromTextAsync()
		{
			var files = Directory.EnumerateFiles(Environment.CurrentDirectory, "*.txt", SearchOption.TopDirectoryOnly)
				.ToArray();
			return await LoadRecordsAsync(files, line => (1, line));
		}

		private async Task<Record[]> LoadRecordFromCsvAsync()
		{
			var files = Directory.EnumerateFiles(Environment.CurrentDirectory, "*.csv", SearchOption.TopDirectoryOnly)
				.ToArray();
			return await LoadRecordsAsync(files, ExtractRecord);

			static (int count, string key) ExtractRecord(string line)
			{
				var splitted = line.Split(",");
				var count = int.Parse(splitted[0]);
				var key = string.Join(",", splitted[1..]);
				return (count, key);
			}
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
		
		private async Task<Record[]> LoadRecordsAsync(string[] filePathes, Func<string, (int, string)> toRecord)
		{
			Console.WriteLine($"{filePathes.Length}個のファイルを解析します");

			var records = new Dictionary<string, int>();
			foreach (var path in filePathes)
			{
				await ReadRecordsXxx(path);
				Console.Write(".");
			}

			var stats = new List<Record>();
			foreach (var r in records)
			{
				stats.Add(new Record(r.Key, r.Value));
			}

			Console.WriteLine();

			return stats.ToArray();

			async Task ReadRecordsXxx(string path)
			{
				using var reader = _readLineStreamFactory.Create(path);

				while (await reader.ReadLineAsync() is { } line)
				{
					ApplyRecord(line);
				}
			}

			void ReadRecords(string path)
			{
				using var file = File.OpenRead(path);
				using var reader = new StreamReader(file);

				while (!reader.EndOfStream)
				{
					var line = reader.ReadLine();
					if (line is null)
					{
						break;
					}

					ApplyRecord(line);
				}
			}

			void ApplyRecord(string line)
			{
				var (count, key) = toRecord(line);

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

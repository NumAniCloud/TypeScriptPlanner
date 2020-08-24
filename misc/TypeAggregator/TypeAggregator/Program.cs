using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace TypeAggregator
{
	internal class Program
	{
		private static Record[] LoadRecords(string[] filePathes, Func<string, (int, string)> toRecord)
		{
			Console.WriteLine($"{filePathes.Length}個のファイルを解析します");

			var records = new Dictionary<string, int>();
			foreach (var path in filePathes)
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

					var (count, key) = toRecord(line);

					if (records.ContainsKey(key))
					{
						records[key] += count;
					}
					else
					{
						records[key] = count;
					}
				}

				Console.Write(".");
			}

			var stats = new List<Record>();
			foreach (var r in records)
			{
				stats.Add(new Record(r.Key, r.Value));
			}

			Console.WriteLine();

			return stats.ToArray();
		}

		private static Record[] MergeRecords(Record[] records)
		{
			var result = new List<Record>();

			foreach (var item in records)
			{
				var same = result.FirstOrDefault(x => x.Method == item.Method
					&& x.Args.Count == item.Args.Count);

				if (same is {})
				{
					for (var i = 0; i < item.Args.Count; i++)
					{
						if (item.Args[i] != same.Args[i])
						{
							same.SetArg(i, $"{same.Args[i]}|{item.Args[i]}");
						}
					}
					same.Appearance += item.Appearance;
				}
				else
				{
					result.Add(item);
				}
			}

			return result.OrderBy(x => x.Method).ToArray();
		}

		private static Record[] LoadRecordsFromText()
		{
			var files = Directory.EnumerateFiles(Environment.CurrentDirectory, "*.txt", SearchOption.TopDirectoryOnly)
				.ToArray();
			return LoadRecords(files, line => (1, line));
		}

		private static Record[] LoadRecordFromCsv()
		{
			var files = Directory.EnumerateFiles(Environment.CurrentDirectory, "*.csv", SearchOption.TopDirectoryOnly)
				.ToArray();
			return LoadRecords(files, ExtractRecord);

			static (int count, string key) ExtractRecord(string line)
			{
				var splitted = line.Split(",");
				var count = int.Parse(splitted[0]);
				var key = string.Join(",", splitted[1..]);
				return (count, key);
			}
		}

		private static void WriteStatsCsv(IEnumerable<Record> stats, string filePath)
		{
			Console.WriteLine("解析完了。出力中…");

			if(File.Exists(filePath))
			{
				var ext = Path.GetExtension(filePath);
				var fileName = Path.GetFileNameWithoutExtension(filePath);
				for (var i = 0; i < 64; i++)
				{
					var name = fileName + i;
					if (!File.Exists(name + ext))
					{
						filePath = filePath.Replace(fileName, name);
						break;
					}
				}
			}

			{
				using var file = File.OpenWrite(filePath);
				using var writer = new StreamWriter(file);
				foreach (var item in stats)
				{
					writer.WriteLine($"{item.Appearance},{item.Invocation}");
				}
			}
			Console.WriteLine("出力完了。");
		}

		private static ObjectType[] ExtractObjectTypes(Record[] records)
		{
			var analyzer = new ObjectTypeAnalyzer();
			var ot = analyzer.LoadObjectTypes(records);
			return analyzer.MergeObjectTypes(ot);
		}

		private static void WriteObjectTypes(ObjectType[] objectTypes)
		{
			Console.WriteLine("オブジェクト情報を出力中");
			using var file = File.OpenWrite("types.log");
			using var writer = new StreamWriter(file);

			foreach (var item in objectTypes)
			{
				writer.WriteLine(item.ToString());
				writer.WriteLine();
			}
		}

		private static void Main(string[] args)
		{
			Console.WriteLine("# typelog-aggregator");

			if (args.Length == 0)
			{
				Console.WriteLine("usage:");
				Console.WriteLine("typelog-aggregator [txt|csv]");
				return;
			}

			Record[] stats;
			if (args[0] == "txt")
			{
				Console.WriteLine("テキストファイルから読み込みます");
				stats = LoadRecordsFromText();
			}
			else if(args[0] == "csv")
			{
				Console.WriteLine("csvファイルから読み込みます");
				stats = LoadRecordFromCsv();
			}
			else
			{
				Console.WriteLine("usage:");
				Console.WriteLine("typelog-aggregator [txt|csv]");
				return;
			}

			var types = ExtractObjectTypes(stats.ToArray());
			WriteObjectTypes(types);
				
			var merged = MergeRecords(stats);
			WriteStatsCsv(merged, "stats.csv");
		}
	}
}

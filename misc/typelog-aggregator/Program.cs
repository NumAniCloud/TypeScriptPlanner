using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace typelog_aggregator
{
	class Record
	{
		public Record(string invocation, int appearance)
		{
			Invocation = invocation.Trim(' ');
			Appearance = appearance;
		}

		public string Invocation { get; }
		public int Appearance { get; }
	}

	class Program
	{
		static List<Record> LoadRecords(string[] filePathes, Func<string, (int, string)> toRecord)
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

			return stats;           
		}

		static List<Record> LoadRecordsFromText()
		{
			var files = Directory.EnumerateFiles(Environment.CurrentDirectory, "*.txt", SearchOption.TopDirectoryOnly)
				.ToArray();
			return LoadRecords(files, line => (1, line));
		}

		static List<Record> LoadRecordFromCsv()
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

		static void WriteStatsCsv(IEnumerable<Record> stats, string filePath)
		{
			Console.WriteLine("解析完了。出力中…");

			if(File.Exists(filePath))
			{
				var ext = Path.GetExtension(filePath);
				var fileName = Path.GetFileNameWithoutExtension(filePath);
				for (int i = 0; i < 64; i++)
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

		static ObjectType[] ExtractObjectTypes(Record[] records)
		{
			var analyzer = new ObjectTypeAnalyzer();
			var ot = analyzer.LoadObjectTypes(records);
			return analyzer.MergeObjectTypes(ot);
		}

		static void WriteObjectTypes(ObjectType[] objectTypes)
		{
			System.Console.WriteLine("オブジェクト情報を出力中");
			using var file = File.OpenWrite("types.log");
			using var writer = new StreamWriter(file);

			foreach (var item in objectTypes)
			{
				writer.WriteLine(item.ToString());
				writer.WriteLine();
			}
		}

		static void TestDistinct()
		{
			var obj = new []
			{
				new ObjectType.Property("hoge", "Object"),
				new ObjectType.Property("hogeB", "string"),
				new ObjectType.Property("hogeC", "string"),
			};
			var obj2 = new []
			{
				new ObjectType.Property("hoge", "Object"),
				new ObjectType.Property("hogeB", "string"),
				new ObjectType.Property("hogeC", "string"),
			};

			var objA = new ObjectType("hoge", obj, "");
			var objB = new ObjectType("fuga", obj2, "");
			var distinct = new []{ objA, objB }
				.Distinct(new SequenceComparer());

			System.Console.WriteLine($"distinct count = {distinct.Count()}");
		}

		static void Main(string[] args)
		{
			Console.WriteLine("# typelog-aggregator");

			if (args.Length == 0)
			{
				System.Console.WriteLine("usage:");
				System.Console.WriteLine("typelog-aggregator [txt|csv]");
				return;
			}

			List<Record> stats;
			if (args[0] == "txt")
			{
				System.Console.WriteLine("テキストファイルから読み込みます");
				stats = LoadRecordsFromText();
				WriteStatsCsv(stats, "stats.csv");
			}
			else if(args[0] == "csv")
			{
				System.Console.WriteLine("csvファイルから読み込みます");
				stats = LoadRecordFromCsv();
				WriteStatsCsv(stats, "statsAgg.csv");
			}
			else
			{
				System.Console.WriteLine("usage:");
				System.Console.WriteLine("typelog-aggregator [txt|csv]");
				return;
			}

			var types = ExtractObjectTypes(stats.ToArray());
			WriteObjectTypes(types);
		}
	}
}

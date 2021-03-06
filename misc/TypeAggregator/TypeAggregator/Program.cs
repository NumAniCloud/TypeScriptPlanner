﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using TypeAggregator.Stats;
using TypeAggregator.Stream;

[assembly: InternalsVisibleTo("TypeAggregator.Test")]

namespace TypeAggregator
{
	internal class Program
	{
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

		private static async Task Main(string[] args)
		{
			Console.WriteLine("# typelog-aggregator");

			var recordLoader = new RecordLoader(new StandardReadLineStreamFactory(),
				new StandardStatsFileLoader());
			var stats = await recordLoader.LoadAsync(args);

			if (stats is null)
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

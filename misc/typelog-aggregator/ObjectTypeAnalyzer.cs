
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace typelog_aggregator
{
    class ObjectTypeAnalyzer
    {
        public ObjectTypeAnalyzer()
        {
        }

        public ObjectType[] LoadObjectTypes(Record[] records)
        {
			System.Console.WriteLine("オブジェクト解析中");

			var result = new List<ObjectType>();
			foreach (var record in records)
			{
				var tables = record.Args.Append(record.Return)
                    .Where(x => Regex.IsMatch(x, @"{.+}"))
					.Select(x => Regex.Matches(x, @"\{\s*((?<prop>\s*[\w<>]+\s*:\s*[\w<>]+\s*);?)+\s*\}"))
					.Select(x =>
					{
						return x.SelectMany(y => y.Groups["prop"].Captures)
							.Select(y => y.Value.Split(":"))
							.Select(y => new ObjectType.Property(y[0].Trim(), y[1].Trim()));
					})
					.Select((x, i) => new ObjectType($"{record.Method}:{i}", x.ToArray(), record.Invocation));
				result.AddRange(tables);
			}

			return result.ToArray();
        }

        public ObjectType[] MergeObjectTypes(ObjectType[] source)
        {
            List<ObjectType> result = new List<ObjectType>();

            foreach (var item in source)
            {
                if (result.FirstOrDefault(x => x.Equals(item)) is {} ot)
                {
                    ot.Methods.AddRange(item.Methods);
                }
                else
                {
                    result.Add(item);
                }
            }

            return result.ToArray();
        }
    }
}
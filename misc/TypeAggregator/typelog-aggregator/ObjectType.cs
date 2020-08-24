using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;

namespace TypeAggregator
{
	internal class ObjectType
	{
		public ObjectType(string title, Property[] properties, string source)
		{
            Methods = new List<string> { title };
            Properties = properties;
            Source = source;
        }

        public List<string> Methods { get; }
        public Property[] Properties { get; }
        public string Source { get; }

		public override string ToString()
		{
			var props = Properties.OrderBy(x => x.Name)
				.Select(x => x.ToString());
			var propsString = string.Join("\n", props);
            var methods = string.Join("\n", Methods);
			return $"{methods}\n{Source}\n{{\n{propsString}\n}}";
		}

        public override bool Equals(object obj)
        {
            if (obj is ObjectType other)
            {
                if (other.Properties.Length != Properties.Length)
                {
                    return false;
                }
                return other.Properties.All(x => Properties.Any(y => x.Equals(y)));
            }
            return false;
        }

		public override int GetHashCode()
		{
			int hash = 0;
			var primes = new [] { 5, 7, 11, 13, 17, 19, 23, 31, 39, 41, 47 };
			for (int i = 0; i < Properties.Length; i++)
			{
				int factor = i < primes.Length ? primes[i] : 1;
				hash += factor * Properties[i].GetHashCode();
			}
			return hash;
		}

        public class Property : IEquatable<Property>
		{
			public Property(string name, string type)
			{
                Name = name;
                Type = type;
            }

			public override bool Equals(object obj)
			{
				if (obj is Property prop)
				{
					return Equals(prop);
				}
				return false;
			}

			public override int GetHashCode()
			{
				var hash = 3 * Name.GetHashCode(StringComparison.InvariantCulture)
					* Type.GetHashCode(StringComparison.InvariantCulture);
				return hash;
			}

			public override string ToString()
			{
				return $"\t{Name}: {Type};";
			}

            public bool Equals([AllowNull] Property other)
            {
				return Name == other.Name && Type == other.Type;
            }

            public string Name { get; }
            public string Type { get; }
        }
	}
}
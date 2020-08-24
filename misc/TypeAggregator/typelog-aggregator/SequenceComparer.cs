using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;

namespace TypeAggregator
{
	internal class SequenceComparer : IEqualityComparer<ObjectType>
    {
		public bool Equals([AllowNull] ObjectType x, [AllowNull] ObjectType y)
        {
            if (x is null || y is null)
            {
                return false;
            }

            if (x.Properties.Length != y.Properties.Length)
            {
                return false;
            }

            return x.Properties.All(n =>
            {
                return y.Properties.Any(m =>
                {
                    return m.Equals(n);
                });
            });
        }

        public int GetHashCode([DisallowNull] ObjectType obj)
        {
            return obj.GetHashCode();
        }
    }
}
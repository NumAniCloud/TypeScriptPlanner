
using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;

namespace typelog_aggregator
{
    class DelegateComparer<T> : IEqualityComparer<T>
    {
        private readonly Func<T, T, bool> equal;

        public DelegateComparer(Func<T, T, bool> equal)
        {
            this.equal = equal;
        }

        public bool Equals([AllowNull] T x, [AllowNull] T y)
        {
            if (x is null || y is null)
            {
                return false;
            }

            return equal(x, y);
        }

        public int GetHashCode([DisallowNull] T obj)
        {
            return obj.GetHashCode();
        }
    }

    static class DistinctExtension
    {
        public static IEnumerable<T> Distinct<T>(this IEnumerable<T> source, Func<T, T, bool> equal)
        {
            return source.Distinct(new DelegateComparer<T>(equal));
        }
    }
}
using Xunit;

namespace TypeAggregator.Test
{
	internal static class AssertHelper
	{
		public static T AssertNotNull<T>(this T? obj) where T : class
		{
			Assert.NotNull(obj);
			return obj!;
		}
	}
}

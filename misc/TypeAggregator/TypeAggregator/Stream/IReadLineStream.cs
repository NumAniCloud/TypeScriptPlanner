using System;
using System.Threading.Tasks;

namespace TypeAggregator.Stream
{
	public interface IReadLineStream : IDisposable
	{
		Task<string?> ReadLineAsync();
	}
}

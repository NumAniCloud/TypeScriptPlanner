using System;
using System.IO;
using System.Threading.Tasks;

namespace TypeAggregator.Stream
{
	internal class StandardReadLineStream : IReadLineStream
	{
		private readonly StreamReader _stream;

		public StandardReadLineStream(string filePath)
		{
			_stream = new StreamReader(filePath);
		}

		public void Dispose()
		{
			_stream.Dispose();
		}

		public async Task<string?> ReadLineAsync()
		{
			return await _stream.ReadLineAsync();
		}
	}
}

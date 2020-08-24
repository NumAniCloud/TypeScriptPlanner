namespace TypeAggregator.Stream
{
	internal class StandardReadLineStreamFactory : IReadLineStreamFactory
	{
		public IReadLineStream Create(string filePath)
		{
			return new StandardReadLineStream(filePath);
		}
	}
}

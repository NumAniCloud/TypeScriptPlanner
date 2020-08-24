namespace TypeAggregator.Stream
{
	public interface IReadLineStreamFactory
	{
		IReadLineStream Create(string filePath);
	}
}

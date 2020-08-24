using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using Moq;
using TypeAggregator.Stats;
using TypeAggregator.Stream;

namespace TypeAggregator.Test
{
	public class RecordLoaderTest
	{
#pragma warning disable CS1998 // 非同期メソッドは、'await' 演算子がないため、同期的に実行されます
		[Fact]
		public void Test1()
		{
			var lines = new string[]
			{
				"Type,Method,return,arg1,arg2,",
			};
			var lineIndex = 0;
			var streamMock = new Mock<IReadLineStream>();
			streamMock.Setup(x => x.ReadLineAsync())
				.Returns(async () => lineIndex < lines.Length ? lines[lineIndex++] : null);

			var streamFactoryMock = new Mock<IReadLineStreamFactory>();
			streamFactoryMock.Setup(x => x.Create(It.IsAny<string>()))
				.Returns(streamMock.Object);

			var loaderMock = new Mock<IStatsFileLoader>();
			loaderMock.Setup(x => x.EnumerateFilePathes(It.IsAny<string>()))
				.Returns((string ext) => new[] {"hoge.txt"});

			var recordLoader = new RecordLoader(streamFactoryMock.Object, loaderMock.Object);

			var record = recordLoader.LoadAsync(new[] {"txt"}).Result
				?.Single();

			var recordNotNull = record.AssertNotNull();
			Assert.Equal("Type,Method,return,arg1,arg2,", recordNotNull.Invocation);
			Assert.Equal(1, recordNotNull.Appearance);
		}
#pragma warning restore CS1998 // 非同期メソッドは、'await' 演算子がないため、同期的に実行されます
	}
}

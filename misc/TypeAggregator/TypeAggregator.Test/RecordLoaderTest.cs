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
		private RecordLoader GetLoader(string[] fileContent)
		{
			var lineIndex = 0;
			var streamMock = new Mock<IReadLineStream>();
			streamMock.Setup(x => x.ReadLineAsync())
				.Returns(async () =>
					lineIndex < fileContent.Length ? fileContent[lineIndex++] : null);

			var streamFactoryMock = new Mock<IReadLineStreamFactory>();
			streamFactoryMock.Setup(x => x.Create(It.IsAny<string>()))
				.Returns(streamMock.Object);

			var loaderMock = new Mock<IStatsFileLoader>();
			loaderMock.Setup(x => x.EnumerateFilePathes(It.IsAny<string>()))
				.Returns((string ext) => new[] { "hoge.txt" });

			return new RecordLoader(streamFactoryMock.Object, loaderMock.Object);
		}

		[Fact]
		public void Test1()
		{
			var contents = new[]
			{
				"Type,Method,return,arg1,arg2,"
			};
			var recordLoader = GetLoader(contents);

			var record = recordLoader.LoadAsync(new[] { "txt" }).Result
				?.Single();

			var recordNotNull = record.AssertNotNull();
			Assert.Equal("Type,Method,return,arg1,arg2,", recordNotNull.Invocation);
			Assert.Equal(1, recordNotNull.Appearance);
		}

		[Fact]
		public void Test2()
		{
			var contents = new[]
			{
				"Type,Method,return,arg1,arg2,",
				"Type,Method,return,arg1,arg2,"
			};
			var recordLoader = GetLoader(contents);

			var record = recordLoader.LoadAsync(new[] { "txt" }).Result
				?.Single();

			var recordNotNull = record.AssertNotNull();
			Assert.Equal("Type,Method,return,arg1,arg2,", recordNotNull.Invocation);
			Assert.Equal(2, recordNotNull.Appearance);
		}
		
		[Fact]
		public void Test3()
		{
			var contents = new[]
			{
				"Type,Method,return,arg1,arg2,",
				"Type,Method,return,argX,argY,"
			};
			var recordLoader = GetLoader(contents);

			var record = recordLoader.LoadAsync(new[] { "txt" }).Result;

			var recordNotNull = record.AssertNotNull();
			Assert.Equal(2, recordNotNull.Length);

			Assert.Equal("Type,Method,return,argX,argY,", recordNotNull[1].Invocation);
			Assert.Equal(1, recordNotNull[1].Appearance);
		}

#pragma warning restore CS1998 // 非同期メソッドは、'await' 演算子がないため、同期的に実行されます
	}
}

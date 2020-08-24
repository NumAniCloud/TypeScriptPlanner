
using System.Collections.Generic;

namespace TypeAggregator
{
	internal class Record
	{
		private readonly string[] splitted;

		public Record(string invocation, int appearance)
		{
			Appearance = appearance;
			splitted = invocation.Split(",");
		}

		public string Invocation => string.Join(",", splitted);
		public int Appearance { get; set; }
		public string Return
		{
			get => splitted[2];
			set => splitted[2] = value;
		}
		public string Method => $"{splitted[0]}.{splitted[1]}";

		public IReadOnlyList<string> Args => splitted.Length >= 4 ? splitted[3..] : new string[0];

		public void SetArg(int index, string str)
		{
			splitted[index + 3] = str;
		}
	}
}
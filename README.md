# TypeScriptPlanner
TypeScript向けのプラグイン。決まったフォーマットのcsvファイルを読み込ませることで、型情報を型定義に反映させます。
RPGツクールMZ のコアスクリプトの型定義を書くために作りました。

## 使い方

1. このリポジトリをクローンする。
2. プラグインを使いたいワークスペース内に`tsconfig.json`を用意する。
3. `tsconfig.json` の `compilerOptions/plugins` 内にプラグインの情報を追記する。

## tsconfig.json

このプラグインを使うだけしか設定のない `tsconfig.json` は以下のようになります。

```json
{
	"compilerOptions": {
		"plugins": [
			{
				"name": "path/to/TypeScriptPlanner",
				"statsFilePath": "path/to/stats.csv"
			}
		]
	}
}
```

ただし、 `stats.csv` というのはこのリポジトリに含まれている `TypeAnalyzer` プラグインが出力する統計データの入ったファイルです。`TypeAnalyzer` プラグインは、RPGツクールMZ向けのプラグインです。

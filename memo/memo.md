# 型解析フロー

## TypeAnalyzer

解析したいアプリ・ライブラリに挿し込んで、関数の呼ばれ方をダンプする。

必要なもの
- 対象となるクラス設定(javascript)
- 関数の除外設定(javascript)

### シリアライズ

急ぎでは無いが、動作を軽くするためにもシリアライズしてファイルに書き込みたい。

## typeinfo-aggregator

TypeAnalyzerのダンプを元に型定義情報を抽出する。

必要なもの
- TypeAnalyzerによるダンプ(csv)
- オブジェクト -> オブジェクト名のマップ(csv)
- オブジェクト名どうしの継承関係に関する情報(csv)

### 同じ関数に対する情報をマージ

同じ関数に対して複数の情報が来ることが期待される。

まず、同じクラス・同じ関数・同じ戻り値・同じ引数であるレコードはマージする。

次に、同じクラス・同じ関数・同じ戻り値・ひとつだけ異なる引数であるレコードはマージする。
この操作は複数回適用する。これによって最終的に引数違いのレコードが存在しなくなるはず。

最後に、同じクラス・同じ関数・異なる戻り値のレコードはマージする。

マージの際には、異なる型を直和型として合成する。

### オブジェクト名のマップ

オブジェクト名のマップファイルの情報をレコード内の戻り値や引数の型と比べる。

マップファイルは以下のようなデータが並ぶ構造。

```csv
オブジェクト名,(プロパティ名:型,)+
```

それから、`Array`を`Array<T>`に合流させるロジックも必要になる。

### オブジェクト名のマップファイルの生成

マップファイルのひな形となるファイルを生成する。

プロパティ名は辞書順に整列し、重複するオブジェクトが無いようにする。
このアプリが要求するマップファイルの仕様に従いつつ、オブジェクト名の部分は仮の名前を入れる。

### 継承関係の反映

先にオブジェクト名のマップを済ませる必要がある。

継承関係に関する情報のファイルを読み込み、レコードの列と比べる。

レコードの列の中には、同じ関数を指しているものがあるかもしれない。
そうしたら、継承関係の情報と見比べてマージする。

継承関係ファイルは以下のようなデータが並ぶ構造。

```csv
基底型名,(直和型の要素名,)+
```

ただし、対象の型をカバーするデータのうち、もっとも要素数の少ないものが選ばれる。
つまり以下のような継承関係ファイルがあれば、

```csv
Equipment,Weapon,Armor,
Entry,Item,Weapon,Armor,Skill,
Usable,Item,Skill,
AudioSettings,AudioSettings,PannableAudioSettings,
```

以下のようになる。

|レコード内の型|マージ後|
|-|-|
|Weapon,Armor|Equipment|
|Item,Skill|Usable|
|Item,Weapon|Entry|
|Weapon,Armor,Item|Entry|
|Weapon,Item,null|Entry,null|
|AudioSettings,PannableAudioSettings|AudioSettings|

マージする際、`null`,`undefined`の扱いに注意する。
これらはマージの前に取り除いておき、マージ完了後に付けなおすとよい。

## 最終的なデータ構造

計算したいデータ構造はこんな感じ:

```
FunctionSetting
└ ContainerName: string
└ Name: string
└ Return: string
└ Args: Argument
  └ Name: string
  └ Type: string
```

計算の為に求められるデータ構造はこんな感じ:

```
Record
└ Type: string
└ Method: string
└ Return: SignitureType
└ Args: Argument[]
  └ UnionItems: SignitureType

SimpleType extends SignitureType
└ Name: string

ObjectType extends SignitureType
└ Properties: Property
  └ Name: string
  └ Type: string
```

マップファイルから得られるデータは以下のように持つ:

```
ObjectNameMap
└ Entries: ObjectNameMapEntry[]
  └ Occurence: int
  └ Name: string
  └ Structure: ObjectType
```

継承関係ファイルから得られるデータは以下のように持つ:

```
InheritanceMap
└ Entries: InheritanceMapEntry[]
  └ BaseType: string
  └ DerivedTypes: string[]
```

## vscode拡張

現状は関数ごとにリファクタリングを呼び出す方式だが、以下の単位でも欲しい:

- 型または名前空間ごと
- ファイルごと
- 複数のファイル

なんなら、バッチで全部リファクタリングしたい。
その際、信用ならないリファクタリング情報をフィルターできる機能も欲しい。

# 型解析サーバー

究極的には、3つのプロセスが協調することでプログラマーの負担をもっと減らしたい。

3つのプロセス:
- TypeAnalyzer クライアント(javascript)
- typelog-aggregator サーバー(C#)
- vscode拡張 クライアント(typescript)

以下のような手順で機能する:

1. TypeAnalyzerが型情報を解析し、サーバーに送信する。
2. サーバーは情報を処理して保存し、vscode拡張に情報を提供する。
    - 初回起動の際にはdtsmakeを叩いて最初の型定義ファイルを生成する。
3. vscode拡張は入手した情報を元に、型定義ファイルを修正する。

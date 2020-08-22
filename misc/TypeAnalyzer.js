const fs = require("fs");

class TypeAnalyzer
{
    constructor(name)
    {
        this.name = name;
    }

    setup()
    {
        this.handle = fs.openSync("typelog/" + this.name + ".txt", "w+");
    }

    teardown()
    {
        fs.closeSync(this.handle);
    }

    analyze(subject, argments, ret)
    {
        function to_label(a)
        {
            if (a === null)
            {
                return "null";
            }
            else if(a === undefined)
            {
                return "undefined";
            }
            else if(a === NaN)
            {
                return "NaN";
            }
            else if(typeof a == "boolean")
            {
                return "boolean";
            }
            else if(typeof a == "string")
            {
                return "string";
            }
            else if(typeof a == "number")
            {
                return "number";
            }

            if (a)
            {
                if (a instanceof Array && a.length >= 1)
                {
                    return "Array<" + to_label(a[0]) + ">";
                }
                if (typeof a == "object")
                {
                    return a.__proto__.constructor.name;
                }
                else
                {
                    return typeof a;
                }
            }
            else
            {
                return "?";
            } 
        }

        let line = "";
        line += subject;
        line += ",";
        line += to_label(ret);
        line += ",";

        for (const arg of argments)
        {
            line += to_label(arg); 
            line += ",";
        }

        line += "\n";

        fs.write(this.handle, line, function (err)
        {
            if(err)
            {
                console.error(err);
            }
        });
    }

    insertLog(proto)
    {
        function isNestedClass(func)
        {
            var function_proto_keys = Object.keys(func.prototype);
            for (const field of function_proto_keys)
            {
                if (field != "constructor" && field != "__proto__")
                {
                    return true;
                }
            }
            return false;
        }

        let obj_table = {};

        // 元の関数を保持
        let keys = Object.keys(proto);
        for (const key of keys)
        {
            if (!(proto[key] instanceof Function)) { continue; }
            if (key == "constructor") { continue; }
            if (isNestedClass(proto[key])) { continue; }

            obj_table[key] = proto[key];
        }

        // 新しい関数で包む
        let keys2 = Object.keys(obj_table);
        for (const key of keys2)
        {
            let self = this;
            proto[key] = function (...args)
            {
                let ret = obj_table[key].apply(this, args);
                self.analyze(self.name + "," + key, args, ret);
                return ret;
            }
        }
    }
}

// コンストラクタに名前が無いオブジェクトはここで名前を付ける
Graphics.FPSCounter.prototype.analyzer_name = "Graphics.FPSCounter";
Tilemap.Layer.prototype.analyzer_name = "Tilemap.Layer";

// static でない各種オブジェクトにログを挿し込む
let target_scene_components =
[
    Scene_Base,
    Scene_Boot,
    Scene_Title,
    Scene_Message,
    Scene_Map,
    Scene_MenuBase,
    Scene_Menu,
    Scene_ItemBase,
    Scene_Item,
    Scene_Skill,
    Scene_Equip,
    Scene_Status,
    Scene_Options,
    Scene_File,
    Scene_Save,
    Scene_Load,
    Scene_GameEnd,
    Scene_Shop,
    Scene_Name,
    Scene_Debug,
    Scene_Battle,
    Scene_Gameover,
];

let target_object_components =
[
    Game_Temp,
    Game_System,
    Game_Timer,
    Game_Message,
    Game_Switches,
    Game_Variables,
    Game_SelfSwitches,
    Game_Screen,
    Game_Picture,
    Game_Item,
    Game_Action,
    Game_ActionResult,
    Game_BattlerBase,
    Game_Battler,
    Game_Actor,
    Game_Enemy,
    Game_Actors,
    Game_Unit,
    Game_Party,
    Game_Troop,
    Game_Map,
    Game_CommonEvent,
    Game_CharacterBase,
    Game_Character,
    Game_Player,
    Game_Follower,
    Game_Followers,
    Game_Vehicle,
    Game_Event,
    Game_Interpreter,
];

let target_sprites_components =
[
    Sprite_Actor,
    Sprite_Animation,
    Sprite_AnimationMV,
    Sprite_Balloon,
    Sprite_Battleback,
    Sprite_Battler,
    Sprite_Button,
    Sprite_Character,
    Sprite_Clickable,
    Sprite_Damage,
    Sprite_Destination,
    Sprite_Enemy,
    Sprite_Gauge,
    Sprite_Name,
    Sprite_Picture,
    Sprite_StateIcon,
    Sprite_StateOverlay,
    Sprite_Timer,
    Sprite_Weapon,
    Spriteset_Base,
    Spriteset_Battle,
    Spriteset_Map,
];

let target_window_components = 
[
    Window_ActorCommand,
    Window_Base,
    Window_BattleActor,
    Window_BattleEnemy,
    Window_BattleItem,
    Window_BattleLog,
    Window_BattleSkill,
    Window_BattleStatus,
    Window_ChoiceList,
    Window_Command,
    Window_DebugEdit,
    Window_DebugRange,
    Window_EquipCommand,
    Window_EquipItem,
    Window_EquipSlot,
    Window_EquipStatus,
    Window_EventItem,
    Window_GameEnd,
    Window_Gold,
    Window_Help,
    Window_HorzCommand,
    Window_ItemCategory,
    Window_ItemList,
    Window_MapName,
    Window_MenuActor,
    Window_MenuCommand,
    Window_MenuStatus,
    Window_Message,
    Window_NameBox,
    Window_NameEdit,
    Window_NameInput,
    Window_NumberInput,
    Window_Options,
    Window_PartyCommand,
    Window_SavefileList,
    Window_ScrollText,
    Window_Scrollable,
    Window_Selectable,
    Window_ShopBuy,
    Window_ShopCommand,
    Window_ShopNumber,
    Window_ShopSell,
    Window_ShopStatus,
    Window_SkillList,
    Window_SkillStatus,
    Window_SkillType,
    Window_Status,
    Window_StatusBase,
    Window_StatusEquip,
    Window_StatusParams,
    Window_TitleCommand,
];

let target_core_components =
[
    Bitmap,
    ColorFilter,
    Point,
    Rectangle,
    ScreenSprite,
    Sprite,
    Stage,
    Tilemap,
    TilingSprite,
    Weather,
    WebAudio,
    Window,
    WindowLayer,
    Graphics.FPSCounter,
    Tilemap.Layer,
];

let analyze_settings =
[
    target_core_components,
    target_scene_components,
    target_object_components,
    target_sprites_components,
    target_window_components,
].flat();

for (const element of analyze_settings)
{
    console.log(element.prototype);
    
    let name = element.prototype.constructor.name;
    if (name == "" && element.prototype.analyzer_name)
    {
        name = element.prototype.analyzer_name;
    }

    let analyzer = new TypeAnalyzer(name);
    analyzer.setup();
    analyzer.insertLog(element.prototype);
}

// staticなオブジェクトはここから先でログを挿し込む
let target_manager_components =
[
    AudioManager,
    BattleManager,
    ColorManager,
    ConfigManager,
    DataManager,
    EffectManager,
    FontManager,
    ImageManager,
    PluginManager,
    SceneManager,
    SoundManager,
    StorageManager,
    TextManager,
];

let target_core_static_components =
[
    Graphics,
    Input,
    JsonEx,
    TouchInput,
    Utils,
    Video,
];

let static_analyze_settings =
[
    target_core_static_components,
    target_manager_components,
].flat();

for (const element of static_analyze_settings)
{
    let analyzer = new TypeAnalyzer(element.name);
    analyzer.setup();
    analyzer.insertLog(element);
}
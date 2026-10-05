/**
 * Chinese Game 2.0 - Default Curriculum Question Banks
 * Tailored for Milo (intermediate primary) and Ollie (foundation primary).
 * Strictly preserves English names Milo and Ollie.
 */

window.DEFAULT_BANKS = {
  milo: {
    childName: "Milo",
    grade: "進階 (Milo)",
    levels: [
      {
        levelId: "milo_lvl_01",
        date: "2026-10-05",
        theme: "深海神殿探險",
        recognition: [
          {
            sentence: "勇敢的 Milo 駕駛探險船，在遼闊的大海上［  ］行。",
            answer: "航",
            options: ["航", "船", "行", "舟"],
            hint: "由「舟」和「亢」組成，指船在水上行走",
            socraticHint: "「航」的左邊是「舟」（小船），右邊是「亢」，合起來就是船在水面航行！"
          },
          {
            sentence: "他戴上水肺呼吸頭盔，敏捷地［  ］入幽暗的深海神殿。",
            answer: "潛",
            options: ["潛", "沉", "游", "浮"],
            hint: "三點水旁，指隱入水面下方",
            socraticHint: "「潛」字有三點水，意思是深入水底下，不要和浮在水面的「浮」搞混囉！"
          },
          {
            sentence: "傍晚的大海退［  ］了，沙灘上留下許多閃閃發光的小海星。",
            answer: "潮",
            options: ["潮", "水", "浪", "海"],
            hint: "海水受引力定時漲落的現象",
            socraticHint: "「潮」是由三點水和「朝」組成，早晨漲水叫潮，傍晚退去也與潮水有關。"
          },
          {
            sentence: "在古老神殿的最底層，藏著滿滿發光的綠［  ］石箱。",
            answer: "寶",
            options: ["寶", "玉", "石", "貝"],
            hint: "寶蓋頭，底下有玉與貝，代表珍貴的財富",
            socraticHint: "「寶」上面是寶蓋頭（屋子），裡面藏著玉和貝（古時貝殼是錢幣），合起來就是珍寶！"
          },
          {
            sentence: "木船輕輕地漂［  ］在水面上，隨著海風微微起伏。",
            answer: "浮",
            options: ["浮", "游", "沉", "洗"],
            hint: "浮在水面上，與「沉」相反",
            socraticHint: "「浮」是三點水旁加一個「孚」，指物體停留在水面之上不沉下去。"
          }
        ],
        handwriting: [
          {
            char: "航",
            pinyin: "háng",
            strokes: 10,
            radical: "舟字旁",
            words: ["航海", "航空", "引航", "導航"]
          },
          {
            char: "潛",
            pinyin: "qián",
            strokes: 15,
            radical: "水部 (氵)",
            words: ["潛水", "潛伏", "潛力", "深潛"]
          },
          {
            char: "潮",
            pinyin: "cháo",
            strokes: 15,
            radical: "水部 (氵)",
            words: ["潮水", "漲潮", "潮流", "風潮"]
          },
          {
            char: "寶",
            pinyin: "bǎo",
            strokes: 19,
            radical: "宀部 (寶蓋頭)",
            words: ["寶貝", "寶石", "寶藏", "國寶"]
          }
        ],
        story: {
          title: "Milo 的深海奇航記",
          content: "清晨陽光穿透薄霧，Milo 帶著心愛的地圖來到蔚藍的海灣。他駕駛著木船向深海神殿啟航，海面上浪花朵朵，兩隻調皮的海豚躍出水面為木船引路。潛入神殿中心後，Milo 找到了藏在海綿密室中的古老寶箱。當寶箱打開時，璀璨的綠寶石光芒照亮了整座水下宮殿。這真是一次令人難忘的深海奇航！",
          questions: [
            {
              question: "誰在船頭躍出水面為 Milo 引路？",
              answer: "兩隻調皮的海豚",
              options: ["兩隻調皮的海豚", "一條巨大的鯨魚", "一群發光水母"]
            },
            {
              question: "Milo 在神殿中心的哪裡發現了古老寶箱？",
              answer: "海綿密室中",
              options: ["海綿密室中", "珊瑚礁頂端", "沉船甲板上"]
            },
            {
              question: "打開寶箱後，什麼光芒照亮了水下宮殿？",
              answer: "璀璨的綠寶石光芒",
              options: ["璀璨的綠寶石光芒", "金黃色的陽光", "熊熊燃燒的火焰"]
            }
          ]
        }
      }
    ]
  },
  ollie: {
    childName: "Ollie",
    grade: "基礎 (Ollie)",
    levels: [
      {
        levelId: "ollie_lvl_01",
        date: "2026-10-05",
        theme: "陽光公園歡樂跑",
        recognition: [
          {
            sentence: "清晨陽光明媚，Ollie 和好朋友一起在公園步道上歡快地［  ］步。",
            answer: "跑",
            options: ["跑", "跳", "行", "走"],
            hint: "足字旁，指雙腳快速邁進",
            socraticHint: "「跑」的左邊是「足」（腳），右邊是「包」，表示用雙腳飛快奔馳！"
          },
          {
            sentence: "大家邁開大［  ］，迎著清涼的晨風向前衝刺。",
            answer: "步",
            options: ["步", "腳", "腿", "手"],
            hint: "腳步行走的步子",
            socraticHint: "「步」表示走路時腳掌前後邁出的距離，比如腳步、跑步。"
          },
          {
            sentence: "跑完步後，我們走進商店挑選了最愛的［  ］克力甜點。",
            answer: "巧",
            options: ["巧", "切", "卡", "功"],
            hint: "巧克力的「巧」",
            socraticHint: "「巧」字工整好記，左邊是「工」，右邊順勢折下，是巧克力專用的字喔！"
          },
          {
            sentence: "冰涼香甜的巧克力牛［  ］，喝下去讓人感到精神百倍！",
            answer: "奶",
            options: ["奶", "水", "茶", "湯"],
            hint: "牛奶的「奶」",
            socraticHint: "「奶」是女字旁，牛奶、奶奶都是這個字！"
          },
          {
            sentence: "運動流了很多汗，大家拿起水壺咕嘟咕嘟地［  ］了起來。",
            answer: "喝",
            options: ["喝", "吃", "吐", "嚼"],
            hint: "口字旁，把液體吞入腹中",
            socraticHint: "喝水要張開嘴巴，所以「喝」的左邊是一個「口」字旁！"
          }
        ],
        handwriting: [
          {
            char: "跑",
            pinyin: "pǎo",
            strokes: 12,
            radical: "足部",
            words: ["跑步", "快跑", "奔跑", "賽跑"]
          },
          {
            char: "步",
            pinyin: "bù",
            strokes: 7,
            radical: "止部",
            words: ["跑步", "腳步", "大步", "散步"]
          },
          {
            char: "巧",
            pinyin: "qiǎo",
            strokes: 5,
            radical: "工部",
            words: ["巧克力", "巧妙", "巧手", "乖巧"]
          },
          {
            char: "奶",
            pinyin: "nǎi",
            strokes: 5,
            radical: "女部",
            words: ["牛奶", "鮮奶", "奶奶", "羊奶"]
          }
        ],
        story: {
          title: "Ollie 的晨光運動日記",
          content: "今天是一個晴朗的好天氣，Ollie 一大早就換上了漂亮的運動鞋。他與好朋友們一起來到綠意盎然的大公園，大家排好隊伍，跟隨哨聲邁開大步向前奔跑。微風在耳邊吹過，大家笑得好開心。跑步結束後，Ollie 喝了一大杯冰涼甜美的巧克力奶，整個人充滿了活力。運動真是一件無比快樂的事情！",
          questions: [
            {
              question: "今天的天氣是怎樣的？",
              answer: "晴朗的好天氣",
              options: ["晴朗的好天氣", "傾盆大雨", "漫天大雪"]
            },
            {
              question: "Ollie 和好朋友在哪裡邁開大步奔跑？",
              answer: "綠意盎然的大公園",
              options: ["綠意盎然的大公園", "熱鬧的超級市場", "幽暗的地下室"]
            },
            {
              question: "跑步結束後，Ollie 喝了什麼美味的飲品？",
              answer: "冰涼甜美的巧克力奶",
              options: ["冰涼甜美的巧克力奶", "熱騰騰的濃湯", "微苦的黑咖啡"]
            }
          ]
        }
      }
    ]
  }
};

// Hand-authored Kwento ng Pera stories with branching choices.

export type KwentoNode = {
  id: string;
  text: string;
  choices?: { id: string; label: string; next: string; lesson?: string }[];
  ending?: string; // displayed at end
};

export type KwentoStory = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  startNodeId: string;
  nodes: Record<string, KwentoNode>;
};

export const KWENTO_STORIES: KwentoStory[] = [
  {
    id: "rosa-bonus",
    title: "Si Aling Rosa at ang ₱10,000 Bonus",
    subtitle: "Tindera. May 2 anak. May utang pa sa cooperative.",
    emoji: "🎁",
    startNodeId: "start",
    nodes: {
      start: {
        id: "start",
        text: "Nakatanggap si Aling Rosa ng ₱10,000 bonus mula sa cooperative. Ano ang gagawin niya?",
        choices: [
          { id: "a", label: "Bilhin ang gusto ng anak na cellphone", next: "spend", lesson: "Magaan sa puso pero hindi sustainable." },
          { id: "b", label: "Bayaran agad ang utang", next: "debt", lesson: "Smart move — magbabawas sa interest." },
          { id: "c", label: "Hatiin: 50% utang, 30% ipon, 20% pamilya", next: "split", lesson: "Klasikong 50-30-20 — balanced." },
        ],
      },
      spend: {
        id: "spend",
        text: "Tuwang-tuwa ang anak. Pero pagkatapos ng 2 buwan, lumaki pa ang interest sa utang at walang naipon. Lesson: ang gastos na walang plano ay nagbabalik bilang stress.",
        ending: "💭 Susunod, subukan ang ibang landas.",
      },
      debt: {
        id: "debt",
        text: "Nabayaran ni Aling Rosa ang ₱8,000 utang. Sobra ₱2,000 ang ginamit niya pang-pamilya. Pakiramdam niya, magaan na ang dibdib. Lesson: utang ang unang pinapatay — interest ang kalaban.",
        ending: "✅ Mahusay! Dagdag ipon next month.",
      },
      split: {
        id: "split",
        text: "₱5,000 sa utang, ₱3,000 sa emergency fund, ₱2,000 sa pamilya. After 6 months, may pondo si Aling Rosa nang biglang nagkasakit ang anak. Lesson: ang balanseng plano ang nagliligtas sa krisis.",
        ending: "🌟 Goal: gawing ugali ang paghati ng pera.",
      },
    },
  },
  {
    id: "junjun-allowance",
    title: "Si Junjun at ang Allowance",
    subtitle: "Estudyante. ₱500/week allowance. Ayaw makuripot.",
    emoji: "🎒",
    startNodeId: "start",
    nodes: {
      start: {
        id: "start",
        text: "May ₱500 si Junjun kada linggo para sa pamasahe at pagkain. Gusto niyang mag-ipon para sa bagong sapatos (₱2,500). Anong stratehiya?",
        choices: [
          { id: "a", label: "Mag-ipon ng ₱100/week", next: "slow", lesson: "Sustainable pero tagal." },
          { id: "b", label: "Skip lunch tuwing Biyernes", next: "skip", lesson: "Risky — pwedeng makasama sa katawan." },
          { id: "c", label: "Magtinda ng snacks sa school", next: "hustle", lesson: "Creative income generation." },
        ],
      },
      slow: {
        id: "slow",
        text: "Pagkatapos ng 25 linggo (~6 buwan), nakaipon si Junjun ng ₱2,500. Bumili ng sapatos at may ₱200 pa sobra. Lesson: ang patience ay isang form ng financial muscle.",
        ending: "✅ Slow and steady wins.",
      },
      skip: {
        id: "skip",
        text: "Nagkasakit si Junjun pagkatapos ng 1 buwan ng skip lunch. Mas malaki pang gastos sa gamot kaysa sa naipon. Lesson: huwag isakripisyo ang basic needs para sa wants.",
        ending: "⚠️ Health > savings.",
      },
      hustle: {
        id: "hustle",
        text: "Nagtinda si Junjun ng yema at kakanin sa school. Kumita ng ₱300/week extra. Sa 9 linggo, kompleto na ang sapatos AT may extra income stream. Lesson: pag-aralan din kung paano DAGDAGAN ang pera, hindi lang bawasan.",
        ending: "🚀 Income > expenses thinking.",
      },
    },
  },
  {
    id: "kuya-ofw",
    title: "Si Kuya Boy, OFW Dad",
    subtitle: "Construction sa Saudi. May padala kada buwan. Walang naipon sa 5 taon.",
    emoji: "✈️",
    startNodeId: "start",
    nodes: {
      start: {
        id: "start",
        text: "Si Kuya Boy ay 5 taon nang OFW. Padala ₱30,000/buwan, pero walang naipon. Susuko na ba siya, o babaguhin ang sistema?",
        choices: [
          { id: "a", label: "Direktang sabihin sa pamilya: ₱20K lang ngayon, ₱10K ipon", next: "boundary", lesson: "Boundaries = pag-ibig din." },
          { id: "b", label: "Tahimik na mag-open ng sariling savings sa Pilipinas", next: "secret", lesson: "Pwede pero hindi sustainable." },
          { id: "c", label: "Tumigil mag-padala for 1 month", next: "stop", lesson: "Drastic — pwedeng masira ang relasyon." },
        ],
      },
      boundary: {
        id: "boundary",
        text: "Initial galit ang asawa. Pero pagkalipas ng 1 taon, may ₱120K na ipon si Kuya Boy. Pamilya — natutunan ding mag-budget. Lesson: ang totoong love ay may financial honesty.",
        ending: "💚 Communication is wealth.",
      },
      secret: {
        id: "secret",
        text: "May ₱60K nakaipon si Kuya Boy after 6 months. Pero nadiscover ng asawa, may tampuhan, at ginastos pa rin sa fiesta. Lesson: pera at pamilya — magkasama dapat sa usap.",
        ending: "💭 Transparency > hiding.",
      },
      stop: {
        id: "stop",
        text: "Naghirap ang pamilya ng 1 buwan. Galit silang lahat. Bumalik si Kuya Boy sa dating sistema. Walang nabago. Lesson: drastic moves rarely fix systemic problems — usapan ang sagot.",
        ending: "⚠️ Talk first, act second.",
      },
    },
  },
];

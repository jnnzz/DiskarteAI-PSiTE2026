import { uid, type Mission } from "./storage";

export function defaultMissions(): Mission[] {
  return [
    {
      id: uid(),
      title: "Mag-log ng 3 araw na gastos",
      description: "I-track mo ang gastos mo sa tatlong magkakasunod na araw.",
      xpReward: 30,
      type: "daily",
      completed: false,
    },
    {
      id: uid(),
      title: "Mag-ipon ng ₱100 ngayong linggo",
      description: "Idagdag sa kahit anong savings goal.",
      xpReward: 50,
      type: "weekly",
      completed: false,
    },
    {
      id: uid(),
      title: "Tapusin ang isang Kwento ng Pera",
      description: "Magbasa at pumili ng landas sa kahit isang istorya.",
      xpReward: 20,
      type: "weekly",
      completed: false,
    },
    {
      id: uid(),
      title: "Mag-scan ng resibo",
      description: "Subukan ang Gastos Analyzer — i-scan ang isang resibo.",
      xpReward: 25,
      type: "daily",
      completed: false,
    },
    {
      id: uid(),
      title: "Magtanong kay Gabay",
      description: "Magtanong tungkol sa pera o ipon kay Gabay AI.",
      xpReward: 15,
      type: "daily",
      completed: false,
    },
    {
      id: uid(),
      title: "Mag-set ng savings goal",
      description: "Maglagay ng pangarap — tuition, gadget, o emergency fund.",
      xpReward: 20,
      type: "weekly",
      completed: false,
    },
  ];
}

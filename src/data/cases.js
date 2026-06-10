const DIGITAL_PROPERTIES = [
  "Nachrichten bleiben gespeichert.",
  "Nachrichten, Bilder oder Links können schnell weitergeleitet werden.",
  "Viele können mitlesen.",
  "Man verliert schnell die Kontrolle darüber, wer eine Information sieht.",
  "Mimik, Tonfall und Situation fehlen oft.",
  "Nachrichten können jederzeit kommen und Druck erzeugen."
];

function createInternetCompassQuestions() {
  return [
    {
      id: "q1",
      type: "message-select",
      label: "Welche Stelle im Chat ist der Knackpunkt?",
      helper: "Klickt die Nachricht an, bei der die Situation problematisch wird. Ihr könnt höchstens zwei Nachrichten auswählen.",
      maxSelections: 2
    },
    {
      id: "q2",
      type: "property-select",
      label: "Welche Eigenschaft digitaler Kommunikation spielt hier eine Rolle?",
      helper: "Wählt höchstens zwei Eigenschaften aus.",
      maxSelections: 2,
      options: DIGITAL_PROPERTIES
    },
    {
      id: "q3",
      type: "text",
      label: "Welche Folgen kann das haben?",
      helper: "Überlegt, was für einzelne Personen oder für die Klasse passieren kann.",
      placeholder: "Das kann dazu führen, dass ..."
    },
    {
      id: "q4",
      type: "text",
      label: "Was sollten die beteiligten Personen jetzt tun?",
      helper: "Formuliert eine verantwortungsvolle Reaktion.",
      placeholder: "Verantwortungsvoll wäre jetzt ..."
    }
  ];
}


export const CASES = {
  "1": {
    groupName: "Gruppe 1",
    title: "Stimmt das wirklich?",
    focus: "Informationen prüfen, bevor man sie weiterleitet",
    chatImage: "/chatbilder/gruppe-1.png",
    studentChat: [
      { sender: "Luca", time: "15:21", text: "Leute, morgen werden angeblich alle Handys eingesammelt!" },
      { sender: "Mia", time: "15:22", text: "Was? Woher weißt du das?" },
      { sender: "Luca", time: "15:22", text: "Ben hat das gesagt. Der hat so einen Artikel gesehen." },
      { sender: "Sina", time: "15:23", text: "Welcher Ben? Ich kenne keinen Ben aus unserer Klasse." },
      { sender: "Jonas", time: "15:23", text: "Ich bring dann morgen ein altes Zweithandy zum Abgeben 😂" },
      { sender: "Mia", time: "15:24", text: "Auf der Schulhomepage steht aber nichts." },
      { sender: "Luca", time: "15:24", text: "Keine Ahnung, ich wollte euch nur warnen." }
    ],
    overviewChat: [
      { sender: "Luca", time: "15:21", text: "Leute, morgen werden angeblich alle Handys eingesammelt!" },
      { sender: "Mia", time: "15:22", text: "Was? Woher weißt du das?" },
      { sender: "Luca", time: "15:22", text: "Ben hat das gesagt. Der hat so einen Artikel gesehen." },
      { sender: "Mia", time: "15:24", text: "Auf der Schulhomepage steht aber nichts." }
    ],
    fallbackChat: [
      { sender: "Luca", time: "15:21", text: "Leute, morgen werden angeblich alle Handys eingesammelt!" },
      { sender: "Mia", time: "15:22", text: "Was? Woher weißt du das?" },
      { sender: "Luca", time: "15:22", text: "Ben hat das gesagt. Der hat so einen Artikel gesehen." },
      { sender: "Sina", time: "15:23", text: "Welcher Ben? Ich kenne keinen Ben aus unserer Klasse." },
      { sender: "Jonas", time: "15:23", text: "Ich bring dann morgen ein altes Zweithandy zum Abgeben 😂" },
      { sender: "Mia", time: "15:24", text: "Auf der Schulhomepage steht aber nichts." },
      { sender: "Luca", time: "15:24", text: "Keine Ahnung, ich wollte euch nur warnen." }
    ],
    questions: createInternetCompassQuestions()
  },

  "2": {
    groupName: "Gruppe 2",
    title: "Warum antwortet niemand?",
    focus: "Rücksichtsvoll schreiben und keinen Antwortdruck erzeugen",
    chatImage: "/chatbilder/gruppe-2.png",
    studentChat: [
      { sender: "Emir", time: "18:03", text: "Kann jemand schnell die Mathe-Hausaufgabe schicken?" },
      { sender: "Emir", time: "18:04", text: "Hallo???" },
      { sender: "Emir", time: "18:05", text: "Warum antwortet niemand?" },
      { sender: "Lea", time: "18:06", text: "Ich esse gerade." },
      { sender: "Emir", time: "18:06", text: "Dauert 10 Sekunden. Schick einfach." },
      { sender: "Noah", time: "18:07", text: "Ich bekomme die ganze Zeit Benachrichtigungen 😑" },
      { sender: "Emir", time: "18:08", text: "Dann stellt halt lautlos. Ich brauche es jetzt." }
    ],
    overviewChat: [
      { sender: "Emir", time: "18:03", text: "Kann jemand schnell die Mathe-Hausaufgabe schicken?" },
      { sender: "Emir", time: "18:04", text: "Hallo???" },
      { sender: "Lea", time: "18:06", text: "Ich esse gerade." },
      { sender: "Emir", time: "18:06", text: "Dauert 10 Sekunden. Schick einfach." }
    ],
    fallbackChat: [
      { sender: "Emir", time: "18:03", text: "Kann jemand schnell die Mathe-Hausaufgabe schicken?" },
      { sender: "Emir", time: "18:04", text: "Hallo???" },
      { sender: "Emir", time: "18:05", text: "Warum antwortet niemand?" },
      { sender: "Lea", time: "18:06", text: "Ich esse gerade." },
      { sender: "Emir", time: "18:06", text: "Dauert 10 Sekunden. Schick einfach." },
      { sender: "Noah", time: "18:07", text: "Ich bekomme die ganze Zeit Benachrichtigungen 😑" },
      { sender: "Emir", time: "18:08", text: "Dann stellt halt lautlos. Ich brauche es jetzt." }
    ],
    questions: createInternetCompassQuestions()
  },

  "3": {
    groupName: "Gruppe 3",
    title: "War das ironisch gemeint?",
    focus: "Bei unklaren Nachrichten nachfragen, bevor man urteilt",
    chatImage: "/chatbilder/gruppe-3.png",
    studentChat: [
      { sender: "Paula", time: "16:12", text: "Ich schicke gleich meine Folie für die Gruppenarbeit." },
      { sender: "Max", time: "16:13", text: "Na endlich, unsere Rettung 🙄" },
      { sender: "Paula", time: "16:14", text: "Okay, wenn du es so schlimm findest, mach ich halt gar nichts mehr." },
      { sender: "Max", time: "16:14", text: "Hä? Das war nicht böse gemeint." },
      { sender: "Leni", time: "16:15", text: "Klang aber schon fies." },
      { sender: "Max", time: "16:15", text: "Ich meinte nur, dass du die Folien immer gut machst." },
      { sender: "Paula", time: "16:16", text: "Dann schreib das doch normal ..." }
    ],
    overviewChat: [
      { sender: "Paula", time: "16:12", text: "Ich schicke gleich meine Folie für die Gruppenarbeit." },
      { sender: "Max", time: "16:13", text: "Na endlich, unsere Rettung 🙄" },
      { sender: "Paula", time: "16:14", text: "Okay, wenn du es so schlimm findest, mach ich halt gar nichts mehr." },
      { sender: "Max", time: "16:14", text: "Hä? Das war nicht böse gemeint." }
    ],
    fallbackChat: [
      { sender: "Paula", time: "16:12", text: "Ich schicke gleich meine Folie für die Gruppenarbeit." },
      { sender: "Max", time: "16:13", text: "Na endlich, unsere Rettung 🙄" },
      { sender: "Paula", time: "16:14", text: "Okay, wenn du es so schlimm findest, mach ich halt gar nichts mehr." },
      { sender: "Max", time: "16:14", text: "Hä? Das war nicht böse gemeint." },
      { sender: "Leni", time: "16:15", text: "Klang aber schon fies." },
      { sender: "Max", time: "16:15", text: "Ich meinte nur, dass du die Folien immer gut machst." },
      { sender: "Paula", time: "16:16", text: "Dann schreib das doch normal ..." }
    ],
    questions: createInternetCompassQuestions()
  },

  "4": {
    groupName: "Gruppe 4",
    title: "War doch nur Spaß",
    focus: "Nicht mitmachen, Betroffene unterstützen, stoppen oder Hilfe holen",
    chatImage: "/chatbilder/gruppe-4.png",
    studentChat: [
      { sender: "Ben", time: "19:31", text: "Habt ihr gesehen, wie sich Felix heute beim Sport hingelegt hat? 😂" },
      { sender: "Ben", time: "19:32", text: "Ich hab ein Bild davon gemacht." },
      { sender: "Ben", time: "19:32", text: "Bild wurde gesendet." },
      { sender: "Timo", time: "19:33", text: "Haha der Gesichtsausdruck 😂" },
      { sender: "Felix", time: "19:34", text: "Lösch das bitte. Ist nicht lustig." },
      { sender: "Ben", time: "19:35", text: "Entspann dich, war doch nur Spaß." },
      { sender: "Sara", time: "19:36", text: "Felix hat gesagt, er will das nicht. Dann lösch es doch." }
    ],
    overviewChat: [
      { sender: "Ben", time: "19:31", text: "Habt ihr gesehen, wie sich Felix heute beim Sport hingelegt hat? 😂" },
      { sender: "Ben", time: "19:32", text: "Ich hab ein Bild davon gemacht." },
      { sender: "Ben", time: "19:32", text: "Bild wurde gesendet." },
      { sender: "Felix", time: "19:34", text: "Lösch das bitte. Ist nicht lustig." },
      { sender: "Sara", time: "19:36", text: "Felix hat gesagt, er will das nicht. Dann lösch es doch." }
    ],
    fallbackChat: [
      { sender: "Ben", time: "19:31", text: "Habt ihr gesehen, wie sich Felix heute beim Sport hingelegt hat? 😂" },
      { sender: "Ben", time: "19:32", text: "Ich hab ein Bild davon gemacht." },
      { sender: "Ben", time: "19:32", text: "Bild wurde gesendet." },
      { sender: "Timo", time: "19:33", text: "Haha der Gesichtsausdruck 😂" },
      { sender: "Felix", time: "19:34", text: "Lösch das bitte. Ist nicht lustig." },
      { sender: "Ben", time: "19:35", text: "Entspann dich, war doch nur Spaß." },
      { sender: "Sara", time: "19:36", text: "Felix hat gesagt, er will das nicht. Dann lösch es doch." }
    ],
    questions: createInternetCompassQuestions()
  }
};

export function getCaseById(id) {
  return CASES[id] ?? null;
}

export function getAllCaseIds() {
  return Object.keys(CASES);
}

const DIGITAL_PROPERTIES = [
  "Nachrichten bleiben gespeichert",
  "Nachrichten können unkontrolliert weitergeleitet werden",
  "Viele können mitlesen",
  "Nachrichten können Druck zu Antworten auslösen",
  "Nachrichten sind zeitversetzt lesbar",
  "Ausdruckskanäle wie Mimik und Gestik fehlen"
];

const RULE_CHECKLIST = [
  "Unsere Regel ist allgemein formuliert und nicht nur eine Wiederholung der Handlung aus Frage 4.",
  "Unsere Regel nennt ein konkretes verantwortungsvolles Verhalten.",
  "Unsere Regel berücksichtigt die Folgen digitaler Kommunikation.",
  "Unsere Regel ist verständlich und kurz genug für eine Klassenregel.",
  "Unsere Regel sorgt dafür, dass negative Folgen verhindert oder zumindest weniger schlimm werden."
];

function createInternetCompassQuestions(actionName) {
  return [
    {
      id: "q1",
      type: "message-select",
      label: "Welche Nachrichten sind am problematischsten?",
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
      label: `Erklärt, was ${actionName} in diesem Fall anders hätte machen sollen.`,
      labelParts: {
        beforeName: "Erklärt, was ",
        name: actionName,
        afterName: " in diesem Fall anders hätte machen sollen."
      },
      helper: "Beschreibt die konkrete verantwortungsvolle Handlung in genau diesem Fall. Die allgemeine Regel kommt erst danach.",
      placeholder: `${actionName} hätte ...`
    },
    {
      id: "q5",
      type: "rule-sentence",
      label: "Welche Klassenchat-Regel entsteht aus eurem Fall?",
      helper: "Formuliert eine kurze Regel und eine kurze Begründung.",
      rulePlaceholder: "wir ...",
      reasonPlaceholder: "...",
      maxLength: 90
    },
    {
      id: "q6",
      type: "checklist",
      label: "Überprüft eure Regel mit der Checkliste",
      helper: "Kreuzt an, welche Punkte eure Regel schon erfüllt. Wenn etwas fehlt, geht zurück und verbessert Frage 5.",
      options: RULE_CHECKLIST
    }
  ];
}


export const CASES = {
  "1": {
    groupName: "Gruppe 1",
    title: "War das ironisch gemeint?",
    focus: "Bei unklaren Nachrichten nachfragen, bevor man urteilt",
    chatImage: "/chatbilder/gruppe-1.png",
    studentChat: [
      { sender: "Nina", time: "15:34", text: "Ich hab die Bilder jetzt in die Präsentation eingefügt." },
      { sender: "Max", time: "15:35", text: "Nice, danke." },
      { sender: "Jonas", time: "15:36", text: "Endlich bewegt sich hier mal was 😅" },
      { sender: "Ben", time: "15:37", text: "Soll das heißen, wir anderen machen nichts?" },
      { sender: "Nina", time: "15:38", text: "Ich war mir auch kurz nicht sicher, wie du das meinst." },
      { sender: "Jonas", time: "15:39", text: "Nein, so war das nicht gemeint." },
      { sender: "Max", time: "15:40", text: "Kam halt bisschen wie ein Vorwurf rüber." },
      { sender: "Sara", time: "15:41", text: "Warte, vielleicht meinte Jonas es anders." }
    ],

    overviewChat: [
      { sender: "Nina", time: "15:34", text: "Ich hab die Bilder jetzt in die Präsentation eingefügt." },
      { sender: "Max", time: "15:35", text: "Nice, danke." },
      { sender: "Jonas", time: "15:36", text: "Endlich bewegt sich hier mal was 😅" },
      { sender: "Ben", time: "15:37", text: "Soll das heißen, wir anderen machen nichts?" },
      { sender: "Nina", time: "15:38", text: "Ich war mir auch kurz nicht sicher, wie du das meinst." },
      { sender: "Jonas", time: "15:39", text: "Nein, so war das nicht gemeint." }
    ],

    fallbackChat: [
      { sender: "Nina", time: "15:34", text: "Ich hab die Bilder jetzt in die Präsentation eingefügt." },
      { sender: "Max", time: "15:35", text: "Nice, danke." },
      { sender: "Jonas", time: "15:36", text: "Endlich bewegt sich hier mal was 😅" },
      { sender: "Ben", time: "15:37", text: "Soll das heißen, wir anderen machen nichts?" },
      { sender: "Nina", time: "15:38", text: "Ich war mir auch kurz nicht sicher, wie du das meinst." },
      { sender: "Jonas", time: "15:39", text: "Nein, so war das nicht gemeint." },
      { sender: "Max", time: "15:40", text: "Kam halt bisschen wie ein Vorwurf rüber." },
      { sender: "Sara", time: "15:41", text: "Warte, vielleicht meinte Jonas es anders." }
    ],
    questions: createInternetCompassQuestions("Jonas")
  },

  "2": {
    groupName: "Gruppe 2",
    title: "Stimmt das wirklich?",
    focus: "Informationen prüfen, bevor man sie weiterleitet",
    chatImage: "/chatbilder/gruppe-2.png",
    studentChat: [
      { sender: "Luca", time: "16:18", text: "Leute, ab morgen werden bei uns angeblich alle Handys morgens eingesammelt 😳" },
      { sender: "Mia", time: "16:19", text: "Was? Woher weißt du das?" },
      { sender: "Luca", time: "16:20", text: "Hab gerade einen Artikel gesehen: „Handyverbot an Schulen – was sich bald ändern könnte“." },
      { sender: "Ben", time: "16:21", text: "Aber steht da wirklich, dass das morgen bei uns passiert?" },
      { sender: "Luca", time: "16:22", text: "Keine Ahnung, hab nur die Überschrift gelesen. Klingt aber schon so." },
      { sender: "Nico", time: "16:23", text: "Ich schick’s mal in die Fußballgruppe, dann wissen es wenigstens alle." },
      { sender: "Sara", time: "16:24", text: "Auf der Schulhomepage steht gar nichts dazu." },
      { sender: "Mia", time: "16:25", text: "Dann ist das vielleicht noch gar nicht sicher." }
    ],

    overviewChat: [
      { sender: "Luca", time: "16:18", text: "Leute, ab morgen werden bei uns angeblich alle Handys morgens eingesammelt 😳" },
      { sender: "Luca", time: "16:20", text: "Hab gerade einen Artikel gesehen: „Handyverbot an Schulen – was sich bald ändern könnte“." },
      { sender: "Ben", time: "16:21", text: "Aber steht da wirklich, dass das morgen bei uns passiert?" },
      { sender: "Luca", time: "16:22", text: "Keine Ahnung, hab nur die Überschrift gelesen. Klingt aber schon so." },
      { sender: "Nico", time: "16:23", text: "Ich schick’s mal in die Fußballgruppe, dann wissen es wenigstens alle." },
      { sender: "Sara", time: "16:24", text: "Auf der Schulhomepage steht gar nichts dazu." }
    ],

    fallbackChat: [
      { sender: "Luca", time: "16:18", text: "Leute, ab morgen werden bei uns angeblich alle Handys morgens eingesammelt 😳" },
      { sender: "Mia", time: "16:19", text: "Was? Woher weißt du das?" },
      { sender: "Luca", time: "16:20", text: "Hab gerade einen Artikel gesehen: „Handyverbot an Schulen – was sich bald ändern könnte“." },
      { sender: "Ben", time: "16:21", text: "Aber steht da wirklich, dass das morgen bei uns passiert?" },
      { sender: "Luca", time: "16:22", text: "Keine Ahnung, hab nur die Überschrift gelesen. Klingt aber schon so." },
      { sender: "Nico", time: "16:23", text: "Ich schick’s mal in die Fußballgruppe, dann wissen es wenigstens alle." },
      { sender: "Sara", time: "16:24", text: "Auf der Schulhomepage steht gar nichts dazu." },
      { sender: "Mia", time: "16:25", text: "Dann ist das vielleicht noch gar nicht sicher." }
    ],
    questions: createInternetCompassQuestions("Luca")
  },

  "3": {
    groupName: "Gruppe 3",
    title: "Warum antwortet niemand?",
    focus: "Rücksichtsvoll schreiben und keinen Antwortdruck erzeugen",
    chatImage: "/chatbilder/gruppe-3.png",
    studentChat: [
      { sender: "Emir", time: "13:42", text: "Lea, kannst du bitte noch die Bilder für unser Plakat schicken?" },
      { sender: "Lea", time: "13:43", text: "Mach ich später, bin gerade beim Essen." },
      { sender: "Nico", time: "13:46", text: "Lea?" },
      { sender: "Nico", time: "13:48", text: "Wir brauchen die Bilder halt heute noch." },
      { sender: "Tom", time: "13:49", text: "@Lea bitte antworte mal." },
      { sender: "Nico", time: "13:51", text: "Du bist doch online." },
      { sender: "Nico", time: "13:52", text: "Warum liest du es und antwortest nicht?" },
      { sender: "Mia", time: "13:53", text: "Sie hat doch geschrieben, dass sie später antwortet." }
    ],

    overviewChat: [
      { sender: "Emir", time: "13:42", text: "Lea, kannst du bitte noch die Bilder für unser Plakat schicken?" },
      { sender: "Lea", time: "13:43", text: "Mach ich später, bin gerade beim Essen." },
      { sender: "Nico", time: "13:48", text: "Wir brauchen die Bilder halt heute noch." },
      { sender: "Tom", time: "13:49", text: "@Lea bitte antworte mal." },
      { sender: "Nico", time: "13:51", text: "Du bist doch online." },
      { sender: "Nico", time: "13:52", text: "Warum liest du es und antwortest nicht?" },
      { sender: "Mia", time: "13:53", text: "Sie hat doch geschrieben, dass sie später antwortet." }
    ],

    fallbackChat: [
      { sender: "Emir", time: "13:42", text: "Lea, kannst du bitte noch die Bilder für unser Plakat schicken?" },
      { sender: "Lea", time: "13:43", text: "Mach ich später, bin gerade beim Essen." },
      { sender: "Nico", time: "13:46", text: "Lea?" },
      { sender: "Nico", time: "13:48", text: "Wir brauchen die Bilder halt heute noch." },
      { sender: "Tom", time: "13:49", text: "@Lea bitte antworte mal." },
      { sender: "Nico", time: "13:51", text: "Du bist doch online." },
      { sender: "Nico", time: "13:52", text: "Warum liest du es und antwortest nicht?" },
      { sender: "Mia", time: "13:53", text: "Sie hat doch geschrieben, dass sie später antwortet." }
    ],
    questions: createInternetCompassQuestions("Nico")
  },

  "4": {
    groupName: "Gruppe 4",
    title: "War doch nur Spaß",
    focus: "Nicht mitmachen, Betroffene unterstützen, stoppen oder Hilfe holen",
    chatImage: "/chatbilder/gruppe-4.png",
    studentChat: [
      { sender: "Luca", time: "15:47", text: "Sport heute war zu lustig 😂" },
      { sender: "Nico", time: "15:48", text: "Vor allem Tims Schuss komplett am Tor vorbei." },
      { sender: "Ben", time: "15:48", text: "Tim einfach Kreisliga-Legende 😂" },
      { sender: "Luca", time: "15:49", text: "Morgen bitte wieder so, war Highlight des Tages." },
      { sender: "Tim", time: "15:50", text: "Könnt ihr aufhören? War mir eh schon peinlich." },
      { sender: "Nico", time: "15:51", text: "Bro, war doch nur Spaß." },
      { sender: "Ben", time: "15:52", text: "Chill, ist doch nur unser Klassenchat." },
      { sender: "Tim", time: "15:53", text: "Ja, aber ich bin jetzt zuhause und bekomme trotzdem noch Nachrichten dazu." },
      { sender: "Mia", time: "15:54", text: "Leute, Tim meint das ernst." }
    ],

    overviewChat: [
      { sender: "Nico", time: "15:48", text: "Vor allem Tims Schuss komplett am Tor vorbei." },
      { sender: "Ben", time: "15:48", text: "Tim einfach Kreisliga-Legende 😂" },
      { sender: "Tim", time: "15:50", text: "Könnt ihr aufhören? War mir eh schon peinlich." },
      { sender: "Nico", time: "15:51", text: "Bro, war doch nur Spaß." },
      { sender: "Ben", time: "15:52", text: "Chill, ist doch nur unser Klassenchat." },
      { sender: "Tim", time: "15:53", text: "Ja, aber ich bin jetzt zuhause und bekomme trotzdem noch Nachrichten dazu." },
      { sender: "Mia", time: "15:54", text: "Leute, Tim meint das ernst." }
    ],

    fallbackChat: [
      { sender: "Luca", time: "15:47", text: "Sport heute war zu lustig 😂" },
      { sender: "Nico", time: "15:48", text: "Vor allem Tims Schuss komplett am Tor vorbei." },
      { sender: "Ben", time: "15:48", text: "Tim einfach Kreisliga-Legende 😂" },
      { sender: "Luca", time: "15:49", text: "Morgen bitte wieder so, war Highlight des Tages." },
      { sender: "Tim", time: "15:50", text: "Könnt ihr aufhören? War mir eh schon peinlich." },
      { sender: "Nico", time: "15:51", text: "Bro, war doch nur Spaß." },
      { sender: "Ben", time: "15:52", text: "Chill, ist doch nur unser Klassenchat." },
      { sender: "Tim", time: "15:53", text: "Ja, aber ich bin jetzt zuhause und bekomme trotzdem noch Nachrichten dazu." },
      { sender: "Mia", time: "15:54", text: "Leute, Tim meint das ernst." }
    ],
    questions: createInternetCompassQuestions("die Klasse")
  }
};

export function getCaseById(id) {
  return CASES[id] ?? null;
}

export function getAllCaseIds() {
  return Object.keys(CASES);
}

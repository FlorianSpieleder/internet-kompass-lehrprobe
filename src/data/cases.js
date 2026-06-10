export const CASES = {
  "1": {
    groupName: "Gruppe 1",
    title: "Stimmt das wirklich?",
    focus: "Informationen prüfen, bevor man sie weiterleitet",
    chatImage: "/chatbilder/gruppe-1.png",
    fallbackChat: [
      { sender: "Luca", time: "15:21", text: "Leute, morgen werden angeblich alle Handys eingesammelt!" },
      { sender: "Mia", time: "15:22", text: "Was? Woher weißt du das?" },
      { sender: "Luca", time: "15:22", text: "Ben hat das gesagt. Der hat so einen Artikel gesehen." },
      { sender: "Sina", time: "15:23", text: "Welcher Ben? Ich kenne keinen Ben aus unserer Klasse." },
      { sender: "Jonas", time: "15:23", text: "Ich bring dann morgen ein altes Zweithandy zum Abgeben 😂" },
      { sender: "Mia", time: "15:24", text: "Auf der Schulhomepage steht aber nichts." },
      { sender: "Luca", time: "15:24", text: "Keine Ahnung, ich wollte euch nur warnen." }
    ],
    questions: [
      {
        id: "q1",
        label: "1. Was passiert im Chat?",
        helper: "Beschreibt kurz die Situation.",
        placeholder: "Zum Beispiel: Luca schreibt, dass ..."
      },
      {
        id: "q2",
        label: "2. Welche Handlung ist problematisch?",
        helper: "Wählt nicht einfach eine Person aus, sondern beschreibt die konkrete Handlung.",
        placeholder: "Problematisch ist, dass ..."
      },
      {
        id: "q3",
        label: "3. Welche Eigenschaft digitaler Kommunikation spielt hier eine Rolle?",
        helper: "Denkt an die Vorstunde: z. B. schnelles Weiterleiten, großer Empfängerkreis, Speicherung, fehlender Kontext ...",
        placeholder: "Eine wichtige Eigenschaft ist ..."
      },
      {
        id: "q4",
        label: "4. Welche Folgen kann das haben?",
        helper: "Überlegt für einzelne Personen und für die ganze Klasse.",
        placeholder: "Das kann dazu führen, dass ..."
      },
      {
        id: "q5",
        label: "5. Wie sollten die beteiligten Personen jetzt verantwortungsvoll reagieren?",
        helper: "Was sollte man jetzt tun, um die Situation zu klären oder Schaden zu vermeiden?",
        placeholder: "Verantwortungsvoll wäre jetzt ..."
      },
      {
        id: "q6",
        label: "6. Welche Stichwörter sind für eure spätere Vorstellung besonders wichtig?",
        helper: "Notiert 3–5 Stichwörter. Keine ganze Präsentation schreiben.",
        placeholder: "z. B. prüfen, Quelle, weiterleiten ..."
      }
    ]
  },

  "2": {
    groupName: "Gruppe 2",
    title: "Warum antwortet niemand?",
    focus: "Rücksichtsvoll schreiben und keinen Antwortdruck erzeugen",
    chatImage: "/chatbilder/gruppe-2.png",
    fallbackChat: [
      { sender: "Emir", time: "18:03", text: "Kann jemand schnell die Mathe-Hausaufgabe schicken?" },
      { sender: "Emir", time: "18:04", text: "Hallo???" },
      { sender: "Emir", time: "18:05", text: "Warum antwortet niemand?" },
      { sender: "Lea", time: "18:06", text: "Ich esse gerade." },
      { sender: "Emir", time: "18:06", text: "Dauert 10 Sekunden. Schick einfach." },
      { sender: "Noah", time: "18:07", text: "Ich bekomme die ganze Zeit Benachrichtigungen 😑" },
      { sender: "Emir", time: "18:08", text: "Dann stellt halt lautlos. Ich brauche es jetzt." }
    ],
    questions: [
      {
        id: "q1",
        label: "1. Was passiert im Chat?",
        helper: "Beschreibt kurz die Situation.",
        placeholder: "Zum Beispiel: Emir ..."
      },
      {
        id: "q2",
        label: "2. Welche Handlung ist problematisch?",
        helper: "Achtet darauf, was im digitalen Chat anders wirkt als in einem einzelnen Gespräch.",
        placeholder: "Problematisch ist, dass ..."
      },
      {
        id: "q3",
        label: "3. Welche Eigenschaft digitaler Kommunikation spielt hier eine Rolle?",
        helper: "Denkt an Dauerverfügbarkeit, Push-Nachrichten, Gruppendruck, Empfängerkreis ...",
        placeholder: "Eine wichtige Eigenschaft ist ..."
      },
      {
        id: "q4",
        label: "4. Welche Folgen kann das haben?",
        helper: "Überlegt für die angeschriebenen Personen und für die Stimmung im Klassenchat.",
        placeholder: "Das kann dazu führen, dass ..."
      },
      {
        id: "q5",
        label: "5. Wie sollten die beteiligten Personen jetzt verantwortungsvoll reagieren?",
        helper: "Was wäre eine faire und rücksichtsvolle Reaktion?",
        placeholder: "Verantwortungsvoll wäre jetzt ..."
      },
      {
        id: "q6",
        label: "6. Welche Stichwörter sind für eure spätere Vorstellung besonders wichtig?",
        helper: "Notiert 3–5 Stichwörter. Keine ganze Präsentation schreiben.",
        placeholder: "z. B. Antwortdruck, Benachrichtigungen ..."
      }
    ]
  },

  "3": {
    groupName: "Gruppe 3",
    title: "War das ironisch gemeint?",
    focus: "Bei unklaren Nachrichten nachfragen, bevor man urteilt",
    chatImage: "/chatbilder/gruppe-3.png",
    fallbackChat: [
      { sender: "Paula", time: "16:12", text: "Ich schicke gleich meine Folie für die Gruppenarbeit." },
      { sender: "Max", time: "16:13", text: "Na endlich, unsere Rettung 🙄" },
      { sender: "Paula", time: "16:14", text: "Okay, wenn du es so schlimm findest, mach ich halt gar nichts mehr." },
      { sender: "Max", time: "16:14", text: "Hä? Das war nicht böse gemeint." },
      { sender: "Leni", time: "16:15", text: "Klang aber schon fies." },
      { sender: "Max", time: "16:15", text: "Ich meinte nur, dass du die Folien immer gut machst." },
      { sender: "Paula", time: "16:16", text: "Dann schreib das doch normal ..." }
    ],
    questions: [
      {
        id: "q1",
        label: "1. Was passiert im Chat?",
        helper: "Beschreibt kurz die Situation.",
        placeholder: "Zum Beispiel: Max schreibt ..."
      },
      {
        id: "q2",
        label: "2. Welche Handlung ist problematisch?",
        helper: "Überlegt, warum die Nachricht anders verstanden werden konnte.",
        placeholder: "Problematisch ist, dass ..."
      },
      {
        id: "q3",
        label: "3. Welche Eigenschaft digitaler Kommunikation spielt hier eine Rolle?",
        helper: "Denkt an fehlende Mimik, fehlenden Tonfall, Ironie, Mehrdeutigkeit, Kontext ...",
        placeholder: "Eine wichtige Eigenschaft ist ..."
      },
      {
        id: "q4",
        label: "4. Welche Folgen kann das haben?",
        helper: "Überlegt, wie sich Missverständnisse in einem Chat entwickeln können.",
        placeholder: "Das kann dazu führen, dass ..."
      },
      {
        id: "q5",
        label: "5. Wie sollten die beteiligten Personen jetzt verantwortungsvoll reagieren?",
        helper: "Was könnten Max, Paula oder die anderen schreiben?",
        placeholder: "Verantwortungsvoll wäre jetzt ..."
      },
      {
        id: "q6",
        label: "6. Welche Stichwörter sind für eure spätere Vorstellung besonders wichtig?",
        helper: "Notiert 3–5 Stichwörter. Keine ganze Präsentation schreiben.",
        placeholder: "z. B. Ironie, Tonfall, nachfragen ..."
      }
    ]
  },

  "4": {
    groupName: "Gruppe 4",
    title: "War doch nur Spaß",
    focus: "Nicht mitmachen, Betroffene unterstützen, stoppen oder Hilfe holen",
    chatImage: "/chatbilder/gruppe-4.png",
    fallbackChat: [
      { sender: "Ben", time: "19:31", text: "Habt ihr gesehen, wie sich Felix heute beim Sport hingelegt hat? 😂" },
      { sender: "Ben", time: "19:32", text: "Ich hab ein Bild davon gemacht." },
      { sender: "Ben", time: "19:32", text: "Bild wurde gesendet." },
      { sender: "Timo", time: "19:33", text: "Haha der Gesichtsausdruck 😂" },
      { sender: "Felix", time: "19:34", text: "Lösch das bitte. Ist nicht lustig." },
      { sender: "Ben", time: "19:35", text: "Entspann dich, war doch nur Spaß." },
      { sender: "Sara", time: "19:36", text: "Felix hat gesagt, er will das nicht. Dann lösch es doch." }
    ],
    questions: [
      {
        id: "q1",
        label: "1. Was passiert im Chat?",
        helper: "Beschreibt kurz die Situation.",
        placeholder: "Zum Beispiel: Ben ..."
      },
      {
        id: "q2",
        label: "2. Welche Handlung ist problematisch?",
        helper: "Beschreibt die konkrete Handlung im Chat.",
        placeholder: "Problematisch ist, dass ..."
      },
      {
        id: "q3",
        label: "3. Welche Eigenschaft digitaler Kommunikation spielt hier eine Rolle?",
        helper: "Denkt an Öffentlichkeit in der Gruppe, Speicherung, Weiterleitung, Zuschauerrolle ...",
        placeholder: "Eine wichtige Eigenschaft ist ..."
      },
      {
        id: "q4",
        label: "4. Welche Folgen kann das haben?",
        helper: "Überlegt auch, was nach der Schule oder zuhause passieren kann.",
        placeholder: "Das kann dazu führen, dass ..."
      },
      {
        id: "q5",
        label: "5. Wie sollten die beteiligten Personen jetzt verantwortungsvoll reagieren?",
        helper: "Was sollten Ben, die Mitlesenden und Felix jetzt tun?",
        placeholder: "Verantwortungsvoll wäre jetzt ..."
      },
      {
        id: "q6",
        label: "6. Welche Stichwörter sind für eure spätere Vorstellung besonders wichtig?",
        helper: "Notiert 3–5 Stichwörter. Keine ganze Präsentation schreiben.",
        placeholder: "z. B. Bild, löschen, unterstützen ..."
      }
    ]
  }
};

export function getCaseById(id) {
  return CASES[id] ?? null;
}

export function getAllCaseIds() {
  return Object.keys(CASES);
}

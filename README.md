# Internet-Kompass – Netlify-Version

React/Vite-Projekt mit Schülerversion, Lehrerversion und minimaler Synchronisation über Netlify Functions + Netlify Blobs.

## Seiten

Nach dem Deployment:

- Lehrerseite: `https://DEIN-PROJEKT.netlify.app/?gruppe=0`
- Gruppe 1: `https://DEIN-PROJEKT.netlify.app/?gruppe=1`
- Gruppe 2: `https://DEIN-PROJEKT.netlify.app/?gruppe=2`
- Gruppe 3: `https://DEIN-PROJEKT.netlify.app/?gruppe=3`
- Gruppe 4: `https://DEIN-PROJEKT.netlify.app/?gruppe=4`

## Bedienlogik

1. Schülerinnen und Schüler bearbeiten ihre Fragen.
2. Die Eingaben werden weiterhin lokal im Browser gespeichert.
3. Erst der Button **Antworten speichern** sendet die Antworten an Netlify.
4. Die Lehrerseite lädt neue Antworten per Button **Antworten aktualisieren**.
5. Es gibt keine Live-Synchronisation, keine Accounts und kein Polling.

## Lokal testen

Für die Netlify-Funktionen nicht nur `vite` starten, sondern:

```bash
npm install
npm run dev
```

Dann öffnet Netlify Dev normalerweise:

```text
http://localhost:8888/?gruppe=0
```

Die Schülerseiten lokal:

```text
http://localhost:8888/?gruppe=1
http://localhost:8888/?gruppe=2
http://localhost:8888/?gruppe=3
http://localhost:8888/?gruppe=4
```

## Deployment

Empfohlen:

```bash
npm install
npm run build
npx netlify deploy --prod
```

Oder GitHub-Repository mit Netlify verbinden:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

## Wichtiger Hinweis zu Netlify Drop

Ein reiner Drag-and-drop-Upload des `dist`-Ordners reicht für diese Version nicht aus, weil die Synchronisation Netlify Functions benötigt. Für diese Version also Netlify CLI oder GitHub-Deployment nutzen.

## Chatbilder einfügen

Lege die Chatbilder in diesen Ordner:

`public/chatbilder/`

Benennung:

- `gruppe-1.png`
- `gruppe-2.png`
- `gruppe-3.png`
- `gruppe-4.png`

Falls ein Bild fehlt, zeigt das Tool automatisch eine Textversion des Chats an.

## Robustheitsprinzip

Jede Gruppe wird in Netlify Blobs unter einem eigenen Schlüssel gespeichert:

- `group-1`
- `group-2`
- `group-3`
- `group-4`

Dadurch überschreiben sich Gruppen nicht gegenseitig, selbst wenn mehrere Gruppen fast gleichzeitig speichern.


## Notfall-Import

Zusätzlich zur automatischen Synchronisation gibt es einen manuellen Import:

1. Auf der Schülerseite auf **Antwortcode anzeigen** oder **Antwortcode kopieren** klicken.
2. Code zur Lehrkraft bringen, z. B. per Copy/Paste.
3. Auf der Lehrerseite auf **Import** klicken.
4. Code einfügen und **Code importieren** klicken.

Der manuelle Import funktioniert auch dann, wenn `/api/save` oder `/api/answers` blockiert ist. Die importierte Antwort wird lokal im Browser der Lehrerseite gespeichert und in der Lernkarten-/Tabellenansicht angezeigt.

Beim Button **Stunde zurücksetzen** werden auch die lokalen manuellen Importe der Lehrerseite gelöscht.

# Football Coach

App locale per allenatori, costruita con Expo SDK 57, React Native e TypeScript. Android 8+ è piattaforma primaria; codice resta compatibile iOS. Nessun backend o account Expo richiesto.

## Requisiti

- Node.js 24 LTS
- JDK 21 o successivo (`JAVA_HOME` configurato; build verificata anche con JDK 26)
- Android SDK 36, platform-tools e un emulatore/dispositivo con debug USB

## Sviluppo da VS Code

```sh
npm install
npm run start
npm run android
```

Fast Refresh funziona tramite Metro. Stessi comandi disponibili in **Terminale → Esegui attività**. Configurazione debugger Hermes presente in `.vscode/launch.json`.

## Controlli e APK locale

```sh
npm run lint
npm test
npm run export
npm run apk
npm run apk:install
```

`npm run apk` genera progetto Android via Expo CNG e produce `android/app/build/outputs/apk/debug/app-debug.apk`. `apk:install` usa `adb install -r`, mantenendo dati locali durante aggiornamento.

## Release locale

Conservare keystore fuori dal repository, configurarne percorso e password tramite proprietà Gradle locali/variabili d'ambiente, poi eseguire:

```sh
cd android
./gradlew assembleRelease
```

Mai committare file `.jks`, `.keystore`, password o `android/gradle.properties` con segreti.

## Dati

Stato persistito solo sul dispositivo in AsyncStorage, chiave `coachboard:v1`. Assenza o corruzione archivio carica dati demo. Undo/redo vive solo per sessione; snapshot e dati applicativi persistono.

Mockup HTML “Pratico” originale: `demo/`.

# Libretto

Web app (PWA) per **proiettare la media ponderata universitaria**, aggiornarla dopo ogni esame e **archiviare gli esami accettati**. Funziona offline, si installa sulla schermata Home dell'iPhone e tiene i dati solo sul dispositivo (niente server, niente account).

Pensata per il sistema italiano: voti in trentesimi, CFU, idoneità escluse dalla media, voto base di laurea in centodecimi.

## Funzioni

- **Media ponderata in tempo reale** — `Σ(voto × CFU) / Σ(CFU)`, con il 30 e lode contato come 30.
- **Quanto mi serve** — imposti la media obiettivo e vedi il voto medio necessario sui CFU che restano, con indicatore di fattibilità.
- **Cosa ottengo** — ipotizzi la media futura e vedi dove chiudi (media finale e voto base /110).
- **Archivio esami** — esami divisi tra *archiviati* (accettati, con voto) e *da sostenere*; idoneità a parte.
- **Aggiungi / modifica / elimina** qualsiasi esame; registra un voto e l'esame passa in archivio.
- **Esporta / importa** i dati in JSON per backup o trasferimento.
- **Offline** via service worker; installabile come app.

## Provarla in locale

Serve un piccolo server statico (il service worker non parte da `file://`):

```bash
cd libretto
python3 -m http.server 8000
# apri http://localhost:8000
```

## Pubblicarla su GitHub Pages

1. Crea un repository e carica il contenuto di questa cartella nella radice.
2. *Settings → Pages → Branch: `main` / root → Save*.
3. Apri l'URL `https://musbhk.github.io/Libretto-Universitario/`. I percorsi sono relativi, quindi funziona anche nel sottopercorso del repo.

## Installare su iPhone

Apri l'URL in **Safari → Condividi → Aggiungi a Home**. L'app parte a tutto schermo e funziona offline.

## Test

```bash
node tests/calc.test.js
```

Verifica i calcoli puri (media, CFU, voto richiesto, proiezione) sul piano di esempio.

## Personalizzare il piano

Il piano e i voti d'esempio sono in cima a `app.js` (`PLAN` e `SEED_GRADES`). Da *Info → Ricarica piani* puoi caricare il piano **vuoto** (utile prima di condividere l'app) o azzerare tutto.

## Struttura

```
index.html              interfaccia e tab
styles.css              stile (chiaro/scuro, safe-area iOS)
app.js                  logica pura + interfaccia
manifest.webmanifest    metadati PWA
sw.js                   service worker (offline)
icons/                  icone app
tests/calc.test.js      test dei calcoli
```

## Stack

HTML, CSS e JavaScript senza dipendenze né build. La logica di calcolo è separata dall'interfaccia ed esportata per i test in Node.

## Nota

I dati restano in `localStorage` sul dispositivo. Il voto base di laurea (`media/30 × 110`) è una stima: l'ateneo aggiunge i punti di tesi e di carriera secondo il proprio regolamento.

## Licenza

MIT.

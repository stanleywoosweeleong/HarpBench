# Harp Bench

A playable harmonica that runs in the browser and installs as an app that works offline.

- **Diatonic (10-hole, Richter tuning)** and **chromatic (12-hole, solo tuning with slide)**, switchable.
- **All 12 keys**, with positions (1st straight harp, 2nd cross harp, 3rd slant harp and more) and scale highlighting: blues, pentatonic, major, Mixolydian, Dorian, minor.
- **Real harp technique:** draw bends on holes 1–6, blow bends on 8–10 (only as deep as a real harp allows), optional overblows (1, 4, 5, 6) and overdraws (7, 9, 10), chromatic slide.
- **Mouth widths:** single hole, 2–4 hole chords, and tongue-block octave split.
- **Chords:** pads for every chord in the harp's key plus a builder for any chord. Chords that fit one breath play as a block, others are rolled.
- **Expression:** throat vibrato, hand-cup wah, breath strength, tone and room reverb.
- **Metronome:** 30–260 BPM, tap tempo, 2/3/4/6 beats, quarters, eighths or blues shuffle.
- **Hymn songbook:** 20 public-domain hymns tabbed for whichever harp and key you choose. **Listen** plays the melody and lights each hole; **Practice** waits for you to play each note before moving on. Notes show as harp tab plus letter names or numbers (1 2 3), with the first verse under the notes.
- **Phone mode:** turn a phone sideways and the whole screen becomes the harmonica. Top half blows, bottom half draws, drag away from the comb to bend. An optional thumb pad mode lets you hold the left pad to draw so you can play without looking. In Settings, the hymn controls come first: Listen, Play along, Practice, song options, speed, verse and the microphone. During Play along the top bar keeps a running tally and the harp's edge flashes green, amber or red as each note is graded; with the microphone on, the top bar becomes a tuner.

## Playing

| Action | Touch / mouse | Keyboard |
| --- | --- | --- |
| Blow | Upper half of a hole | Number keys `1`–`0` (holes 1–10), `-` `=` for chromatic holes 11–12 |
| Draw | Lower half of a hole | The letter under each number: `Q`–`P`, then `[` `]` |
| Bend | Drag away from the harp | Hold `Z` / `X` / `C` (½, 1, 1½ steps) |
| Overblow / slide | Outer chip, or slide button | Hold `Shift` |
| Vibrato | Vibrato button | Hold `Space` |
| Wah | Cup hands button | Hold `M` |
| Chords | Hold a chord pad | `A`–`;` |
| Metronome | Start button | `B` |
| Change key | Key strip | `←` / `→` |

Prefer the older letters-only layout (`Q`–`P` blow, `A`–`;` draw, `1`–`0` chords)? Switch it under **Keyboard → Layout**.

## Songbook

Amazing Grace · Holy, Holy, Holy · Be Thou My Vision · Great Is Thy Faithfulness · What a Friend We Have in Jesus · Blessed Assurance · It Is Well with My Soul · Rock of Ages · Nearer, My God, to Thee · Joyful, Joyful, We Adore Thee · Doxology · Come, Thou Fount of Every Blessing · Jesus Loves Me · Crown Him with Many Crowns · When I Survey the Wondrous Cross · O for a Thousand Tongues to Sing · Abide with Me · Praise to the Lord, the Almighty · Silent Night · The Old Rugged Cross

The songbook follows **Play in**. Choosing a hymn switches Play in to the easiest position for it on your harp (1st, 2nd, 3rd or 12th) and highlights its major scale. If the hymn needs an overblown note there (Blessed Assurance needs one, `5o`), Overblows are switched on for you, and switched off again for the next hymn that does not need them, unless you turned them on yourself. Pick another position with the buttons above the score, or with Play in, and the tab is rewritten for it. The app also picks the octave that needs the fewest bends. Each song is tagged Easy (no bends), Some bends, or Advanced, with the position that tag applies to.

Melodies and first-verse lyrics are public domain and were transcribed from the [Open Hymnal Project](http://openhymnal.org) ABC files (melody line only). The data lives in `songs.js`.

### Listen, Play along, Practice

- **Listen** plays the melody on the harmonica with the alto, tenor and bass parts from the hymnal underneath, and lights each hole as it sounds.
- **Play along** keeps time while you play: each note is marked on time, early or late, or missed, and you get a score at the end. Your best score for each hymn is saved.
- **Practice** waits for each note, so you can learn the holes before worrying about rhythm.

Listen and Play along run on the audio clock, so the melody, the metronome, the count-in bar and the harmony stay locked together. The metronome follows the hymn: its tempo (times the speed setting), its beats per bar (6/8 and 9/8 are counted in dotted beats), and its pickup notes, so beat 1 lands on the first full bar. **Loop this line** repeats the line that holds the selected note; tap a note in the score to choose where to start. **Guide melody** plays the tune quietly while you play along. Every verse is included.

### Microphone

Press **Use microphone** and play your real harmonica. The tuner shows the note, how many cents sharp or flat it is (handy for checking bends), and which hole it is on the selected harp. While the microphone is on, **Practice** and **Play along** listen to your harmonica instead of waiting for taps. Use headphones when Listen or the harmony is playing, or the microphone hears the app. The microphone works in the installed app and on the GitHub Pages address; some embedded views do not allow it.

### Your own songs

**Add your own song** takes a tune in [ABC notation](https://abcnotation.com/learn), pasted or opened from a `.abc` file. Lyrics on `w:` lines become the verses and any extra voices become the backing harmony. Imported songs are tabbed like the hymns and saved in your browser; **Remove from songbook** deletes one. The importer (`js/abc.js`) is a port of `tools/abcparse.py`, and the tests check that both produce identical songs.

### My harp: your own harmonica as the voice

Under **Microphone → My harp**, **Record my harp** walks you through every blow and draw note of the selected harp, one at a time; hold each note for about two seconds and it is saved automatically. The **My harp** voice then plays your recordings, pitch-shifted for bends, with vibrato, wah and room applied. Notes you have not recorded use the Sweet sound. Recordings stay in this browser (IndexedDB) and can be deleted.

The built-in voices are synthesized. Bends on them now darken and hollow out the tone as they deepen, the way a real bend does, as well as dropping the pitch.

## Install and play offline

The app is plain static files with a service worker, so any static host works. With GitHub Pages:

1. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The included workflow (`.github/workflows/pages.yml`) publishes the site to
   `https://stanleywoosweeleong.github.io/HarpBench/`.
3. Open that address once while online. When the page shows **Ready offline**, everything is cached.
4. Install it:
   - **iPhone / iPad:** there is no automatic install prompt on iOS. Open the page in **Safari** itself (a page opened from inside another app, such as a link tapped in a chat app, runs in that app's built-in browser and cannot be installed), tap **Share** (on recent iOS versions it may be in the **•••** menu), then **Add to Home Screen**. The page shows these steps on an iPhone.
   - **Android / desktop Chrome or Edge:** the **Install app** button in the header, or the install icon in the address bar.

On iPhone, turn off the silent switch if you hear nothing.

## Updating

When you change any file, bump `VERSION` in `sw.js`. Installed copies show an **Update** prompt the next time they are opened online.

## Run locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Service workers need `http://localhost` or HTTPS, not a `file://` URL.

## Files

- `index.html`: page markup
- `styles.css`: styles, with light and dark themes
- `songs.js`: the hymn library
- `js/core.js`: music data, harp layouts and the sound engine (Web Audio)
- `js/theory.js`: logic with no page access (reeds, chord voicings, hymn tabbing), covered by the tests
- `js/harp.js`: the on-screen harmonica, keyboard, chords and controls
- `js/pocket.js`: phone mode
- `js/metronome.js`, `js/songbook.js`: metronome and songbook
- `js/abc.js`: ABC notation importer
- `js/pitch.js`, `js/mic.js`: microphone pitch detection and tuner
- `js/sampler.js`: My harp recorder and the voice that plays your recordings
- `js/transport.js`: Listen and Play along on the audio clock (metronome, count-in, harmony, grading)
- `js/main.js`: start-up
- `tools/build_songs.py`, `tools/abcparse.py`, `tools/openhymnal/`: rebuild `songs.js` from the Open Hymnal sources
- `pwa.js`, `sw.js`, `manifest.webmanifest`, `icons/`: install and offline support
- `fonts/`: self-hosted Big Shoulders Display, IBM Plex Sans and IBM Plex Mono (SIL Open Font License 1.1)
- `tests/`: Node tests (`npm test`)
- `tools/build_artifact.py`: builds a single self-contained HTML file from the repo (`npm run build:artifact`)

The scripts are classic (non-module) scripts that share one global scope, loaded in the order listed in `index.html`, so the app runs without a build step.

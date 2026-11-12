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
- **Phone mode:** turn a phone sideways and the whole screen becomes the harmonica. Top half blows, bottom half draws, drag away from the comb to bend. An optional thumb pad mode lets you hold the left pad to draw so you can play without looking.

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

The songbook follows **Play in**. Choosing a hymn switches Play in to the easiest position for it on your harp (1st, 2nd, 3rd or 12th) and highlights its major scale. Pick another position with the buttons above the score, or with Play in, and the tab is rewritten for it. The app also picks the octave that needs the fewest bends. Each song is tagged Easy (no bends), Some bends, or Advanced, with the position that tag applies to.

Melodies and first-verse lyrics are public domain and were transcribed from the [Open Hymnal Project](http://openhymnal.org) ABC files (melody line only). The data lives in `songs.js`.

## Install and play offline

The app is plain static files with a service worker, so any static host works. With GitHub Pages:

1. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The included workflow (`.github/workflows/pages.yml`) publishes the site to
   `https://stanleywoosweeleong.github.io/HarpBench/`.
3. Open that address once while online. When the page shows **Ready offline**, everything is cached.
4. Install it:
   - **iPhone / iPad (Safari):** Share → **Add to Home Screen**.
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
- `songs.js`: the hymn library (melody, rhythm and verse 1 for each song)
- `styles.css`: styles, with light and dark themes
- `app.js`: the instrument: tuning layouts, sound engine (Web Audio), touch and keyboard input, chords, metronome, phone mode
- `pwa.js`: service worker registration, install button, update prompt
- `sw.js`: offline cache
- `manifest.webmanifest`, `icons/`: app install metadata and icons
- `fonts/`: self-hosted Big Shoulders Display, IBM Plex Sans and IBM Plex Mono (SIL Open Font License 1.1)

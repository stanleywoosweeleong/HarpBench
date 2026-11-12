#!/usr/bin/env python3
"""Build songs.js from the Open Hymnal Project ABC files in tools/openhymnal/.

Each song gets:
  notes  - melody: [semitones from the tonic (null = rest), length in quarter notes, verse-1 syllable, flags]
           flags: "b" = last note of a bar, "l" = last note of a printed line
  verses - syllables for every verse, one list per verse, aligned to the melody notes
  parts  - the other hymnal voices (alto, tenor, bass) as [semitones from the tonic, length] lists,
           used as backing harmony; empty when a voice does not line up with the melody

Usage: python3 tools/build_songs.py   (writes songs.js in the repo root)
"""
import glob
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from abcparse import parse, voices  # noqa: E402

# id, file prefix, title, words, music, tempo (quarter notes per minute)
SONGS = [
    ('amazing', 'Amazing_Grace', 'Amazing Grace', 'John Newton, 1779', '“New Britain”, American folk melody, 1831', 96),
    ('holy', 'Holy_Holy_Holy', 'Holy, Holy, Holy', 'Reginald Heber, 1826', '“Nicaea”, John B. Dykes, 1861', 100),
    ('vision', 'Be_Thou_My_Vision', 'Be Thou My Vision', 'Irish, 8th century; tr. Mary E. Byrne & Eleanor H. Hull', '“Slane”, Irish folk melody', 110),
    ('faithful', 'Great_Is_Thy', 'Great Is Thy Faithfulness', 'Thomas O. Chisholm, 1923', 'William M. Runyan, 1923', 100),
    ('friend', 'What_A_Friend', 'What a Friend We Have in Jesus', 'Joseph M. Scriven, 1855', 'Charles C. Converse, 1868', 100),
    ('assurance', 'Blessed_Assurance', 'Blessed Assurance', 'Fanny Crosby, 1873', 'Phoebe P. Knapp, 1873', 150),
    ('well', 'It_Is_Well', 'It Is Well with My Soul', 'Horatio G. Spafford, 1873', '“Ville du Havre”, Philip P. Bliss, 1876', 96),
    ('rock', 'Rock_of_Ages', 'Rock of Ages', 'Augustus M. Toplady, 1776', '“Toplady”, Thomas Hastings, 1830', 150),
    ('nearer', 'Nearer_My_God', 'Nearer, My God, to Thee', 'Sarah F. Adams, 1841', '“Bethany”, Lowell Mason, 1856', 150),
    ('joyful', 'Joyful_Joyful', 'Joyful, Joyful, We Adore Thee', 'Henry van Dyke, 1907', '“Hymn to Joy”, Ludwig van Beethoven, 1824', 112),
    ('doxology', 'Praise_God_From', 'Doxology (Praise God, from Whom All Blessings Flow)', 'Thomas Ken, 1674', '“Old Hundredth”, Louis Bourgeois, 1551', 100),
    ('fount', 'Come_Thou_Fount', 'Come, Thou Fount of Every Blessing', 'Robert Robinson, 1758', '“Nettleton”, John Wyeth, 1813', 96),
    ('jesusloves', 'Jesus_Loves_Me', 'Jesus Loves Me', 'Anna B. Warner, 1860', 'William B. Bradbury, 1862', 108),
    ('crown', 'Crown_Him', 'Crown Him with Many Crowns', 'Matthew Bridges, 1851', '“Diademata”, George J. Elvey, 1868', 104),
    ('survey', 'When_I_Survey', 'When I Survey the Wondrous Cross', 'Isaac Watts, 1707', '“Hamburg”, Lowell Mason, 1824', 100),
    ('tongues', 'O_For_A_Thousand', 'O for a Thousand Tongues to Sing', 'Charles Wesley, 1739', '“Azmon”, Carl G. Gläser; arr. Lowell Mason, 1839', 180),
    ('abide', 'Abide_With_Me', 'Abide with Me', 'Henry F. Lyte, 1847', '“Eventide”, William H. Monk, 1861', 84),
    ('praise', 'Praise_To_The_Lord', 'Praise to the Lord, the Almighty', 'Joachim Neander, 1680; tr. Catherine Winkworth, 1863', '“Lobe den Herren”, Stralsund Gesangbuch, 1665', 132),
    ('silent', 'Silent_Night', 'Silent Night', 'Joseph Mohr, 1818; tr. John F. Young, 1859', '“Stille Nacht”, Franz X. Gruber, 1818', 90),
    ('rugged', 'The_Old_Rugged', 'The Old Rugged Cross', 'George Bennard, 1913', 'George Bennard, 1913', 132),
]


def clean(syl):
    import re
    syl = re.sub(r'\$\d\w?\$\d\s*', '', syl or '')
    return re.sub(r'\$\d', '', syl).strip()


def build_song(sid, prefix, title, words, music, bpm):
    path = glob.glob(str(HERE / 'openhymnal' / (prefix + '*.abc')))[0]
    abc = open(path, encoding='latin-1').read()
    vids = voices(abc)
    mel = parse(abc, vids[0] if vids else None)
    notes = mel['notes']
    while notes and notes[0]['midi'] is None:
        notes.pop(0)
    pitched = [n['midi'] for n in notes if n['midi'] is not None]
    tonic = pitched[-1] % 12            # hymns end on their home note
    ref = 60 + tonic
    while sum(pitched) / len(pitched) - ref > 7:
        ref += 12
    while sum(pitched) / len(pitched) - ref < -5:
        ref -= 12
    total = sum(n['d'] for n in notes)

    out, nverses = [], 0
    for n in notes:
        flags = ('b' if n.get('bar') else '') + ('l' if n.get('line') else '')
        out.append([None if n['midi'] is None else n['midi'] - ref, round(float(n['d']), 4), clean(n.get('syl')), flags])
        if n.get('vs'):
            nverses = max(nverses, max(n['vs']) + 1)
    verses = [[clean((n.get('vs') or {}).get(v, '')) if n['midi'] is not None else '' for n in notes]
              for v in range(nverses)]
    verses = [v for v in verses if any(v)]

    parts = []
    for vid in vids[1:]:
        p = parse(abc, vid)['notes']
        if abs(sum(n['d'] for n in p) - total) > 1e-6:
            print(f'  {sid}: voice {vid} does not line up with the melody, left out', file=sys.stderr)
            continue
        parts.append([[None if n['midi'] is None else n['midi'] - ref, round(float(n['d']), 4)] for n in p])

    first = ' '.join(x[2] for x in out if x[2]).replace('- ', '')[:60]
    return {'id': sid, 'title': title, 'words': words, 'music': music,
            'meter': mel['meter'] if mel['meter'] not in ('none', '') else '4/4',
            'bpm': bpm, 'first': first, 'notes': out, 'verses': verses, 'parts': parts}


def main():
    songs = [build_song(*row) for row in SONGS]
    for s in songs:
        print(f"{s['id']:<11} verses:{len(s['verses'])} parts:{len(s['parts'])} notes:{len(s['notes'])}")
    js = ('/* 20 public-domain hymns transcribed from the Open Hymnal Project (openhymnal.org).\n'
          '   Generated by tools/build_songs.py; see that file for the format. */\n'
          'const SONGS=' + json.dumps(songs, ensure_ascii=False, separators=(',', ':')) + ';\n')
    (HERE.parent / 'songs.js').write_text(js)
    print(f'wrote songs.js ({len(js) // 1024} KB)')


if __name__ == '__main__':
    main()

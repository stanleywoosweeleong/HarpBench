/* Harp Bench: languages (English, 中文, Bahasa Melayu).
   The app is written in English; this file translates what is on screen. A MutationObserver translates every
   text node and the title/aria-label/placeholder attributes as they appear, using the English text itself as the
   key, so new English strings fall back to English instead of breaking. Content that must stay as written (hymn
   lyrics, tab, note names) is either not in the dictionary or inside [data-i18n-skip]. */
"use strict";
const LANGS={en:'English',zh:'中文',ms:'Bahasa Melayu'};

/* English → [中文, Bahasa Melayu] */
const T={
// header and readout
'A playable 10-hole diatonic and 12-hole chromatic harmonica. Blow, draw, bend, overblow, slide and play chords in any key.':
 ['可弹奏的十孔布鲁斯口琴与十二孔半音阶口琴。吹、吸、压音、超吹、按键变音，任何调都能弹和弦。','Harmonika diatonik 10 lubang dan kromatik 12 lubang yang boleh dimainkan. Tiup, sedut, lentur, tiup lampau, slaid dan mainkan kord dalam apa-apa kunci.'],
'Install app':['安装应用','Pasang aplikasi'],
'Ready offline':['可离线使用','Sedia luar talian'],
'Sounding':['正在发声','Berbunyi'],
'Harp tab':['口琴谱','Tab harmonika'],
'tap a hole':['点一个孔','ketik satu lubang'],
'sound starts on first touch':['首次触碰后开始发声','bunyi bermula pada sentuhan pertama'],
'Holding a phone?':['正在用手机？','Guna telefon?'],
'Turn it sideways and it becomes the harmonica.':['把手机横过来，它就变成口琴。','Pusingkan ke sisi dan ia menjadi harmonika.'],
'Phone harp mode':['手机口琴模式','Mod harmonika telefon'],
'Language':['语言','Bahasa'],
// install cards
'Install Harp Bench on your iPhone':['在 iPhone 上安装 Harp Bench','Pasang Harp Bench pada iPhone anda'],
"This page is open inside another app, which can't add apps to the Home Screen. Open it in Safari first: use the app's “Open in Safari” or browser button, or copy the address into Safari.":
 ['此页面是在其他应用内打开的，无法添加到主屏幕。请先用 Safari 打开：点该应用的“在 Safari 中打开”或浏览器按钮，或把网址复制到 Safari。','Halaman ini dibuka di dalam aplikasi lain yang tidak boleh menambah aplikasi ke Skrin Utama. Buka dalam Safari dahulu: guna butang “Buka dalam Safari” atau pelayar aplikasi itu, atau salin alamat ke Safari.'],
'In Safari, tap <b>Share</b>':['在 Safari 中，点 <b>共享</b>','Dalam Safari, ketik <b>Kongsi</b>'],
'. On recent iOS versions it may be in the <b>•••</b> menu.':['。在较新的 iOS 版本中，它可能在 <b>•••</b> 菜单里。','. Pada versi iOS terkini, ia mungkin dalam menu <b>•••</b>.'],
'Choose <b>Add to Home Screen</b>, then <b>Add</b>.':['选择 <b>添加到主屏幕</b>，再点 <b>添加</b>。','Pilih <b>Tambah ke Skrin Utama</b>, kemudian <b>Tambah</b>.'],
'Open Harp Bench from its new icon. It runs full screen and works offline.':['从新图标打开 Harp Bench，它会全屏运行并可离线使用。','Buka Harp Bench dari ikon barunya. Ia berjalan skrin penuh dan berfungsi luar talian.'],
'Got it':['知道了','Faham'],
'Install Harp Bench on this computer':['在这台电脑上安装 Harp Bench','Pasang Harp Bench pada komputer ini'],
'It then opens in its own window, gets a Start menu or Dock icon, and works offline.':['安装后它会在独立窗口打开，出现在开始菜单或程序坞，并可离线使用。','Selepas itu ia dibuka dalam tetingkapnya sendiri, mendapat ikon menu Mula atau Dock, dan berfungsi luar talian.'],
'Look for the install icon at the right end of the address bar, or click <b>⋮</b> and open <b>Cast, save, and share</b>.':
 ['在地址栏右端找安装图标，或点 <b>⋮</b> 并打开 <b>投放、保存和分享</b>。','Cari ikon pasang di hujung kanan bar alamat, atau klik <b>⋮</b> dan buka <b>Hantar, simpan dan kongsi</b>.'],
'Choose <b>Install Harp Bench…</b> (or <b>Install page as app…</b>), then <b>Install</b>.':
 ['选择 <b>安装 Harp Bench…</b>（或 <b>将网页安装为应用…</b>），再点 <b>安装</b>。','Pilih <b>Pasang Harp Bench…</b> (atau <b>Pasang halaman sebagai apl…</b>), kemudian <b>Pasang</b>.'],
'If neither appears, Chrome is not offering an install for this page on this computer; the page still works offline in this tab.':
 ['如果都没有出现，说明 Chrome 在这台电脑上不提供安装；页面在此标签页中仍可离线使用。','Jika kedua-duanya tiada, Chrome tidak menawarkan pemasangan untuk halaman ini pada komputer ini; halaman masih berfungsi luar talian dalam tab ini.'],
'Click <b>…</b> (Settings and more) at the top right.':['点右上角的 <b>…</b>（设置及其他）。','Klik <b>…</b> (Tetapan dan lagi) di bahagian atas kanan.'],
'Choose <b>Apps</b>, then <b>Install this site as an app</b>.':['选择 <b>应用</b>，再选 <b>将此站点作为应用安装</b>。','Pilih <b>Aplikasi</b>, kemudian <b>Pasang tapak ini sebagai aplikasi</b>.'],
'Click <b>Install</b>.':['点 <b>安装</b>。','Klik <b>Pasang</b>.'],
'Installing works in Chrome and Edge, from the browser menu.':['在 Chrome 和 Edge 中可从浏览器菜单安装。','Pemasangan berfungsi dalam Chrome dan Edge, dari menu pelayar.'],
'In this browser, bookmark the page; it still works offline once loaded.':['在此浏览器中，请把页面加入书签；加载过一次后仍可离线使用。','Dalam pelayar ini, tanda halaman; ia tetap berfungsi luar talian selepas dimuatkan.'],
'A new version of Harp Bench is ready.':['Harp Bench 有新版本。','Versi baharu Harp Bench sudah sedia.'],
'Update':['更新','Kemas kini'],
// controls
'Instrument':['乐器','Alat muzik'],
'Diatonic · 10 hole':['十孔布鲁斯口琴','Diatonik · 10 lubang'],
'Chromatic · 12 hole':['十二孔半音阶口琴','Kromatik · 12 lubang'],
'Diatonic 10':['十孔','Diatonik 10'],
'Chromatic 12':['半音阶 12','Kromatik 12'],
'Harp key':['口琴调','Kunci harmonika'],
'Play in':['演奏调','Main dalam'],
'Highlight scale':['标示音阶','Serlahkan skala'],
'Blues':['布鲁斯','Blues'],
'Minor pentatonic':['小调五声音阶','Pentatonik minor'],
'Major pentatonic':['大调五声音阶','Pentatonik major'],
'Major (Ionian)':['大调（伊奥尼亚）','Major (Ionian)'],
'Mixolydian':['混合利底亚','Mixolydian'],
'Dorian':['多利亚','Dorian'],
'Natural minor':['自然小调','Minor asli'],
'None':['不标示','Tiada'],
'Mouth':['口型','Mulut'],
'Single':['单音','Tunggal'],
'Octave split':['八度分隔','Oktaf terpisah'],
'Voice':['音色','Suara'],
'Sweet':['甜美','Lembut'],
'Tremolo':['复音','Tremolo'],
'Octave':['八度','Oktaf'],
'My harp':['我的口琴','Harmonika saya'],
'Labels':['标签','Label'],
'Notes':['音名','Nama not'],
'Tab':['谱号','Tab'],
'Home note':['主音','Not asas'],
'In scale':['音阶内','Dalam skala'],
'Outside scale':['音阶外','Luar skala'],
'Bend note: drag away from the harp, or hold Z / X / C':['压音：从口琴往外拖，或按住 Z / X / C','Not lentur: seret menjauhi harmonika, atau tahan Z / X / C'],
'Overblow / overdraw':['超吹 / 超吸','Tiup lampau / sedut lampau'],
'Slide in (a semitone up)':['按下变音键（升半音）','Tekan slaid (naik separuh nada)'],
'Throat vibrato':['喉颤音','Vibrato tekak'],
'Cup hands (wah)':['手掌包覆（哇音）','Tekup tangan (wah)'],
'Overblows':['超吹','Tiup lampau'],
'Snap bends to pitch':['压音对准音高','Lentur tepat pada nada'],
'Hear the scale':['听音阶','Dengar skala'],
'Breath':['气息','Nafas'],
'Tone':['音色明暗','Ton'],
'Room':['空间混响','Gema bilik'],
'Upper half blows, lower half draws. Drag away from the harp to bend.':['上半部吹，下半部吸。从口琴往外拖可压音。','Separuh atas tiup, separuh bawah sedut. Seret menjauhi harmonika untuk melentur.'],
'Upper half blows, lower half draws. Hold the slide (or Shift) for sharps.':['上半部吹，下半部吸。按住变音键（或 Shift）得升半音。','Separuh atas tiup, separuh bawah sedut. Tahan slaid (atau Shift) untuk nada naik.'],
'Slide button (hold, or hold Shift)':['变音键（按住，或按住 Shift）','Butang slaid (tahan, atau tahan Shift)'],
// microphone and recorder
'Microphone':['麦克风','Mikrofon'],
'Play your real harmonica. The tuner shows the note, how far off it is, and which hole it is on this harp. While the microphone is on, Practice and Play along listen to you.':
 ['吹奏你的真口琴。调音器会显示音名、偏差多少，以及它在这把口琴上是哪个孔。麦克风开启时，“练习”和“跟奏”会听你吹。','Mainkan harmonika sebenar anda. Penala menunjukkan not, berapa jauh ia lari, dan lubang mana pada harmonika ini. Semasa mikrofon dihidupkan, Latihan dan Main bersama mendengar anda.'],
'Use microphone':['使用麦克风','Guna mikrofon'],
'Stop microphone':['关闭麦克风','Hentikan mikrofon'],
'Ignore sounds below':['忽略低于此音量','Abaikan bunyi di bawah'],
'Works in the installed app. Use headphones when Listen or the harmony is playing, or the microphone will hear the app.':
 ['在已安装的应用中可用。播放“试听”或和声时请戴耳机，否则麦克风会听到应用本身的声音。','Berfungsi dalam aplikasi yang dipasang. Guna fon kepala semasa Dengar atau harmoni dimainkan, jika tidak mikrofon akan mendengar aplikasi.'],
'Record each note of your own harmonica once, and the <b>My harp</b> voice plays your recordings, bends included. Use the harp in the key selected above, in a quiet room. Recordings stay on this device.':
 ['把你自己口琴的每个音录一次，<b>我的口琴</b> 音色就会用你的录音来演奏，压音也包括在内。请用上面所选调的口琴，在安静的房间录音。录音只保存在这台设备上。','Rakam setiap not harmonika anda sendiri sekali, dan suara <b>Harmonika saya</b> memainkan rakaman anda, termasuk lenturan. Guna harmonika dalam kunci yang dipilih di atas, di bilik yang senyap. Rakaman kekal pada peranti ini.'],
'Record my harp':['录制我的口琴','Rakam harmonika saya'],
'Record missing notes':['录制缺少的音','Rakam not yang tiada'],
'Stop recording':['停止录音','Hentikan rakaman'],
'Skip this note':['跳过这个音','Langkau not ini'],
'Delete recordings':['删除录音','Padam rakaman'],
'no notes recorded yet':['还没有录音','belum ada not dirakam'],
'Play it and hold it steady for about two seconds.':['吹出这个音，稳定保持约两秒。','Mainkan dan tahan dengan stabil kira-kira dua saat.'],
'Recording… keep holding.':['正在录音……请保持。','Merakam… teruskan menahan.'],
'A little longer, please: hold the note for about two seconds.':['请再长一点：保持这个音约两秒。','Lebih lama sedikit: tahan not kira-kira dua saat.'],
'Saved. Next note:':['已保存。下一个音：','Disimpan. Not seterusnya:'],
'Recording stopped.':['录音已停止。','Rakaman dihentikan.'],
'Recording stopped because the microphone was turned off.':['麦克风已关闭，录音停止。','Rakaman dihentikan kerana mikrofon dimatikan.'],
'All notes recorded. The My harp voice is now selected.':['所有音都录好了。已切换到“我的口琴”音色。','Semua not telah dirakam. Suara Harmonika saya kini dipilih.'],
'Recordings for this kind of harp deleted.':['已删除这类口琴的录音。','Rakaman untuk jenis harmonika ini dipadam.'],
'Microphone off.':['麦克风已关闭。','Mikrofon dimatikan.'],
'Microphone: on':['麦克风：开','Mikrofon: hidup'],
'Microphone: off':['麦克风：关','Mikrofon: mati'],
'Microphone on · play a note':['麦克风已开 · 吹一个音','Mikrofon hidup · mainkan satu not'],
'not on this harp':['不在这把口琴上','tiada pada harmonika ini'],
'The microphone is not available here. Open Harp Bench from its installed app or GitHub Pages address to use it.':
 ['此处无法使用麦克风。请从已安装的应用或 GitHub Pages 网址打开 Harp Bench。','Mikrofon tidak tersedia di sini. Buka Harp Bench dari aplikasi yang dipasang atau alamat GitHub Pages untuk menggunakannya.'],
'Microphone access was refused. Allow it for this site (on iPhone: Settings, Safari, Microphone), then press the button again.':
 ['麦克风权限被拒绝。请允许此网站使用（iPhone：设置 › Safari › 麦克风），然后再按一次按钮。','Akses mikrofon ditolak. Benarkan untuk tapak ini (pada iPhone: Tetapan, Safari, Mikrofon), kemudian tekan butang sekali lagi.'],
'Listening. Play one note at a time. Use headphones when Listen or the harmony is playing, or the microphone will hear the app.':
 ['正在聆听。请一次吹一个音。播放“试听”或和声时请戴耳机，否则麦克风会听到应用本身的声音。','Sedang mendengar. Mainkan satu not pada satu masa. Guna fon kepala semasa Dengar atau harmoni dimainkan, jika tidak mikrofon akan mendengar aplikasi.'],
'My harp has no recordings yet for this kind of harp, so it uses the Sweet sound. Record your harmonica under My harp below.':
 ['“我的口琴”还没有这类口琴的录音，所以暂用“甜美”音色。请在下方“我的口琴”录制你的口琴。','Harmonika saya belum ada rakaman untuk jenis harmonika ini, jadi ia guna bunyi Lembut. Rakam harmonika anda di bawah Harmonika saya.'],
// songbook
'Hymn songbook':['圣诗歌本','Buku lagu himne'],
'20 public-domain hymns, tabbed for whatever harp you have selected above. Listen first, then practise note by note.':
 ['20 首公版圣诗，按上面所选的口琴自动编好口琴谱。先试听，再逐音练习。','20 himne domain awam, ditab untuk harmonika yang anda pilih di atas. Dengar dahulu, kemudian berlatih not demi not.'],
'Add your own song':['添加你自己的歌','Tambah lagu anda sendiri'],
'Open .abc file':['打开 .abc 文件','Buka fail .abc'],
'Add to songbook':['加入歌本','Tambah ke buku lagu'],
'Position · same as Play in':['把位 · 与“演奏调”相同','Posisi · sama seperti Main dalam'],
'Listen':['试听','Dengar'],
'Play along':['跟奏','Main bersama'],
'Practice':['练习','Latihan'],
'Stop practice':['停止练习','Hentikan latihan'],
'Start over':['从头开始','Mula semula'],
'Speed':['速度','Kelajuan'],
'Notes as':['音符显示','Not sebagai'],
'Lyrics':['歌词','Lirik'],
'Metronome click':['节拍器','Klik metronom'],
'Count-in bar':['预备小节','Bar kiraan masuk'],
'Hymnal harmony':['诗本和声','Harmoni himne'],
'Guide melody':['旋律引导','Melodi panduan'],
'Loop this line':['循环这一行','Ulang baris ini'],
'Loop line':['循环一行','Ulang baris'],
'Harmony':['和声','Harmoni'],
'Click':['节拍','Klik'],
'Count-in':['预备拍','Kiraan masuk'],
'Song options':['歌曲选项','Pilihan lagu'],
'Hymn':['圣诗','Himne'],
'Stop song':['停止歌曲','Hentikan lagu'],
'Stop':['停止','Henti'],
'Score':['得分','Skor'],
'Now':['现在','Kini'],
'Play':['吹','Main'],
'Easy':['简单','Mudah'],
'Some bends':['少量压音','Sedikit lenturan'],
'Advanced':['进阶','Lanjutan'],
'Yours':['你的','Milik anda'],
'Remove from songbook':['从歌本移除','Buang dari buku lagu'],
'Alto, tenor and bass from the hymnal':['取自诗本的女低音、男高音和男低音','Alto, tenor dan bes daripada buku himne'],
'This hymn has no harmony parts':['这首圣诗没有和声声部','Himne ini tiada bahagian harmoni'],
'Quietly play the melody while you play along':['跟奏时轻声播放旋律','Mainkan melodi perlahan semasa anda main bersama'],
'Repeat the line with the selected note':['重复所选音符所在的一行','Ulang baris dengan not yang dipilih'],
'Listening… watch the lit holes on the harp.':['正在播放……看口琴上亮起的孔。','Sedang dimainkan… perhatikan lubang yang menyala pada harmonika.'],
'Well played. Press Practice to go again, or try Play along to keep time.':['吹得好！按“练习”再来一次，或试试“跟奏”练节奏。','Bagus! Tekan Latihan untuk ulang, atau cuba Main bersama untuk mengikut tempo.'],
'Well played!':['吹得好！','Bagus!'],
'Listen to hear it with the hymnal harmony, Play along to play it in time with a score, or Practice to go one note at a time. Tap any note to hear it.':
 ['按“试听”听带诗本和声的演奏，按“跟奏”按拍子吹并得分，按“练习”逐音学习。点任意音符可试听。','Dengar untuk mendengarnya dengan harmoni himne, Main bersama untuk bermain ikut tempo dengan skor, atau Latihan untuk satu not demi satu not. Ketik mana-mana not untuk mendengarnya.'],
'Paste a tune first, or open a file.':['请先粘贴乐谱，或打开文件。','Tampal lagu dahulu, atau buka fail.'],
'That text could not be read as ABC notation.':['无法把这段文字读成 ABC 乐谱。','Teks itu tidak dapat dibaca sebagai notasi ABC.'],
'No tune found. Check that the text is ABC notation with a K: (key) line before the notes.':['没有找到乐曲。请确认文字是 ABC 乐谱，并在音符前有 K:（调号）行。','Tiada lagu ditemui. Pastikan teks ialah notasi ABC dengan baris K: (kunci) sebelum not.'],
'Paste a tune in <a href="https://abcnotation.com/learn" target="_blank" rel="noopener">ABC notation</a> or open an .abc file. Many hymns and folk tunes are shared this way, for example on abcnotation.com or openhymnal.org. Lyrics on <code>w:</code> lines and extra voices for harmony are picked up too.':
 ['粘贴 <a href="https://abcnotation.com/learn" target="_blank" rel="noopener">ABC 乐谱</a>，或打开 .abc 文件。很多圣诗和民歌都以这种格式分享，例如 abcnotation.com 或 openhymnal.org。<code>w:</code> 行的歌词和用于和声的其他声部也会一并读取。','Tampal lagu dalam <a href="https://abcnotation.com/learn" target="_blank" rel="noopener">notasi ABC</a> atau buka fail .abc. Banyak himne dan lagu rakyat dikongsi begini, contohnya di abcnotation.com atau openhymnal.org. Lirik pada baris <code>w:</code> dan suara tambahan untuk harmoni turut dibaca.'],
// chords
'Chords':['和弦','Kord'],
'Hold a pad to sound the chord. Block chords use one breath across neighbouring holes; anything else is rolled across the holes it needs.':
 ['按住和弦键发声。块状和弦用一口气吹相邻的孔，其余和弦会在所需的孔上分解演奏。','Tahan pad untuk membunyikan kord. Kord blok guna satu nafas merentasi lubang bersebelahan; yang lain dimainkan bergulung merentasi lubang yang diperlukan.'],
'Any chord · root':['任意和弦 · 根音','Mana-mana kord · punca'],
'Quality':['性质','Jenis'],
'Major':['大三和弦','Major'],
'Minor':['小三和弦','Minor'],
'Dominant 7':['属七和弦','Dominan 7'],
'Minor 7':['小七和弦','Minor 7'],
'Major 7':['大七和弦','Major 7'],
'Major 6':['大六和弦','Major 6'],
'Sus 4':['挂四和弦','Sus 4'],
'Diminished':['减三和弦','Kurang'],
'Half-diminished':['半减七和弦','Separuh kurang'],
'Block chord':['块状和弦','Kord blok'],
'Rolled':['分解','Bergulung'],
'Custom':['自选','Pilihan'],
'not available':['无法演奏','tidak tersedia'],
'rest':['休止','rehat'],
'Chords · hold a pad':['和弦 · 按住和弦键','Kord · tahan pad'],
// keyboard
'Keyboard':['键盘','Papan kekunci'],
'Number keys blow, the letter right below each number draws the same hole. Hold modifiers while a note sounds.':
 ['数字键吹，每个数字正下方的字母键吸同一个孔。发声时按住修饰键。','Kekunci nombor meniup, huruf tepat di bawah setiap nombor menyedut lubang yang sama. Tahan kekunci pengubah semasa not berbunyi.'],
'Top letter row blows, home row draws. Hold modifiers while a note sounds.':['上排字母键吹，中排字母键吸。发声时按住修饰键。','Baris huruf atas meniup, baris tengah menyedut. Tahan kekunci pengubah semasa not berbunyi.'],
'Layout':['布局','Susun atur'],
'Numbers 1–0 blow':['数字 1–0 吹','Nombor 1–0 tiup'],
'Letters Q–P blow':['字母 Q–P 吹','Huruf Q–P tiup'],
'Hole':['孔','Lubang'],'Blow':['吹','Tiup'],'Draw':['吸','Sedut'],
'bend ½, 1, 1½ steps':['压音 半音、全音、全音半','lentur ½, 1, 1½ langkah'],
'overblow / overdraw':['超吹 / 超吸','tiup lampau / sedut lampau'],
'overblow / overdraw (when on)':['超吹 / 超吸（开启时）','tiup lampau / sedut lampau (bila dihidupkan)'],
'push the slide in':['按下变音键','tekan slaid'],
'throat vibrato while held':['按住时喉颤音','vibrato tekak semasa ditahan'],
'cup hands (release for a wah)':['手掌包覆（放开得哇音）','tekup tangan (lepas untuk wah)'],
'chord pads':['和弦键','pad kord'],
'change harp key':['切换口琴调','tukar kunci harmonika'],
'or':['或','atau'],
'start / stop the metronome':['开始 / 停止节拍器','mula / henti metronom'],
"Turn off your phone's silent switch if you hear nothing. Multi-touch works: hold the slide button with one finger and play with another.":
 ['如果没有声音，请关闭手机的静音开关。支持多点触控：一指按住变音键，另一指吹奏。','Matikan suis senyap telefon jika tiada bunyi. Sentuhan berbilang berfungsi: tahan butang slaid dengan satu jari dan main dengan jari lain.'],
// metronome
'Metronome':['节拍器','Metronom'],
'Start':['开始','Mula'],
'Tap tempo':['点按测速','Ketuk tempo'],
'Beats':['拍数','Ketukan'],
'Feel':['节奏型','Rasa'],
'Quarters':['四分音符','Krocet'],
'Eighths':['八分音符','Kuaver'],
'Shuffle':['摇摆','Shuffle'],
'Slower':['慢一点','Lebih perlahan'],'Faster':['快一点','Lebih laju'],'Tempo':['速度','Tempo'],
// phone mode
'Settings':['设置','Tetapan'],
'VIBRATO':['颤音','VIBRATO'],
'hold':['按住','tahan'],
'hold to cup your hands':['按住以包覆双手','tahan untuk menekup tangan'],
'WAH':['哇音','WAH'],
'hold to cup':['按住包覆','tahan untuk tekup'],
'SLIDE':['变音键','SLAID'],
'hold for sharps':['按住升半音','tahan untuk naik'],
'OVERBLOW':['超吹','TIUP LAMPAU'],
'DRAW':['吸','SEDUT'],
'hold to inhale':['按住即吸','tahan untuk sedut'],
'slide down to bend':['往下滑压音','luncur ke bawah untuk lentur'],
'your hands':['双手','tangan anda'],
'Pocket harp':['口袋口琴','Harmonika poket'],
'Back to playing':['返回演奏','Kembali bermain'],
'Leave phone mode':['退出手机模式','Keluar mod telefon'],
'Flip the silent switch off if you hear nothing. Sound comes from the phone speaker, so keep it uncovered.':['如果没有声音，请关闭静音开关。声音从手机扬声器发出，请不要遮住它。','Matikan suis senyap jika tiada bunyi. Bunyi keluar dari pembesar suara telefon, jadi jangan tutupnya.'],
'Turn your phone sideways':['请把手机横过来','Pusingkan telefon anda ke sisi'],
'Hold it like a harmonica: holes run along the long edge, blow on the top half, draw on the bottom half.':['像拿口琴一样拿着：孔沿着长边排列，上半部吹，下半部吸。','Pegang seperti harmonika: lubang di sepanjang tepi panjang, tiup di separuh atas, sedut di separuh bawah.'],
'Use the full view instead':['改用完整画面','Guna paparan penuh'],
'Breath control':['气息控制','Kawalan nafas'],
'Top / bottom half':['上半 / 下半','Separuh atas / bawah'],
'Left thumb pad':['左拇指键','Pad ibu jari kiri'],
'Bends':['压音','Lenturan'],
'Snap to pitch':['对准音高','Tepat pada nada'],
'Free':['自由','Bebas'],
'Off':['关','Mati'],'On':['开','Hidup'],
'thumb breath':['拇指控制气息','nafas ibu jari'],
'top blows, bottom draws':['上吹下吸','atas tiup, bawah sedut'],
'Diatonic':['布鲁斯口琴','Diatonik'],'Chromatic':['半音阶口琴','Kromatik'],
// aria labels
'Instrument settings':['乐器设置','Tetapan alat muzik'],
'Harmonica':['口琴','Harmonika'],
'Microphone tuner':['麦克风调音器','Penala mikrofon'],
'Songbook':['歌本','Buku lagu'],
'Bright and gritty, one reed':['明亮粗犷，一片簧片','Terang dan kasar, satu reed'],
'Warm and round, two reeds a hair apart':['温暖圆润，两片簧片微微错开','Hangat dan bulat, dua reed sedikit berbeza'],
'Two reeds tuned apart so they shimmer':['两片簧片音高错开，产生波动','Dua reed ditala berbeza supaya berkilau'],
'A second reed an octave higher':['再加一片高八度的簧片','Reed kedua satu oktaf lebih tinggi'],
'Your own harmonica, recorded in the Microphone section':['你自己的口琴，在“麦克风”部分录制','Harmonika anda sendiri, dirakam di bahagian Mikrofon'],
'Harmonica. Upper half of each hole blows, lower half draws. With a keyboard, number keys 1 to 0 blow holes 1 to 10 and the letters Q to P below them draw.':
 ['口琴。每个孔的上半部吹，下半部吸。用键盘时，数字键 1 到 0 吹 1 到 10 孔，下方的字母 Q 到 P 吸。','Harmonika. Separuh atas setiap lubang meniup, separuh bawah menyedut. Dengan papan kekunci, kekunci nombor 1 hingga 0 meniup lubang 1 hingga 10 dan huruf Q hingga P di bawahnya menyedut.'],
// hymn titles: the familiar Chinese name beside the English (lyrics stay in English)
'Amazing Grace':['奇异恩典 · Amazing Grace','Amazing Grace'],
'Holy, Holy, Holy':['圣哉，圣哉，圣哉 · Holy, Holy, Holy','Holy, Holy, Holy'],
'Be Thou My Vision':['成为我异象 · Be Thou My Vision','Be Thou My Vision'],
'Great Is Thy Faithfulness':['祢的信实广大 · Great Is Thy Faithfulness','Great Is Thy Faithfulness'],
'What a Friend We Have in Jesus':['耶稣恩友 · What a Friend We Have in Jesus','What a Friend We Have in Jesus'],
'Blessed Assurance':['有福的确据 · Blessed Assurance','Blessed Assurance'],
'It Is Well with My Soul':['我心灵得安宁 · It Is Well with My Soul','It Is Well with My Soul'],
'Rock of Ages':['万古磐石 · Rock of Ages','Rock of Ages'],
'Nearer, My God, to Thee':['更与主接近 · Nearer, My God, to Thee','Nearer, My God, to Thee'],
'Joyful, Joyful, We Adore Thee':['欢乐颂 · Joyful, Joyful, We Adore Thee','Joyful, Joyful, We Adore Thee'],
'Doxology (Praise God, from Whom All Blessings Flow)':['三一颂 · Doxology','Doxology (Praise God, from Whom All Blessings Flow)'],
'Come, Thou Fount of Every Blessing':['万福恩源 · Come, Thou Fount of Every Blessing','Come, Thou Fount of Every Blessing'],
'Jesus Loves Me':['耶稣爱我 · Jesus Loves Me','Jesus Loves Me'],
'Crown Him with Many Crowns':['以众冠冕为祂加冕 · Crown Him with Many Crowns','Crown Him with Many Crowns'],
'When I Survey the Wondrous Cross':['奇妙十架 · When I Survey the Wondrous Cross','When I Survey the Wondrous Cross'],
'O for a Thousand Tongues to Sing':['千舌颂扬 · O for a Thousand Tongues to Sing','O for a Thousand Tongues to Sing'],
'Abide with Me':['求主同住 · Abide with Me','Abide with Me'],
'Praise to the Lord, the Almighty':['赞美全能神 · Praise to the Lord, the Almighty','Praise to the Lord, the Almighty'],
'Silent Night':['平安夜 · Silent Night','Silent Night'],
'The Old Rugged Cross':['古旧十架 · The Old Rugged Cross','The Old Rugged Cross'],
};

/* Patterns for text with numbers or names in it. Each: [regex on the English, function(match, lang, tr) → text] */
const ORD_NUM=o=>parseInt(o,10);
const NICK={'straight harp':['正把位','harmonika lurus'],'cross harp':['交叉把位','harmonika silang'],'slant harp':['斜把位','harmonika serong']};
const TP=[
 [/^(.+) · (\d+)(?:st|nd|rd|th) position(?: \((straight harp|cross harp|slant harp)\))?$/,(m,l,tr)=>l==='zh'?`${tr(m[1])} · 第${ORD_NUM(m[2])}把位${m[3]?'（'+NICK[m[3]][0]+'）':''}`:`${tr(m[1])} · posisi ke-${ORD_NUM(m[2])}${m[3]?' ('+NICK[m[3]][1]+')':''}`],
 [/^(\d+)(?:st|nd|rd|th) · (\S+)$/,(m,l)=>l==='zh'?`第${ORD_NUM(m[1])}把位 · ${m[2]}`:`Posisi ke-${ORD_NUM(m[1])} · ${m[2]}`],
 [/^Key of (\S+)$/,(m,l)=>l==='zh'?`${m[1]} 调`:`Kunci ${m[1]}`],
 [/^(Easy|Some bends|Advanced) · (\d+)(?:st|nd|rd|th) position$/,(m,l,tr)=>l==='zh'?`${tr(m[1])} · 第${ORD_NUM(m[2])}把位`:`${tr(m[1])} · posisi ke-${ORD_NUM(m[2])}`],
 [/^(\S+) diatonic$/,(m,l)=>l==='zh'?`${m[1]} 调十孔口琴`:`Diatonik ${m[1]}`],
 [/^(\S+) chromatic$/,(m,l)=>l==='zh'?`${m[1]} 调半音阶口琴`:`Kromatik ${m[1]}`],
 [/^· Richter tuning ·$/,(m,l)=>l==='zh'?'· 里希特调音 ·':'· penalaan Richter ·'],
 [/^, (\d+)(?:st|nd|rd|th) position(?: \((straight harp|cross harp|slant harp)\))?$/,(m,l)=>l==='zh'?`，第${ORD_NUM(m[1])}把位${m[2]?'（'+NICK[m[2]][0]+'）':''}`:`, posisi ke-${ORD_NUM(m[1])}${m[2]?' ('+NICK[m[2]][1]+')':''}`],
 [/^· solo tuning, (\S+) · playing in$/,(m,l)=>l==='zh'?`· 独奏调音，${m[1]} · 演奏调`:`· penalaan solo, ${m[1]} · bermain dalam`],
 [/^Diatonic · in (\S+) · (\d+)(?:st|nd|rd|th) pos · (.+)$/,(m,l,tr)=>l==='zh'?`十孔 · ${m[1]} 调 · 第${ORD_NUM(m[2])}把位 · ${tr(m[3])}`:`Diatonik · dalam ${m[1]} · posisi ke-${ORD_NUM(m[2])} · ${tr(m[3])}`],
 [/^Chromatic · in (\S+) · (.+)$/,(m,l,tr)=>l==='zh'?`半音阶 · ${m[1]} 调 · ${tr(m[2])}`:`Kromatik · dalam ${m[1]} · ${tr(m[2])}`],
 [/^Chords in (\S+)$/,(m,l)=>l==='zh'?`${m[1]} 调和弦`:`Kord dalam ${m[1]}`],
 [/^Key of$/,(m,l)=>l==='zh'?'调：':'Kunci'],
 [/^on your (\S+) (diatonic|chromatic) \((\d+)(?:st|nd|rd|th) position(?:, (straight harp|cross harp|slant harp))?\) · (\S+) time · holes$/,
  (m,l)=>l==='zh'?`· 用你的 ${m[1]} 调${m[2]==='diatonic'?'十孔':'半音阶'}口琴（第${ORD_NUM(m[3])}把位${m[4]?'，'+NICK[m[4]][0]:''}）· ${m[5]} 拍 · 孔位`
   :`pada harmonika ${m[2]==='diatonic'?'diatonik':'kromatik'} ${m[1]} anda (posisi ke-${ORD_NUM(m[3])}${m[4]?', '+NICK[m[4]][1]:''}) · masa ${m[5]} · lubang`],
 [/^on your (\S+) chromatic · (\S+) time · holes$/,(m,l)=>l==='zh'?`· 用你的 ${m[1]} 调半音阶口琴 · ${m[2]} 拍 · 孔位`:`pada harmonika kromatik ${m[1]} anda · masa ${m[2]} · lubang`],
 [/^· no bends( ·)?$/,(m,l)=>(l==='zh'?'· 无需压音':'· tiada lenturan')+(m[1]||'')],
 [/^bent notes?( ·)?$/,(m,l)=>(l==='zh'?'个压音':'not lentur')+(m[1]||'')],
 [/^(overblown|slide) notes?(?: \(overblows turned on for this hymn\))?$/,(m,l)=>{const auto=m[0].includes('turned on');
   return l==='zh'?(m[1]==='slide'?'个变音键音':'个超吹音')+(auto?'（已为这首圣诗开启超吹）':''):(m[1]==='slide'?'not slaid':'not tiup lampau')+(auto?' (tiup lampau dihidupkan untuk himne ini)':'');}],
 [/^notes? not on this harp \(turn on overblows\)$/,(m,l)=>l==='zh'?'个音不在这把口琴上（请开启超吹）':'not tiada pada harmonika ini (hidupkan tiup lampau)'],
 [/^Words: (.+) · Music: (.+)$/,(m,l)=>l==='zh'?`作词：${m[1]} · 作曲：${m[2]}`:`Lirik: ${m[1]} · Muzik: ${m[2]}`],
 [/^Added by you(.*)$/,(m,l)=>(l==='zh'?'由你添加':'Ditambah oleh anda')+(m[1]||'')],
 [/^(\S+) chord, (block|rolled): (.*)$/,(m,l)=>l==='zh'?`${m[1]} 和弦，${m[2]==='block'?'块状':'分解'}：${m[3]}`:`Kord ${m[1]}, ${m[2]==='block'?'blok':'bergulung'}: ${m[3]}`],
 [/^Best (\d+)% · played (\d+)×$/,(m,l)=>l==='zh'?`最佳 ${m[1]}% · 已练 ${m[2]} 次`:`Terbaik ${m[1]}% · dimainkan ${m[2]}×`],
 [/^Verse (\d+)$/,(m,l)=>l==='zh'?`第 ${m[1]} 节`:`Rangkap ${m[1]}`],
 [/^then (.+)$/,(m,l)=>l==='zh'?`接着 ${m[1]}`:`kemudian ${m[1]}`],
 [/^on time ·$/,(m,l)=>l==='zh'?'准时 ·':'tepat masa ·'],
 [/^early or late ·$/,(m,l)=>l==='zh'?'早或晚 ·':'awal atau lewat ·'],
 [/^missed(.*)$/,(m,l)=>{let rest=m[1];
   rest=rest.replace(' · looping this line',l==='zh'?' · 正在循环这一行':' · mengulang baris ini').replace(/ · your best is (\d+)%/,l==='zh'?' · 你的最佳成绩是 $1%':' · skor terbaik anda $1%').replace(' · new best',l==='zh'?' · 新纪录':' · rekod baharu');
   return (l==='zh'?'漏掉':'terlepas')+rest;}],
 [/^(\d+) on time · (\d+) early\/late · (\d+) missed(?: · best (\d+)%)?$/,(m,l)=>l==='zh'?`${m[1]} 准时 · ${m[2]} 早/晚 · ${m[3]} 漏掉${m[4]?' · 最佳 '+m[4]+'%':''}`:`${m[1]} tepat · ${m[2]} awal/lewat · ${m[3]} terlepas${m[4]?' · terbaik '+m[4]+'%':''}`],
 [/^Bend: (blow|draw) hole (\d+) and bend it down (a half step|a whole step|a step and a half)\. Drag (up|down) from the (blow|draw) note, or hold (\S) and press (\S+)\.$/,
  (m,l)=>{const amt={'a half step':['半音','separuh langkah'],'a whole step':['全音','satu langkah'],'a step and a half':['全音半','satu setengah langkah']}[m[3]];
   return l==='zh'?`压音：${m[1]==='blow'?'吹':'吸'} ${m[2]} 孔并往下压${amt[0]}。从${m[5]==='blow'?'吹':'吸'}音往${m[4]==='up'?'上':'下'}拖，或按住 ${m[6]} 再按 ${m[7]}。`
    :`Lentur: ${m[1]==='blow'?'tiup':'sedut'} lubang ${m[2]} dan lentur ke bawah ${amt[1]}. Seret ke ${m[4]==='up'?'atas':'bawah'} dari not ${m[5]==='blow'?'tiup':'sedut'}, atau tahan ${m[6]} dan tekan ${m[7]}.`;}],
 [/^(Overblow|Overdraw): tap the round chip (above|below) hole (\d+), or hold Shift and press (\S+)\.$/,
  (m,l)=>l==='zh'?`${m[1]==='Overblow'?'超吹':'超吸'}：点 ${m[3]} 孔${m[2]==='above'?'上方':'下方'}的圆形标签，或按住 Shift 再按 ${m[4]}。`
   :`${m[1]==='Overblow'?'Tiup lampau':'Sedut lampau'}: ketik cip bulat di ${m[2]==='above'?'atas':'bawah'} lubang ${m[3]}, atau tahan Shift dan tekan ${m[4]}.`],
 [/^Slide in: hold the slide button \(or Shift\) and (blow|draw) hole (\d+)\. Keyboard: Shift \+ (\S+)\.$/,
  (m,l)=>l==='zh'?`按下变音键：按住变音键（或 Shift）并${m[1]==='blow'?'吹':'吸'} ${m[2]} 孔。键盘：Shift + ${m[3]}。`:`Tekan slaid: tahan butang slaid (atau Shift) dan ${m[1]==='blow'?'tiup':'sedut'} lubang ${m[2]}. Papan kekunci: Shift + ${m[3]}.`],
 [/^(Blow|Draw) hole (\d+)$/,(m,l)=>l==='zh'?`${m[1]==='Blow'?'吹':'吸'} ${m[2]} 孔`:`${m[1]==='Blow'?'Tiup':'Sedut'} lubang ${m[2]}`],
 [/^note (\d+) of (\d+)$/,(m,l)=>l==='zh'?`第 ${m[1]} / ${m[2]} 个音`:`not ${m[1]} daripada ${m[2]}`],
 [/^(\d+) of (\d+) notes recorded$/,(m,l)=>l==='zh'?`已录 ${m[1]} / ${m[2]} 个音`:`${m[1]} daripada ${m[2]} not dirakam`],
 [/^(\S+) on your (\S+) harp$/,(m,l)=>l==='zh'?`在你的 ${m[2]} 调口琴上是 ${m[1]}`:`${m[1]} pada harmonika ${m[2]} anda`],
 [/^([+-]?\d+) cents$/,(m,l)=>l==='zh'?`${m[1]} 音分`:`${m[1]} sen`],
 [/^Added “(.+)”\.$/,(m,l)=>l==='zh'?`已添加“${m[1]}”。`:`“${m[1]}” ditambah.`],
 [/^Added\. (\d+) notes? (?:are|is) out of this harp's range in every position; try another harp key\.$/,(m,l)=>l==='zh'?`已添加。有 ${m[1]} 个音在任何把位都超出这把口琴的音域，请换一把调的口琴试试。`:`Ditambah. ${m[1]} not di luar julat harmonika ini dalam setiap posisi; cuba kunci harmonika lain.`],
 [/^The microphone could not start(?:: (.*))?\.?$/,(m,l)=>(l==='zh'?'麦克风无法启动':'Mikrofon tidak dapat dimulakan')+(m[1]?': '+m[1]:'。'.replace('。',l==='zh'?'。':'.'))],
 [/^(\S+)\s+(bend|overblow|overdraw|slide in)$/,(m,l)=>{const w={bend:['压音','lentur'],overblow:['超吹','tiup lampau'],overdraw:['超吸','sedut lampau'],'slide in':['变音键','slaid']}[m[2]]; return `${m[1]}  ${l==='zh'?w[0]:w[1]}`;}],
 [/^Score (\d+)%$/,(m,l)=>l==='zh'?`得分 ${m[1]}%`:`Skor ${m[1]}%`],
];

function tr(en,lang){
  if(!lang||lang==='en'||en==null) return en;
  const key=String(en).replace(/\s+/g,' ').trim(); if(!key) return en;
  const i=lang==='zh'?0:1;
  let out=T[key]?T[key][i]:null;
  if(out==null) for(const [re,fn] of TP){ const m=re.exec(key); if(m){ out=fn(m,lang,x=>tr(x,lang)); break; } }
  if(out==null) return en;
  const lead=/^\s*/.exec(en)[0], trail=/\s*$/.exec(en)[0];   // keep the spacing around the text
  return lead+out+trail;
}

/* ---------- applying it to the page ---------- */
const i18nOrig=new WeakMap(), i18nLast=new WeakMap(), i18nAttrs=['title','aria-label','placeholder'];
function i18nLang(){ return state.lang||'en'; }
function i18nSkip(el){ return !el||!!el.closest('[data-i18n-skip],[data-i18n-html],script,style,textarea,code,kbd'); }
function i18nText(n){
  const p=n.parentElement; if(i18nSkip(p)) return;
  if(p.hasAttribute('data-i18n-html')) return;
  const cur=n.nodeValue;
  if(i18nLast.get(n)!==cur) i18nOrig.set(n,cur);        // the app wrote new (English) text
  const out=tr(i18nOrig.get(n),i18nLang());
  if(out!==cur) n.nodeValue=out;
  i18nLast.set(n,out);
}
function i18nHtml(el){
  // elements whose sentence contains markup are translated whole
  const cur=el.innerHTML; let o=i18nOrig.get(el);
  if(i18nLast.get(el)!==cur){ o=cur; i18nOrig.set(el,o); }
  const out=tr(o,i18nLang()); if(out!==cur) el.innerHTML=out; i18nLast.set(el,el.innerHTML);
}
function i18nAttr(el,a){
  if(i18nSkip(el)) return;
  const cur=el.getAttribute(a); if(cur==null) return;
  const k='__i18n_'+a; if(el[k+'last']!==cur) el[k+'orig']=cur;
  const out=tr(el[k+'orig'],i18nLang()); if(out!==cur) el.setAttribute(a,out); el[k+'last']=out;
}
function i18nTree(root){
  if(!root) return;
  if(root.nodeType===3){ i18nText(root); return; }
  if(root.nodeType!==1) return;
  if(root.hasAttribute&&root.hasAttribute('data-i18n-html')){ i18nHtml(root); return; }
  for(const a of i18nAttrs) if(root.hasAttribute(a)) i18nAttr(root,a);
  root.querySelectorAll('[data-i18n-html]').forEach(i18nHtml);
  for(const a of i18nAttrs) root.querySelectorAll('['+a+']').forEach(el=>i18nAttr(el,a));
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())) i18nText(n);
}
let i18nObs=null;
function i18nStart(){
  if(!state.lang){
    const pref=(navigator.languages||[navigator.language||'en']).map(x=>String(x).toLowerCase());
    state.lang=pref.find(x=>x.startsWith('zh'))?'zh':pref.find(x=>x.startsWith('ms'))?'ms':'en';
  }
  i18nSetDoc();
  i18nTree(document.body);
  i18nObs=new MutationObserver(recs=>{
    for(const r of recs){
      if(r.type==='characterData') i18nText(r.target);
      else if(r.type==='attributes') i18nAttr(r.target,r.attributeName);
      else r.addedNodes.forEach(n=>{ const host=n.parentElement&&n.parentElement.closest('[data-i18n-html]'); if(host) i18nHtml(host); else i18nTree(n); });
    }
  });
  i18nObs.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:i18nAttrs});
}
function i18nSetDoc(){
  const l=i18nLang(); document.documentElement.lang=l==='zh'?'zh-Hans':l;
  document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===l));
}
function setLang(l){
  if(!LANGS[l]) return; state.lang=l; save(); i18nSetDoc(); i18nTree(document.body);
}

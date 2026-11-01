# Paravan: descrierea aplicației

Data: 2026-11-01
Autor: Claude, din conversația cu Raluca Păduraru
Stare: de aprobat de Raluca (verificat de un subagent-constructor pe 1 nov; singura întrebare care era a Ralucăi, plasa de siguranță pentru nume, e tranșată în §5)

## 1. Ce e și de ce

Paravan e o aplicație care rulează integral în browser, pe laptopul utilizatorului, și ascunde datele personale dintr-un fișier înainte ca fișierul să ajungă într-un chat AI din cloud. După ce AI-ul lucrează pe varianta cu etichete, utilizatorul încarcă rezultatul înapoi în Paravan, iar aplicația pune la loc datele reale. Partea scrisă de AI rămâne neatinsă.

Subtitlul din aplicație: **„pseudonimizare locală a datelor personale”** (formularea Ralucăi).

Termenul corect e pseudonimizare (GDPR, art. 4 pct. 5): datele se pot reface cu cheia, deci rămân date personale cât timp cheia există. Aplicația și README-ul folosesc termenul ăsta.

**De ce acum:** Raluca ține pe 12 nov 2026 un panel la masterul CLEFP (Politehnica București) despre AI în practica de consiliere, cu accent pe confidențialitate și pe aplicații locale. Anunțul panelului promite că profesioniștii fără pregătire tehnică pot construi singuri instrumente locale de anonimizare și transcriere. Paravan e dovada: Raluca îl construiește cu AI, îl arată într-un demo înregistrat (înregistrarea e pe 10 nov) și îl dă mai departe după panel.

**Pentru cine:** generic, nu doar pentru consilieri. Oricine lucrează cu date despre oameni: consilieri, coachi, HR, juriști, traineri. Utilizatorul tipic nu e tehnic și nu instalează nimic.

**Cum arată succesul:** în demo, Raluca încarcă un transcript de coaching, apasă un singur buton și nimic din ce ar identifica persoana nu mai apare în textul anonimizat. Apoi încarcă rezultatul de la AI și primește documentul cu numele la loc.

## 2. Obiective

1. **Pasul 1, anonimizează:** utilizatorul încarcă un fișier `.md`, `.txt`, `.docx`, `.pdf`, `.csv` sau `.xlsx`. Un singur click găsește datele personale după reguli fixe și le înlocuiește cu etichete de forma `[PERSOANA_1]`, `[TELEFON_1]`.
2. Aceeași entitate primește aceeași etichetă peste tot în document.
3. După click, aplicația arată: rezumatul pe categorii („14 nume, 2 telefoane…”), previzualizarea textului cu etichetele evidențiate, un câmp opțional pentru ce a scăpat și cele două descărcări (fișierul pseudonimizat și cheia).
4. **Pasul 2, lucrezi în AI:** aplicația explică pasul și oferă o frază de copiat (cu buton de copiere) care îi cere AI-ului să lase etichetele neschimbate.
5. **Pasul 3, dezanonimizează:** utilizatorul încarcă rezultatul de la AI. Aplicația înlocuiește etichetele cu valorile reale și dă fișierul de descărcat. Restul textului rămâne identic.
6. Funcționează fără internet după deschidere. Niciun octet din fișiere sau din cheie nu pleacă de pe laptop.
7. Merge pe Windows și pe Mac, în Chrome, Edge, Safari și Firefox actuale, fără instalare.
8. Codul e public pe GitHub (`raluca-catalyst/paravan`), cu README în română pentru oameni non-tehnici.

## 3. Ce nu face (non-goals)

- Nu detectează categoriile speciale din GDPR (sănătate, religie, etnie, orientare) și nici detaliile unice dintr-o poveste. Aplicația spune asta pe ecran, într-o propoziție: „Verifică povestea, nu doar numele.”
- Nu reface formatarea PDF-ului sau a DOCX-ului la pasul 1: din ele iese text `.md`.
- Nu folosește modele AI sau NER (recunoaștere de entități cu model antrenat). Doar reguli și liste.
- Nu are server, conturi, istoric sau sincronizare.
- Nu are pas obligatoriu de revizuire: câmpul pentru ce a scăpat e opțional.

## 4. Anti-obiective (ce ar face aplicația un eșec, chiar dacă merge tehnic)

- **Date care identifică persoana rămân vizibile în fișierul pseudonimizat** (în cuvintele Ralucăi: „să pun un transcript dintr-o discuție de coaching și să apară chestii care n-ar trebui să apară”). Prioritatea e să nu scape nimic. Un fals pozitiv (un cuvânt mascat degeaba) e acceptabil, o scăpare nu.
- Orice cerere de rețea care trimite conținut din fișier sau din cheie.
- Dezanonimizarea modifică textul scris de AI în afara etichetelor.
- Utilizatorul are nevoie de terminal, Python sau instalări.

## 5. Ce detectează (reguli fixe)

| Eticheta | Ce prinde | Cum (orientativ) |
|---|---|---|
| `PERSOANA` | nume și prenume | lista de prenume și nume de familie (§6) + diminutive generate din prenume (ex. Ionuț, Mihaela → Mihi unde e frecvent) + forme de genitiv-dativ („Mariei”, „lui Popescu”, „Ioanei”) + indicii („dl.”, „dna.”, „doamna”, „domnul”). Un nume complet („Maria Popescu”) e o singură entitate; mențiunile parțiale ulterioare („Maria”) primesc aceeași etichetă când nu e ambiguu |
| etichete de vorbitor | „Maria:” la început de rând, în transcripturi | regulă de început de rând; numele intră în `PERSOANA` |
| `CNP` | cod numeric personal | 13 cifre + cifra de control |
| `TELEFON` | numere de telefon | formate românești (07xx, +40, cu spații, puncte, cratime) și internaționale cu prefix |
| `EMAIL` | adrese de email | regex |
| `IBAN` | conturi bancare | format IBAN + verificare mod 97 |
| `CARD` | numere de card | 13-19 cifre + Luhn |
| `ACT_IDENTITATE` | serie și număr CI, pașaport | două litere + 6 cifre, cu context („seria”, „CI”, „buletin”) |
| `DATA_NASTERII` | data nașterii | o dată calendaristică lângă „născut”, „data nașterii”, „n.” |
| `ADRESA` | adrese | indicatori („str.”, „strada”, „bd.”, „nr.”, „bl.”, „sc.”, „ap.”, „et.”) + ce urmează |
| `LOCALITATE` | localități din România | listă publică de localități (§6) |
| `NR_AUTO` | numere de înmatriculare | formatul românesc (B 123 ABC, CJ 12 ABC) |
| `IP` | adrese IP | regex IPv4/IPv6 |
| `FIRMA` | firme | nume urmate de „SRL”, „S.R.L.”, „SA”, „S.A.”, „Grup”, „PFA”, „II” |

**Plasa de siguranță pentru nume care nu sunt în listă (decizia Ralucăi, 1 nov):** varianta prudentă. Pe lângă lista de nume, aplicația mai ascunde orice cuvânt scris cu literă mare în mijlocul propoziției care nu e un cuvânt obișnuit din română (ex. „Am vorbit cu Zsófia” → `[PERSOANA_3]`). Acceptăm că prinde și lucruri inofensive („Google”, „Excel”, „Crăciun”, titluri). Constructorul poate scuti o listă scurtă de cuvinte evident inofensive (zilele săptămânii, lunile, „AI”), cât timp nu scapă nume. Ca să știe ce e „cuvânt obișnuit”, aplicația are nevoie de o listă de cuvinte românești cu licență liberă; constructorul alege sursa.

Numele care sunt și cuvinte obișnuite („Floare”, „Lupu”, „Negru”, „Bucur”) se prind doar cu literă mare în mijlocul propoziției sau lângă un alt nume din listă. La început de propoziție, un astfel de cuvânt se prinde doar dacă îl urmează un nume din listă.

## 6. Date externe

- **Nume:** [romanian-names-db](https://github.com/andyhatestheworld/romanian-names-db), CC BY 4.0: peste 640 de prenume de femei, peste 594 de bărbați, peste 9.700 de nume de familie, cu diacritice corecte. Se completează cu prenumele uzuale care lipsesc. Atribuirea apare în subsolul aplicației și în README.
- **Localități:** o listă publică de localități din România, cu licență care permite redistribuirea. Constructorul alege sursa și verifică licența.
- Seturile de nume construite din date scurse (de exemplu, din scurgerea Facebook) sunt excluse.

## 7. Etichete, cheie și dezanonimizare

- **Formatul etichetei:** `[CATEGORIE_N]`, cu N de la 1, pe categorie.
- **Cheia** e un fișier JSON descărcabil, cu legătura etichetă → valoare reală, plus numele fișierului sursă și data. Aplicația spune lângă buton că cheia conține datele reale și nu se dă AI-ului.
- În aceeași sesiune, cheia rămâne în memoria paginii, deci pasul 3 merge fără reîncărcarea ei. Dacă pagina a fost redeschisă, pasul 3 cere cheia.
- **Toleranța la ce face AI-ul cu etichetele:** la pasul 3 se recunosc și variantele pe care AI-urile le produc des: litere mici sau mari, spațiu în loc de underscore, paranteze lipsă sau escapate de Markdown (`\[PERSOANA\_1\]`). Orice etichetă care nu se regăsește în cheie se raportează pe ecran și nu se atinge.
- Câmpul „A scăpat ceva?”: textul introdus devine o entitate nouă (implicit `PERSOANA`), toate aparițiile lui primesc eticheta, iar previzualizarea și cheia se actualizează.

## 8. Formate

| Format | Pasul 1 primește | Pasul 1 dă | Pasul 3 primește | Pasul 3 dă |
|---|---|---|---|---|
| `.md`, `.txt` | da | același format | da | același format |
| `.csv`, `.xlsx` | da | același format, celulă cu celulă | da | același format |
| `.docx` | da | `.md` | da | `.docx` dacă etichetele se pot înlocui fără să strice documentul, altfel `.md` |
| `.pdf` | da (text extras) | `.md` | da (text extras) | `.md` |

Utilizatorul poate și lipi text direct într-un câmp, la pasul 1 și la pasul 3 (ce copiază din chat-ul AI).

## 9. Ecranul

Aprobat de Raluca pe schița „B v2” (`.superpowers/brainstorm/…/content/layout-b-v2.html` în scratchpad-ul sesiunii; o copie stă lângă documentul ăsta, ca `schita-ecran-v2.html`):

- O singură pagină, cei trei pași unul sub altul, legați de linia punctată lavandă („firul” din brand). Pasul activ e luminat.
- Sus: titlul „Paravan”, subtitlul „pseudonimizare locală a datelor personale” și butonul „Luminos / Întunecat”. Fără alt text introductiv și fără eticheta „fără internet” (cererea Ralucăi).
- Brandul Upvance (skill-ul `brand-upvance`, `references/web-style.css`): temă întunecată implicită (indigo `#0e0b1e`, strălucire violet, accent lavandă), temă luminoasă (fundal alb, titluri `#7c3aed`, text negru), JetBrains Mono pentru titluri și butoane, Barlow pentru text, numerele pașilor cu chihlimbar. Fără etichete deasupra titlurilor, fără puncte luminoase, fără em dash, numere fără zero în față. Textul ocupă toată lățimea.
- Fonturile se includ în aplicație, ca să meargă fără internet.
- Subsol: atribuirea listei de nume și „Construit de Raluca Păduraru · upvance”.
- Toate textele din interfață sunt în română.

## 10. Constrângeri

- Totul rulează în browser. Nicio cerere de rețea la rulare (fără CDN, fără fonturi externe, fără analytics).
- Pornire prin dublu-click pe fișier (`file://`), fără server local. O publicare pe Vercel e opțională și se face doar cu OK-ul Ralucăi.
- Bibliotecile terțe au licențe care permit redistribuirea într-un repo public.
- Gata de folosit în demo până pe 10 nov 2026. Construcția începe azi, 1 nov.

## 11. Exemplu pentru demo și teste

- Un transcript de coaching **fictiv**, în română, scris pentru demo: doi vorbitori cu etichete, nume cu diminutive și genitive, un al treilea om din poveste, un telefon, un email, o localitate. Stă în repo, în `exemple/`, în `.docx` și `.md`, ca să-l poată folosi oricine.
- Teste automate pe reguli și pe drumul complet: anonimizare → text modificat ca de un AI (etichete păstrate, unele în variantele de la §7) → dezanonimizare → valorile reale la loc, restul textului identic.
- Înainte de 10 nov, Claude rulează exemplul și raportează exact ce prinde și ce nu.

## 12. Ce rămâne la constructor

- Structura codului și alegerea bibliotecilor (citirea DOCX, PDF, XLSX), cu condiția să meargă offline și din `file://`.
- Dacă livrarea e un singur fișier HTML sau un folder cu `index.html`.
- Sursa listei de localități.
- Regulile exacte și ordinea lor, cât timp respectă prioritatea „să nu scape nimic”.

## 13. Alegerile lui Claude (nu ale Ralucăi), de verificat la citire

- Platforma: pagină în browser, fără instalare, pornită prin dublu-click.
- PDF și DOCX ies ca `.md` la pasul 1.
- Cheia e un fișier JSON separat, plus păstrarea ei în memoria paginii pe durata sesiunii.
- Lista de categorii din §5, inclusiv `FIRMA` și `LOCALITATE`.
- Câmpul „A scăpat ceva?” pune implicit eticheta `PERSOANA`.
- Repo-ul public `raluca-catalyst/paravan`, cu folderul local `C:\Users\keimy\.claude\paravan\`.
- Folosirea termenului „pseudonimizare” în aplicație și în README.

### Lămurite după citirea de verificare (tot alegerile lui Claude)

- **Pragul de acceptare:** transcriptul de demo trece fără nicio scăpare, plus un set separat de cazuri grele scrise de constructor (diminutive, genitive, nume-cuvinte obișnuite, nume la început de rând, două persoane cu același prenume), pe care regulile nu au fost reglate.
- **PDF:** se suportă PDF-urile cu text. Un PDF scanat (fără text) primește un mesaj clar pe ecran („PDF-ul nu are text de citit”), fără eroare. Demo-ul folosește `.docx`, deci PDF-ul nu e critic pentru demo. Biblioteca de PDF trebuie să meargă din `file://` (de exemplu, worker-ul pornit dintr-un blob).
- **DOCX la pasul 3:** drumul principal e `.md` sau text lipit. Ieșirea `.docx` la pasul 3 se face doar când utilizatorul încarcă un `.docx` și e „nice to have”, după tot restul.
- **Cheia:** JSON simplu, fără parolă. Avertismentul de lângă buton rămâne.
- **Același prenume la două persoane:** confidențialitatea câștigă. Un prenume care apare singur și poate fi al mai multor persoane din document primește o etichetă proprie, nu se lasă nemascat. Consecvența (aceeași persoană, aceeași etichetă) se aplică doar când nu e ambiguu.
- **XLSX și CSV:** se păstrează toate foile (inclusiv cele ascunse) și valorile celulelor. Formatarea, formulele și macro-urile nu se păstrează: celulele cu formule ies cu valoarea calculată.
- **Metadate, comentarii, note de subsol:** din `.docx` iese `.md`, deci autorul și proprietățile documentului nu ajung la AI. Textul din notele de subsol, comentarii și antet sau subsol intră în `.md` și trece prin aceleași reguli. Fișierele `.xlsx` ies ca registru nou, fără metadatele originalului.
- **Limba:** reguli pentru texte în română. Interfața e în română.
- **Schița ecranului** încă poartă numele „Anonimizator local”, eticheta „fără internet” și fonturi de la Google. Textul documentului are prioritate: titlul e „Paravan”, fără etichetă, cu fonturile incluse în aplicație.

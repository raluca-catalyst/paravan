# Raport: ce prinde Paravan în exemplul de demo

Data: 2026-11-01
Fișierul: `exemple/sesiune-coaching-fictiva.docx` (sesiune de coaching inventată, ~600 de cuvinte)
Rularea: aceleași module ca pagina (`pseudonymize` din `src/core/`), plus testul din browser (`tests/e2e/flow.spec.js`), care rulează pagina construită pe același fișier.

## Rezumat

Găsite: 8 nume, 1 localitate, 1 telefon, 1 email. **Nimic din ce identifică persoanele n-a scăpat.** Testul `tests/acceptance.test.js` verifică asta la fiecare rulare.

## Ce s-a ascuns corect

| Eticheta | Valoarea | Observație |
|---|---|---|
| `[PERSOANA_1]` | Ioana | clienta, forma folosită cel mai des |
| `[PERSOANA_1_B]` | Ioana Mărgineanu | aceeași persoană, forma completă; se pune la loc exact |
| `lui [PERSOANA_1]` | Ioanei | genitivul devine „lui …”, ca textul scris de AI să rămână corect gramatical |
| `[PERSOANA_2]` | Sârbu | șeful, prins și la început de propoziție |
| `[PERSOANA_3]` | Vlad | partenerul |
| `[PERSOANA_5]`, `[PERSOANA_5_B]` | Cosmina Dragomir, Cosmina | recruiterul, plus genitivul „Cosminei” |
| `[PERSOANA_6]` | Ioni | diminutivul clientei |
| `[LOCALITATE_1]` | Brașov | |
| `[TELEFON_1]` | 0745 318 902 | |
| `[EMAIL_1]` | cosmina.dragomir@exemplu-recrutare.ro | |

## Etichete în plus (fals pozitive, acceptate prin varianta prudentă)

| Eticheta | Cuvântul | De ce |
|---|---|---|
| `[PERSOANA_4]` | Recruiterul | împrumut din engleză, la început de propoziție, lipsește din lista de cuvinte |
| `[PERSOANA_7]` | Restructurarea | cuvânt rar la început de propoziție, lipsește din lista de cuvinte |
| `[PERSOANA_8]` | Spuneai | formă verbală rară, lipsește din lista de cuvinte |

Am încercat să le reduc cu dicționarul românesc complet, folosit la rulare. Am renunțat: dicționarul acceptă „sârbu” ca pe un cuvânt, deci „Sârbu m-a ascultat” ar fi scăpat nemascat.

## Ce rămâne vizibil, cum era de așteptat

- **Detaliul unic din poveste:** „sunt singura femeie din echipa de conducere”. Regulile nu-l pot prinde, iar aplicația spune asta pe ecran („Verifică povestea, nu doar numele”). Poate fi un exemplu bun în panel.
- „Ioni” primește altă etichetă decât „Ioana”, deci AI-ul nu știe că e aceeași persoană. Confidențialitatea nu e afectată.

## Dus-întors

Fără modificări făcute de AI, dezanonimizarea reface textul identic, cu o singură diferență: genitivele („Ioanei”, „Cosminei”) revin ca „lui Ioana”, „lui Cosmina”.

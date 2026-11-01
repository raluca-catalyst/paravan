# Datele folosite de Paravan

Codul aplicației are licența MIT (vezi `LICENSE`). Listele de mai jos vin din surse publice și își păstrează licențele lor. Fișierele generate stau în `src/detect/data/` și se refac cu `npm run fetch-data`.

| Fișier | Sursa | Licența |
|---|---|---|
| `first_female.json`, `first_male.json`, `surnames.json` | [romanian-names-db](https://github.com/andyhatestheworld/romanian-names-db), de andyhatestheworld | CC BY 4.0 |
| `localities.json` | [romania/localitati](https://github.com/romania/localitati), fișierul `orase.csv` | WTFPL |
| `common_words.json`, `name_common_words.json` | [FrequencyWords](https://github.com/hermitdave/FrequencyWords), de Hermit Dave, lista `ro_50k` (2018), filtrată cu dicționarul românesc hunspell din [dictionary-ro](https://github.com/wooorm/dictionaries) | lista: CC BY-SA 4.0; dicționarul folosit doar la filtrare: GPL-2.0 sau LGPL-2.1 sau MPL-1.1 |
| `diminutive.json` | scris de mână pentru Paravan | MIT |

Fișierele derivate din FrequencyWords (`common_words.json`, `name_common_words.json`) se distribuie sub CC BY-SA 4.0.

// Datele folosite de reguli. Toate seturile țin valori trecute prin fold().
import female from './first_female.json' with { type: 'json' };
import male from './first_male.json' with { type: 'json' };
import surnames from './surnames.json' with { type: 'json' };
import diminutive from './diminutive.json' with { type: 'json' };
import common from './common_words.json' with { type: 'json' };
import nameCommon from './name_common_words.json' with { type: 'json' };
import nameCommonFrequent from './name_common_frequent.json' with { type: 'json' };
import localities from './localities.json' with { type: 'json' };
import { fold } from '../normalize.js';

export const FIRST_FEMALE = new Set(female);
export const FIRST_MALE = new Set(male);
export const SURNAMES = new Set(surnames);
export const DIMINUTIVES = new Set(diminutive.map(fold));
export const COMMON_WORDS = new Set(common);
// Nume care sunt și cuvinte obișnuite (Floare, Lupu, Negru): se prind doar în anumite poziții.
export const NAME_COMMON_WORDS = new Set(nameCommon);
// Dintre ele, cele foarte frecvente („din”, „mare”, „gata”): scutite la început de propoziție.
export const NAME_COMMON_FREQUENT = new Set(nameCommonFrequent);
// Ortografia originală, cele mai lungi primele.
export const LOCALITIES = localities;

export const ROLE_LABELS = new Set([
  'coach', 'client', 'clientă', 'consilier', 'consilieră', 'moderator', 'moderatoare', 'intervievator',
  'vorbitor', 'participant', 'participantă', 'facilitator', 'eu', 'tu', 'speaker', 'mentor', 'terapeut',
].map(fold));

export const ALLOWLIST = new Set([
  'AI', 'GDPR', 'UE', 'CV', 'HR', 'IT', 'OK', 'ChatGPT', 'Copilot', 'Gemini', 'Excel', 'Word', 'PowerPoint',
  'Teams', 'Zoom', 'Google', 'Microsoft', 'LinkedIn', 'WhatsApp', 'Facebook', 'Instagram', 'România', 'Europa',
].map(fold));

// Acronime de 4-5 litere care nu se ascund (cele de 2-3 litere scrise cu majuscule nu se ascund oricum).
export const ACRONYMS = new Set(['ANAF', 'CNAS', 'CASS', 'ANOFM', 'ONRC', 'DGASPC', 'UNSTPB', 'SMURD', 'NATO', 'GDPR', 'SAAS', 'HTML', 'JSON', 'EXCEL', 'WORD'].map(fold));

// Titluri și forme de adresare după care urmează un nume.
export const HINTS = new Set(['dl', 'dna', 'd-l', 'd-na', 'domnul', 'doamna', 'domnului', 'doamnei', 'dr', 'dra', 'd-ra', 'domnisoara',
  'ing', 'av', 'prof', 'conf', 'lect', 'asist', 'ec', 'jr', 'col', 'mr', 'mrs', 'ms', 'sr']);

// Etichete de câmp („Nume: …”) după care urmează un nume.
export const FIELD_LABELS = new Set(['nume', 'prenume', 'numele', 'client', 'clientul', 'clienta', 'beneficiar', 'beneficiarul',
  'angajat', 'angajatul', 'angajata', 'pacient', 'pacientul', 'pacienta', 'persoana', 'contact', 'titular', 'titularul',
  'solicitant', 'candidat', 'candidatul', 'candidata', 'elev', 'elevul', 'eleva', 'student', 'studentul', 'studenta',
  'parinte', 'tutore', 'semnat', 'responsabil'].map(fold));

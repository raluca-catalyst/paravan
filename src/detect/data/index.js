// Datele folosite de reguli. Toate seturile țin valori trecute prin fold().
import female from './first_female.json' with { type: 'json' };
import male from './first_male.json' with { type: 'json' };
import surnames from './surnames.json' with { type: 'json' };
import diminutive from './diminutive.json' with { type: 'json' };
import common from './common_words.json' with { type: 'json' };
import nameCommon from './name_common_words.json' with { type: 'json' };
import localities from './localities.json' with { type: 'json' };
import { fold } from '../normalize.js';

export const FIRST_FEMALE = new Set(female);
export const FIRST_MALE = new Set(male);
export const SURNAMES = new Set(surnames);
export const DIMINUTIVES = new Set(diminutive.map(fold));
export const COMMON_WORDS = new Set(common);
// Nume care sunt și cuvinte obișnuite (Floare, Lupu, Negru): se prind doar în anumite poziții.
export const NAME_COMMON_WORDS = new Set(nameCommon);
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

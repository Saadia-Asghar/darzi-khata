import type { Measurements } from '../types/order';

const roman = [
  'ek', 'do', 'teen', 'char', 'paanch', 'chhe', 'saat', 'aath', 'nau', 'das',
  'gyarah', 'barah', 'terah', 'chaudah', 'pandrah', 'solah', 'satrah', 'atharah', 'unnees', 'bees',
  'ikkees', 'baees', 'teis', 'chaubees', 'pachees', 'chhabbees', 'sattaees', 'atthaees', 'untees', 'tees',
  'ikattees', 'battees', 'taintees', 'chauntees', 'paintees', 'chhattees', 'saintees', 'arthees', 'untalees', 'chalees',
  'iktalees', 'bayalees', 'taintalees', 'chawalees', 'paintalees', 'chiyalees', 'saintalees', 'artalees', 'unchas', 'pachas',
  'ikyawan', 'bawan', 'tirpan', 'chauwan', 'pachpan', 'chhappan', 'sattawan', 'atthawan', 'unsath', 'saath',
];
const urdu = [
  'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو', 'دس',
  'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس', 'بیس',
  'اکیس', 'بائیس', 'تئیس', 'چوبیس', 'پچیس', 'چھبیس', 'ستائیس', 'اٹھائیس', 'انتیس', 'تیس',
  'اکتیس', 'بتیس', 'تینتیس', 'چونتیس', 'پینتیس', 'چھتیس', 'سینتیس', 'اڑتیس', 'انتالیس', 'چالیس',
  'اکتالیس', 'بیالیس', 'تینتالیس', 'چوالیس', 'پینتالیس', 'چھیالیس', 'سینتالیس', 'اڑتالیس', 'انچاس', 'پچاس',
  'اکیاون', 'باون', 'ترپن', 'چون', 'پچپن', 'چھپن', 'ستاون', 'اٹھاون', 'انسٹھ', 'ساٹھ',
];
const english = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const words = new Map<string, number>();
[roman, urdu, english].forEach(list => list.forEach((word, i) => words.set(word, i + 1)));
Object.entries({
  aik: 1, paanch: 5, panch: 5, che: 6, chay: 6, aat: 8, gyara: 11, bara: 12,
  tera: 13, choda: 14, pandra: 15, sola: 16, satra: 17, athara: 18, unnis: 19,
  bis: 20, ikkis: 21, bais: 22, baais: 22, teees: 23, chobis: 24, pachis: 25,
  chabbis: 26, satais: 27, athais: 28, untis: 29, tis: 30, ikatis: 31,
  battis: 32, taintis: 33, chauntis: 34, paintis: 35, chhattis: 36, saintis: 37,
  arthis: 38, untalis: 39, chalis: 40, chaalis: 40, iktalis: 41, bayalis: 42,
  taintalis: 43, chawalis: 44, paintalis: 45, chiyalis: 46, saintalis: 47,
  artalis: 48, unchaas: 49, pachaas: 50, ikyavan: 51, baawan: 52, tirpan: 53,
  chauvan: 54, pachpan: 55, chappan: 56, sattavan: 57, athavan: 58, unsath: 59, sath: 60,
  thirty: 30, forty: 40, fifty: 50, sixty: 60,
  'بایس': 22, 'تئیس': 23, 'تئس': 23,
}).forEach(([word, value]) => words.set(word, value));

function clean(text: string): string {
  return text.toLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[۰-۹]/g, n => String(n.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, n => String(n.charCodeAt(0) - 0x0660))
    .replace(/[,،؛;:!؟?\n\-]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function parseSpokenNumber(text: string): number | undefined {
  const tokens = clean(text).split(' ');
  let value: number | undefined;
  let half = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (['saadhe', 'sadhe', 'saarhe', 'sare', 'ساڑھے', 'ساڈھے', 'aadha', 'adha', 'آدھا', 'آدھی', 'half'].includes(token)) {
      half = true;
      continue;
    }
    if (/^\d+(?:\.\d+)?$/.test(token)) { value = Number(token); break; }
    if (words.has(token)) {
      value = words.get(token)!;
      // English compound number: forty two.
      if (['twenty', 'thirty', 'forty', 'fifty'].includes(token) && (words.get(tokens[i + 1]) || 10) < 10)
        value += words.get(tokens[i + 1])!;
      break;
    }
  }
  half ||= tokens.some(t => ['aadha', 'adha', 'آدھا', 'آدھی', 'half'].includes(t));
  if (value === undefined) return undefined;
  value += half ? 0.5 : 0;
  return value >= 1 && value <= 60.5 ? value : undefined;
}
const fields: [keyof Measurements, string[]][] = [
  ['shalwarLambai', ['shalwar lambai', 'shalwar length', 'trouser length', 'شلوار لمبائی', 'شلوار کی لمبائی']],
  ['shalwarGhera', ['shalwar ghera', 'trouser width', 'شلوار گھیرا']],
  ['kameezLambai', ['kameez lambai', 'kameez length', 'lambai', 'lambayi', 'length', 'لمبائی', 'لمبای']],
  ['chhaati', ['chhaati', 'chaati', 'chati', 'chest', 'چھاتی', 'سینہ']],
  ['bazu', ['bazu', 'baazu', 'sleeve', 'sleeves', 'بازو']],
  ['teera', ['teera', 'tera', 'shoulder', 'shoulders', 'تیرا', 'تیرہ', 'کندھا']],
  ['gala', ['gala', 'neck', 'collar', 'گلا']],
  ['kamar', ['kamar', 'waist', 'کمر']],
  ['ghera', ['ghera', 'hem', 'گھیرا', 'گھیر']],
  ['paincha', ['paincha', 'pancha', 'bottom', 'پائنچہ', 'پانچہ']],
  ['asan', ['asan', 'aasan', 'crotch', 'آسن', 'آسان']],
];
export function parseVoiceMeasurements(text: string): Partial<Measurements> {
  const normalized = ` ${clean(text)} `;
  const aliases = fields.flatMap(([field, names]) => names.map(name => ({ field, alias: clean(name) })))
    .sort((a, b) => b.alias.length - a.alias.length);
  const pattern = new RegExp(`(?<=\\s)(${aliases.map(a => a.alias).join('|')})(?=\\s)`, 'gu');
  const matches = [...normalized.matchAll(pattern)];
  const output: Partial<Measurements> = {};
  matches.forEach((match, i) => {
    const field = aliases.find(a => a.alias === match[1])!.field;
    const segment = normalized.slice(match.index! + match[0].length, matches[i + 1]?.index ?? normalized.length);
    const value = parseSpokenNumber(segment);
    if (value !== undefined) output[field] = value;
  });
  return output;
}

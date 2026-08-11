import type { LocalContext } from '../types'
import { ALL_COUNTRIES } from './countries'

export interface CountryPreset {
  code: string
  name: string
  currency: { code: string; symbol: string; name: string }
  commonLanguages: string[]
  curriculumBody?: string
  examBoards?: string[]
  examples: {
    foods: string[]
    names: string[]
    landmarks: string[]
  }
}

/** Rich local-context packs (curriculum, foods, names). Kept for African markets. */
export const COUNTRY_PRESETS: CountryPreset[] = [
  {
    code: 'NG',
    name: 'Nigeria',
    currency: { code: 'NGN', symbol: '₦', name: 'Naira' },
    commonLanguages: ['Hausa', 'Yoruba', 'Igbo', 'Pidgin'],
    curriculumBody: 'NERDC',
    examBoards: ['WAEC', 'NECO', 'JAMB'],
    examples: {
      foods: ['jollof rice', 'eba', 'pounded yam', 'akara', 'plantain', 'egusi soup', 'suya'],
      names: ['Adebayo', 'Chioma', 'Fatima', 'Tunde', 'Aisha', 'Emeka', 'Ngozi'],
      landmarks: ['the village market', 'the compound', 'the borehole', 'mosque', 'church'],
    },
  },
  {
    code: 'KE',
    name: 'Kenya',
    currency: { code: 'KES', symbol: 'KSh', name: 'Shilling' },
    commonLanguages: ['Swahili', 'Kikuyu', 'Luo', 'Luhya'],
    curriculumBody: 'KICD',
    examBoards: ['KCPE', 'KCSE'],
    examples: {
      foods: ['ugali', 'sukuma wiki', 'chapati', 'githeri', 'mandazi', 'nyama choma'],
      names: ['Wanjiru', 'Otieno', 'Kamau', 'Akinyi', 'Mwangi', 'Achieng'],
      landmarks: ['the matatu stage', 'the shamba', 'the dukas', 'the chief\'s camp'],
    },
  },
  {
    code: 'GH',
    name: 'Ghana',
    currency: { code: 'GHS', symbol: '₵', name: 'Cedi' },
    commonLanguages: ['Twi', 'Ga', 'Ewe', 'Hausa'],
    curriculumBody: 'NaCCA',
    examBoards: ['BECE', 'WASSCE'],
    examples: {
      foods: ['jollof rice', 'fufu', 'banku', 'kenkey', 'waakye', 'red red'],
      names: ['Kwame', 'Akosua', 'Yaw', 'Ama', 'Kofi', 'Abena'],
      landmarks: ['the trotro stop', 'the chop bar', 'the durbar grounds'],
    },
  },
  {
    code: 'ZA',
    name: 'South Africa',
    currency: { code: 'ZAR', symbol: 'R', name: 'Rand' },
    commonLanguages: ['Zulu', 'Xhosa', 'Afrikaans', 'Sotho', 'Tswana'],
    curriculumBody: 'CAPS',
    examBoards: ['NSC (Matric)'],
    examples: {
      foods: ['pap', 'biltong', 'bunny chow', 'boerewors', 'chakalaka', 'morogo'],
      names: ['Thabo', 'Nomvula', 'Sipho', 'Lerato', 'Bongani', 'Nandi'],
      landmarks: ['the township', 'the spaza shop', 'the kraal', 'the taxi rank'],
    },
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    currency: { code: 'TZS', symbol: 'TSh', name: 'Shilling' },
    commonLanguages: ['Swahili', 'Sukuma', 'Chagga'],
    curriculumBody: 'TIE',
    examBoards: ['NECTA'],
    examples: {
      foods: ['ugali', 'pilau', 'chapati', 'mandazi', 'mishkaki', 'wali na maharage'],
      names: ['Juma', 'Amina', 'Hamisi', 'Zainabu', 'Salim', 'Neema'],
      landmarks: ['the daladala stop', 'the soko', 'the shamba'],
    },
  },
  {
    code: 'UG',
    name: 'Uganda',
    currency: { code: 'UGX', symbol: 'USh', name: 'Shilling' },
    commonLanguages: ['Luganda', 'Swahili', 'Runyankole'],
    curriculumBody: 'NCDC',
    examBoards: ['UNEB'],
    examples: {
      foods: ['matooke', 'posho', 'groundnut sauce', 'rolex', 'luwombo', 'cassava'],
      names: ['Nakato', 'Wasswa', 'Babirye', 'Kato', 'Namuli', 'Ssemakula'],
      landmarks: ['the boda stage', 'the trading centre', 'the shamba'],
    },
  },
  {
    code: 'RW',
    name: 'Rwanda',
    currency: { code: 'RWF', symbol: 'FRw', name: 'Franc' },
    commonLanguages: ['Kinyarwanda', 'French', 'Swahili'],
    curriculumBody: 'REB',
    examples: {
      foods: ['ubugali', 'isombe', 'inyama', 'ibirayi', 'amasaka'],
      names: ['Mukamana', 'Habimana', 'Uwase', 'Niyonzima', 'Ishimwe'],
      landmarks: ['the umudugudu', 'the marketplace', 'the hill'],
    },
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    currency: { code: 'ETB', symbol: 'Br', name: 'Birr' },
    commonLanguages: ['Amharic', 'Oromo', 'Tigrinya'],
    curriculumBody: 'MoE Ethiopia',
    examples: {
      foods: ['injera', 'doro wat', 'tibs', 'shiro', 'kitfo', 'beyainatu'],
      names: ['Abebe', 'Selamawit', 'Bekele', 'Hiwot', 'Dawit', 'Genet'],
      landmarks: ['the gebeya (market)', 'the kebele', 'the highlands'],
    },
  },
  {
    code: 'SN',
    name: 'Senegal',
    currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' },
    commonLanguages: ['Wolof', 'French', 'Pulaar', 'Serer'],
    examples: {
      foods: ['thieboudienne', 'yassa', 'mafé', 'pastels', 'thiakry'],
      names: ['Aminata', 'Mamadou', 'Fatou', 'Ousmane', 'Awa', 'Cheikh'],
      landmarks: ['le marché', 'la mosquée', 'le baobab', 'le village'],
    },
  },
  {
    code: 'CM',
    name: 'Cameroon',
    currency: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc' },
    commonLanguages: ['French', 'English', 'Fulfulde', 'Ewondo'],
    examples: {
      foods: ['ndolé', 'eru', 'achu', 'ekwang', 'koki', 'fufu corn'],
      names: ['Ngono', 'Tchamba', 'Aïcha', 'Manga', 'Etienne', 'Bih'],
      landmarks: ['le marché', 'the chefferie', 'the plantation'],
    },
  },
  {
    code: 'CI',
    name: "Côte d'Ivoire",
    currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' },
    commonLanguages: ['French', 'Dioula', 'Baoulé'],
    examples: {
      foods: ['attiéké', 'garba', 'foutou', 'kedjenou', 'alloco'],
      names: ['Aya', 'Kouadio', 'Adjoua', 'Yao', 'Affoué'],
      landmarks: ['le marché', 'le maquis', 'la cour'],
    },
  },
  {
    code: 'ZM',
    name: 'Zambia',
    currency: { code: 'ZMW', symbol: 'K', name: 'Kwacha' },
    commonLanguages: ['Bemba', 'Nyanja', 'Tonga', 'Lozi'],
    curriculumBody: 'ECZ',
    examples: {
      foods: ['nshima', 'ifisashi', 'kapenta', 'munkoyo', 'chikanda'],
      names: ['Mwansa', 'Bwalya', 'Chanda', 'Mutinta', 'Lubuto'],
      landmarks: ['the compound', 'the boma', 'the village'],
    },
  },
  {
    code: 'ZW',
    name: 'Zimbabwe',
    currency: { code: 'USD', symbol: '$', name: 'US Dollar' },
    commonLanguages: ['Shona', 'Ndebele', 'English'],
    curriculumBody: 'ZIMSEC',
    examples: {
      foods: ['sadza', 'dovi', 'muriwo', 'mapopo', 'nyama'],
      names: ['Tendai', 'Chipo', 'Tatenda', 'Rufaro', 'Munashe'],
      landmarks: ['the kraal', 'the growth point', 'the dam'],
    },
  },
  {
    code: 'EG',
    name: 'Egypt',
    currency: { code: 'EGP', symbol: 'E£', name: 'Pound' },
    commonLanguages: ['Arabic'],
    examples: {
      foods: ['koshari', 'foul medames', 'taameya', 'molokhia', 'mahshi'],
      names: ['Ahmed', 'Fatma', 'Mohamed', 'Aisha', 'Omar', 'Layla'],
      landmarks: ['the souk', 'the Nile', 'the mosque'],
    },
  },
  {
    code: 'MA',
    name: 'Morocco',
    currency: { code: 'MAD', symbol: 'DH', name: 'Dirham' },
    commonLanguages: ['Arabic', 'Berber (Tamazight)', 'French'],
    examples: {
      foods: ['tagine', 'couscous', 'pastilla', 'harira', 'msemen'],
      names: ['Youssef', 'Khadija', 'Hassan', 'Salma', 'Karim', 'Amina'],
      landmarks: ['the medina', 'the souk', 'the riad'],
    },
  },
]

const PRESET_BY_CODE = new Map(COUNTRY_PRESETS.map((p) => [p.code, p]))

/** Dropdown options: every ISO country, sorted by English name. */
export const COUNTRY_OPTIONS: { value: string; label: string }[] = ALL_COUNTRIES.map((c) => ({
  value: c.code,
  label: PRESET_BY_CODE.get(c.code)?.name ?? c.name,
}))

function basicPreset(code: string, name: string): CountryPreset {
  return {
    code,
    name,
    currency: { code: '', symbol: '', name: 'local currency' },
    commonLanguages: [],
    examples: { foods: [], names: [], landmarks: [] },
  }
}

export function getCountryPreset(code?: string): CountryPreset | undefined {
  if (!code) return undefined
  const rich = PRESET_BY_CODE.get(code)
  if (rich) return rich
  const base = ALL_COUNTRIES.find((c) => c.code === code)
  if (!base) return undefined
  return basicPreset(base.code, base.name)
}

export function extractLocalContext(settings: {
  country?: string
  region?: string
  localLanguage?: string
}): LocalContext {
  return {
    country: settings.country,
    region: settings.region,
    localLanguage: settings.localLanguage,
  }
}

export function buildLocalContextSection(ctx?: LocalContext): string {
  if (!ctx?.country) return ''
  const preset = getCountryPreset(ctx.country)
  if (!preset) return ''

  const lines: string[] = ['LOCAL CONTEXT (use these in all examples):']
  lines.push(`- Country: ${preset.name}`)
  if (ctx.region) lines.push(`- Region: ${ctx.region}`)

  if (preset.currency.code) {
    lines.push(
      `- Currency: ${preset.currency.name} (${preset.currency.symbol}, ${preset.currency.code}) — use ${preset.currency.name} for any money examples`,
    )
  } else {
    lines.push(
      `- Currency: use the local currency of ${preset.name} for any money examples (do not default to USD or EUR unless that is truly local)`,
    )
  }

  if (ctx.localLanguage) {
    lines.push(
      `- Local language: ${ctx.localLanguage} — you may include key ${ctx.localLanguage} terms in parentheses for clarity`,
    )
  }
  if (preset.examBoards?.length) {
    lines.push(
      `- National exams: ${preset.examBoards.join(', ')} — match question style to these where relevant`,
    )
  }
  if (preset.curriculumBody) {
    lines.push(`- Curriculum body: ${preset.curriculumBody}`)
  }
  if (preset.examples.foods.length) {
    lines.push(`- Familiar foods to reference: ${preset.examples.foods.join(', ')}`)
  }
  if (preset.examples.names.length) {
    lines.push(
      `- Names to use for student/character examples: ${preset.examples.names.join(', ')}`,
    )
  }
  if (preset.examples.landmarks.length) {
    lines.push(`- Settings/landmarks: ${preset.examples.landmarks.join(', ')}`)
  }
  if (!preset.examples.foods.length) {
    lines.push(
      `- Use culturally appropriate local foods, names, and everyday settings for ${preset.name}`,
    )
  }
  lines.push(
    '- Avoid Western-only references (no pizza, dollars, snow, dishwashers, school buses, etc.) unless specifically relevant to this country.',
  )

  return lines.join('\n')
}

export type SubmissionCategory = 'Materials' | 'Items' | 'Armour Sets';

export type SubmissionLineItem = {
  id: number;
  category: SubmissionCategory;
  subcategory: string;
  name: string;
  quantity: string;
  unit: string;
  quality: string;
  details: string;
  entryMethod: 'catalog' | 'manual';
};

export type CatalogEntry = {
  category: SubmissionCategory;
  subcategory: string;
  name: string;
  defaultUnit: string;
  aliases?: string[];
  manufacturer?: string;
  source?: 'official' | 'community' | 'curated';
};

export type MaterialQualityLevel = 'High' | 'Medium' | 'Low';

type MaterialQualityRule = {
  keywords: string[];
  baseScore: number;
  reason: string;
};

export const logisticsCatalog: CatalogEntry[] = [
  { category: 'Materials', subcategory: 'Gemstones', name: 'Aphorite', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Gemstones', name: 'Hadanite', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Gemstones', name: 'Dolivine', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Bexalite Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Quantanium Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Taranite Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Agricium Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Laranite Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Borase Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Beryl Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Hephaestanite Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Gold Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Copper Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Titanium Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Diamond Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Raw Ore', name: 'Corundum Ore', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Refined Metal', name: 'Refined Quantanium', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Refined Metal', name: 'Refined Taranite', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Refined Metal', name: 'Refined Agricium', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Refined Metal', name: 'Refined Laranite', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Refined Metal', name: 'Refined Gold', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Industrial', name: 'Aluminum', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Industrial', name: 'Steel', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Industrial', name: 'Silicon', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Industrial', name: 'Titanium', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Industrial', name: 'Tungsten', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Salvage', name: 'Construction Materials', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Salvage', name: 'Recycled Material Composite', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Salvage', name: 'Scrap', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Gas', name: 'Hydrogen', defaultUnit: 'SCU' },
  { category: 'Materials', subcategory: 'Gas', name: 'Helium', defaultUnit: 'SCU' },

  { category: 'Items', subcategory: 'Weapons', name: 'P4-AR Rifle', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Weapons', name: 'FS-9 LMG', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Weapons', name: 'C54 SMG', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Weapons', name: 'Arrowhead Sniper Rifle', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Ammunition', name: 'Rail Gun Cartridges', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Ammunition', name: 'P4-AR Magazine', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Ammunition', name: 'C54 Magazine', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Medical', name: 'MedPen', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Medical', name: 'Multi-Tool Med Attachment', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Ship Components', name: 'Fusion Thruster Core', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Ship Components', name: 'Size 2 Shield Generator', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Ship Components', name: 'Size 3 Cooler', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Utility', name: 'Pyro RYT Multi-Tool', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Utility', name: 'Tractor Beam Attachment', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Utility', name: 'Mined Material Container', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Electronics', name: 'Mobiglas Battery Pack', defaultUnit: 'units' },
  { category: 'Items', subcategory: 'Electronics', name: 'Power Coupler', defaultUnit: 'units' },

  { category: 'Armour Sets', subcategory: 'Light Armour', name: 'Inquisitor Light Set', defaultUnit: 'sets' },
  { category: 'Armour Sets', subcategory: 'Light Armour', name: 'Pembroke Light Set', defaultUnit: 'sets' },
  { category: 'Armour Sets', subcategory: 'Medium Armour', name: 'ORC-mkX Medium Set', defaultUnit: 'sets' },
  { category: 'Armour Sets', subcategory: 'Medium Armour', name: 'Defiance Medium Set', defaultUnit: 'sets' },
  { category: 'Armour Sets', subcategory: 'Heavy Armour', name: 'Morozov Heavy Set', defaultUnit: 'sets' },
  { category: 'Armour Sets', subcategory: 'Heavy Armour', name: 'Novikov Heavy Set', defaultUnit: 'sets' },
  { category: 'Armour Sets', subcategory: 'Heavy Armour', name: 'ADP-mk4 Heavy Set', defaultUnit: 'sets' },
  { category: 'Armour Sets', subcategory: 'Specialized', name: 'Calico Tactical Set', defaultUnit: 'sets' },
  { category: 'Armour Sets', subcategory: 'Specialized', name: 'DustUp Tactical Set', defaultUnit: 'sets' },
];

export const submissionCategories: SubmissionCategory[] = ['Materials', 'Items', 'Armour Sets'];

export const categorySubcategories = logisticsCatalog.reduce<Record<SubmissionCategory, string[]>>(
  (acc, entry) => {
    if (!acc[entry.category].includes(entry.subcategory)) {
      acc[entry.category].push(entry.subcategory);
    }
    return acc;
  },
  {
    Materials: [],
    Items: [],
    'Armour Sets': [],
  }
);

export const getDefaultUnitForCategory = (category: SubmissionCategory) => {
  if (category === 'Materials') {
    return 'SCU';
  }

  if (category === 'Armour Sets') {
    return 'sets';
  }

  return 'units';
};

export const oreQualityOptions = [
  'Trace seam (<10% ore, very high inert)',
  'Low concentration (10-24% ore)',
  'Workable concentration (25-39% ore)',
  'Rich concentration (40-59% ore)',
  'Exceptional concentration (60%+ ore)',
  'Volatile Quantanium mix (stability watch)',
  'Unrated / mixed load',
];

export const refineryOutputQualityOptions = [
  'Industrial grade (high inert carryover)',
  'Commercial grade (balanced yield)',
  'High-purity grade (premium sale)',
  'Spec grade (top-tier purity)',
  'Volatile stabilized lot (quantanium-safe)',
  'Contaminated refinery output',
];

export const incomingMaterialsRequireRefining = true;

const materialQualityRules: MaterialQualityRule[] = [
  {
    keywords: ['quantanium', 'janalite', 'bexalite', 'taranite'],
    baseScore: 88,
    reason: 'High-value refinery feedstock',
  },
  {
    keywords: ['agricium', 'laranite', 'gold', 'diamond'],
    baseScore: 78,
    reason: 'Strong-value ore for refining runs',
  },
  {
    keywords: ['hadanite', 'aphorite', 'dolivine', 'beryl', 'borase', 'hephaestanite'],
    baseScore: 72,
    reason: 'Reliable mining yield profile',
  },
  {
    keywords: ['recycled material composite', 'construction materials', 'scrap'],
    baseScore: 66,
    reason: 'Construction-oriented refinery/salvage stock',
  },
  {
    keywords: ['titanium', 'tungsten', 'aluminum', 'silicon', 'corundum', 'copper'],
    baseScore: 58,
    reason: 'Industrial bulk material stock',
  },
  {
    keywords: ['hydrogen', 'helium'],
    baseScore: 52,
    reason: 'Gas commodity stock with lower margin stability',
  },
];

export const getMaterialQualityScore = (
  materialName: string,
  availableRatio: number,
  reservedRatio: number
) => {
  const normalizedName = materialName.toLowerCase();

  const matchedRule =
    materialQualityRules.find((rule) =>
      rule.keywords.some((keyword) => normalizedName.includes(keyword))
    ) ?? {
      baseScore: 55,
      reason: 'General material quality baseline',
    };

  const availabilityBonus = availableRatio >= 0.75 ? 8 : availableRatio >= 0.45 ? 3 : -6;
  const reservationPenalty = reservedRatio >= 0.6 ? 8 : reservedRatio >= 0.35 ? 4 : 0;

  const score = Math.max(0, Math.min(100, matchedRule.baseScore + availabilityBonus - reservationPenalty));

  let quality: MaterialQualityLevel = 'Low';
  let color = '#fda4af';

  if (score >= 75) {
    quality = 'High';
    color = '#86efac';
  } else if (score >= 55) {
    quality = 'Medium';
    color = '#fcd34d';
  }

  return {
    score,
    quality,
    color,
    reason: matchedRule.reason,
  };
};

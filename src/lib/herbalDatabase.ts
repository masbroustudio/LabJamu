/**
 * Indonesian Ethnopharmacology Scientific Knowledge Base (English)
 * Provides verified botanical, phytochemical, and topical dermatological profiles.
 */

export interface HerbProfile {
  id: string
  commonName: string
  botanicalName: string
  family: string
  traditionalUse: string
  activePhytochemicals: string[]
  topicalBioactivity: {
    hydration: string
    erythemaModulation: string
    textureRefinement: string
    antioxidantGlow: string
  }
  patchTestProtocol: string
  safetyContraindications: string
}

export const ETHNOPHARMACOLOGY_HERBS: Record<string, HerbProfile> = {
  temugiring: {
    id: 'temugiring',
    commonName: 'Temugiring (Yellow Zedory)',
    botanicalName: 'Curcuma heyneana Valeton & Zijp',
    family: 'Zingiberaceae',
    traditionalUse: 'Traditional Royal Javanese body scrub (Lulur) and facial cooling paste for skin brightening and refinement.',
    activePhytochemicals: ['Curcuminoids', 'Germacrone', 'Dehydrocurdione', 'Flavonoids', 'Tannins'],
    topicalBioactivity: {
      hydration: 'Reinforces epidermal moisture barrier via mild lipid replenishment.',
      erythemaModulation: 'Potent sesquiterpenoid anti-inflammatory action inhibits NF-κB pathways.',
      textureRefinement: 'Natural keratolytic action gently exfoliates stratum corneum roughness.',
      antioxidantGlow: 'Scavenges free radicals, promoting natural skin evenness without melanin bleaching.',
    },
    patchTestProtocol: 'Apply paste behind earlobe or inner forearm for 24 hours. Check for redness or itching.',
    safetyContraindications: 'Contraindicated during active contact dermatitis flare-ups or open micro-abrasions.',
  },
  beras_putih: {
    id: 'beras_putih',
    commonName: 'White Rice (Beras Dingin)',
    botanicalName: 'Oryza sativa L.',
    family: 'Poaceae',
    traditionalUse: 'Bedak Dingin (cooling overnight mask) traditionally used in Sumatra and Java to soothe sunburn and smooth rough skin.',
    activePhytochemicals: ['Oryzanol', 'Ferulic Acid', 'Gamma-Aminobutyric Acid (GABA)', 'Allantoin', 'Ceramides'],
    topicalBioactivity: {
      hydration: 'High concentration of natural starches and ceramides seals transepidermal water loss (TEWL).',
      erythemaModulation: 'Allantoin and cooling starches calm UV-induced erythema and heat sensation.',
      textureRefinement: 'Micro-crystalline rice granules provide non-abrasive pore smoothing.',
      antioxidantGlow: 'Ferulic acid stabilizes skin tone and reduces oxidative dullness.',
    },
    patchTestProtocol: 'Generally hypoallergenic. Test for 12 hours on inner forearm.',
    safetyContraindications: 'Ensure rice is thoroughly rinsed to eliminate potential agricultural residue.',
  },
  pegagan: {
    id: 'pegagan',
    commonName: 'Pegagan (Gotu Kola)',
    botanicalName: 'Centella asiatica (L.) Urb.',
    family: 'Apiaceae',
    traditionalUse: 'Used across Sundanese and Javanese traditional medicine for wound healing, scar reduction, and cooling tisanes.',
    activePhytochemicals: ['Madecassoside', 'Asiaticoside', 'Madecassic Acid', 'Asiatic Acid'],
    topicalBioactivity: {
      hydration: 'Stimulates hyaluronic acid synthesis in basal keratinocytes.',
      erythemaModulation: 'Superb suppression of interleukin-6 (IL-6), rapidly calming redness.',
      textureRefinement: 'Upregulates type I collagen synthesis, improving skin firmness and microrelief.',
      antioxidantGlow: 'Normalizes microcirculation for healthy oxygenated skin glow.',
    },
    patchTestProtocol: '24-hour patch test on forearm.',
    safetyContraindications: 'Very well tolerated. Avoid mixing with high-strength synthetic chemical acids.',
  },
  kunyit: {
    id: 'kunyit',
    commonName: 'Turmeric (Kunyit)',
    botanicalName: 'Curcuma longa L.',
    family: 'Zingiberaceae',
    traditionalUse: 'Central component of Jamu Kunyit Asam and protective body masks against microbial breakouts.',
    activePhytochemicals: ['Curcumin', 'Demethoxycurcumin', 'Bisdemethoxycurcumin', 'Turmerone'],
    topicalBioactivity: {
      hydration: 'Moderate; best paired with rice paste or honey carrier.',
      erythemaModulation: 'Class-leading COX-2 inhibition decreases chronic inflammatory redness.',
      textureRefinement: 'Antimicrobial efficacy targets cutibacterium acnes, minimizing inflammatory papules.',
      antioxidantGlow: 'High ORAC antioxidant value guards against pollution-induced lipid peroxidation.',
    },
    patchTestProtocol: 'Apply small amount on jawline for 24 hours. Temporary yellow tinting is harmless.',
    safetyContraindications: 'Wash off thoroughly within 15–20 minutes to prevent prolonged staining.',
  },
  kencur: {
    id: 'kencur',
    commonName: 'Aromatic Ginger (Kencur)',
    botanicalName: 'Kaempferia galanga L.',
    family: 'Zingiberaceae',
    traditionalUse: 'Key ingredient of Jamu Beras Kencur. Applied topically to relieve swelling and revitalize tired skin.',
    activePhytochemicals: ['Ethyl p-methoxycinnamate (EPMC)', 'Borneol', 'Camphene', 'Cineol'],
    topicalBioactivity: {
      hydration: 'Promotes cutaneous microcirculation and thermal barrier sensation.',
      erythemaModulation: 'EPMC acts as a natural broad-spectrum UV absorber and anti-erythema agent.',
      textureRefinement: 'Astringent essential oils tone enlarged pores.',
      antioxidantGlow: 'Imparts a warm, refreshed natural complexion.',
    },
    patchTestProtocol: '24-hour test on inner forearm. Contains essential oils that may tingle on sensitive skin.',
    safetyContraindications: 'Do not use undiluted kencur oil on broken skin or around the delicate eye contour.',
  },
}

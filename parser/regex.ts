export const RX = {
  // Date
  dateLine: /^\s*(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})\b/, // con gruppi
  dateAny: /\b\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4}\b/, // senza gruppi (match generico)
  dateLoose: /(\b\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})\b/, // <-- con gruppi (per normalizeDate)

  // Contatti / ID
  phone: /\b(?:\+?39)?\s?3\d{8,10}\b/g,
  email: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,
  cf: /[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]/g,
  microchip: /\b\d{15}\b/,

  // Header pet
  codePrefix: /^\s*(GT|CT|CG|CN)\b/i,
  sexAny: /\b(M|F)\b/i,
  steril: /\b(STERILIZZAT[OA]|CASTRAT[OA]|INTERO)\b/i,

  // Nome/Colore
  nameChunk: /[A-Za-zÀ-ÿ'().-]+(?:\s+[A-Za-zÀ-ÿ'().-]+){0,3}/,
  colorWord:
    /\b(nero|bianco|grigio|tigrato|fulvo|tricolore|pezzato|marrone|focato|crema|blu|bruno|rosso|arancio|arancione)\b/i,

  // Trasferimento
  transfer:
    /(da\s+(\d{2})\/(\d{4}))?\s*(intestato a|cessione a|passaggio a|ceduto a)\s+([A-ZÀ-Ÿ][a-zà-ÿ'().-]+\s+[A-ZÀ-Ÿ][a-zà-ÿ'().-]+)/i,

  // Blocchi esami/prescrizioni
  examStart:
    /(PROFILO|BASE\s+[A-Z]|EMOGRAMMA|BIOCHIMICO|PANNELLO|ESAME\s+(FECI|URINE)|ISTOLOG|CITOLOG|TEST\b|ECO(CARDIO|\s*ADDOME|GRAFIA)?|RX\b|RADIOGRAFIA|TC\b|TAC\b)/i,
  prescr:
    /^(R\/|Rev\b|Ricetta|Prescrizione|Faccio\b|Do\b|Aggiungo\b|Consiglio\b|Metacam|Meloxidyl|Clavaseptin|Kesium|Afilaria|Frontline|Advantix|Otopet|Otogent|Tranex|Arnica|Prevomax)/i,

  // Doppio nome (proprietari)
  name2: /([A-ZÀ-Ÿ][a-zà-ÿ'().-]+)\s+([A-ZÀ-Ÿ][a-zà-ÿ'().-]+)/g,
};

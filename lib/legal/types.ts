export interface LegalSection {
  heading: string;
  // Paragraphs and bullet lists, rendered in order.
  blocks: ({ p: string } | { list: string[] })[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

// Placeholders the owner must replace before a public launch. Kept in one
// place so they're easy to find; each appears in brackets in the text.
export const LEGAL_PLACEHOLDERS = {
  contactEmail: "[CONTACT EMAIL]",
  dataRegion: "[FIRESTORE REGION]",
} as const;

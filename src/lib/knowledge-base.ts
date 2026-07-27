// import knowledgeBase from "../data/chatbot-knowledge-base.json" assert { type: "json" };
import knowledgeBase from "../data/chatbot-knowledge-base.json";

export type KB = typeof knowledgeBase;

/** Convenience getter — the single source of truth for all chatbot answers */
export const kb: KB = knowledgeBase;

// ─── Typed helpers ───────────────────────────────────────────────────────────

export function getCompanyInfo() {
  return kb.company;
}

export function getContactInfo() {
  return kb.contact;
}

export function getOffices() {
  return kb.offices;
}

export function getStats() {
  return kb.stats;
}

export function getAllServices(): string[] {
  const names: string[] = [];
  for (const cat of kb.services.categories) {
    for (const svc of cat.services) {
      names.push(svc.name);
    }
  }
  return names;
}

export function findServiceByName(query: string) {
  const q = query.toLowerCase();
  for (const cat of kb.services.categories) {
    for (const svc of cat.services) {
      if (svc.name.toLowerCase().includes(q)) return svc;
    }
  }
  return null;
}

export function getIndustryByName(query: string) {
  const q = query.toLowerCase();
  return kb.industries.find((ind) => ind.name.toLowerCase().includes(q)) ?? null;
}

export function getFAQAnswer(query: string): string | null {
  const q = query.toLowerCase();
  for (const faq of kb.faqs) {
    if (
      faq.question.toLowerCase().includes(q) ||
      q.split(" ").some((word) => word.length > 4 && faq.question.toLowerCase().includes(word))
    ) {
      return faq.answer;
    }
  }
  return null;
}

export function getQuickRepliesForIntent(intent: string): string[] {
  const map = kb.chatbotPersonality.quickReplySuggestions as Record<string, string[]>;
  return map[intent.toLowerCase()] ?? map["greeting"];
}

export function buildContextString(): string {
  const c = kb.company;
  const contact = kb.contact;
  const stats = kb.stats;
  return [
    `Company: ${c.name} — ${c.tagline}`,
    `Founded: ${c.founded}`,
    `Description: ${c.description}`,
    `Headquarters: Bhopal, India | Also in Hyderabad & Bengaluru`,
    `Email: ${contact.email} | Phone: ${contact.phone}`,
    `Working Hours: ${contact.workingHours}`,
    `Stats: ${stats.projectsDelivered} projects, ${stats.industriesServed} industries, ${stats.engineers} engineers, ${stats.clientSatisfaction} client satisfaction`,
  ].join("\n");
}

// Word helpers: case conversion, singular and plural, articles, and the
// display names used in help text.
import { camelCase, kebabCase, noCase, pascalCase } from "change-case";
import indefinite from "indefinite";
import pluralize from "pluralize";
import * as config from "./config.js";

// `/trust-centers/{slugId}/data-collected` is about data, not one datum.
pluralize.addUncountableRule("data");

export { camelCase as camel, kebabCase as kebab, pascalCase as pascal };

// `faqCategories` and `faq-categories` → "faq categories".
export const humanize = noCase;
export const lowerFirst = (s: string) =>
  s.replace(/^./, (c) => c.toLowerCase());
export const upperFirst = (s: string) =>
  s.replace(/^./, (c) => c.toUpperCase());

// "a vendor", "an integration".
export const a = (noun: string) => indefinite(noun);

// Singularizes the last word of a kebab-case segment: `security-reviews`.
export const singular = (segment: string) => pluralize.singular(segment);
export const isPlural = (segment: string) => singular(segment) !== segment;

// Display names from `config.nouns`, keyed by "<group> <segment>" or by
// segment, else from the segment itself.
export const nounFor = (segment: string, group?: string) =>
  (group && config.nouns[`${group} ${segment}`]) || config.nouns[segment];
export const displaySingular = (segment: string, group?: string) =>
  nounFor(segment, group)?.singular ?? humanize(singular(segment));
export const displayPlural = (segment: string, group?: string) =>
  nounFor(segment, group)?.plural ?? humanize(segment);

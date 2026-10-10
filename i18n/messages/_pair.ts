/** Transforme les chaînes littérales d'un objet en `string` (pour typer les traductions sur la version française). */
export type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

/** Déclare un thème de textes : l'anglais et l'italien doivent avoir exactement la même forme que le français. */
export const pair = <T>(fr: T, en: Widen<T>, it: Widen<T>) => ({ fr, en, it });

/** Transforme les chaînes littérales d'un objet en `string` (pour typer la version anglaise sur la française). */
export type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

/** Déclare un thème de textes : l'anglais doit avoir exactement la même forme que le français. */
export const pair = <T>(fr: T, en: Widen<T>) => ({ fr, en });

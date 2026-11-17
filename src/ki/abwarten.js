// Verhaltensmodul "abwarten": tut nichts.
import { anmelden } from "../kern/register.js";

export function abwarten() {
  return { art: "warten" };
}

anmelden("ki", "abwarten", abwarten);

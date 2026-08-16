const MM = '၀၁၂၃၄၅၆၇၈၉';

/** Convert Western digits 0-9 to Myanmar digits ၀-၉. */
export function toMyanmarDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => MM[Number(d)]!);
}

/** Convert Myanmar digits ၀-၉ back to Western 0-9. */
export function fromMyanmarDigits(value: string | number): string {
  return String(value).replace(/[၀-၉]/g, (d) => String(MM.indexOf(d)));
}

export function localizeDigits(value: string | number, lang: 'en' | 'my'): string {
  const s = String(value);
  return lang === 'my' ? toMyanmarDigits(s) : fromMyanmarDigits(s);
}

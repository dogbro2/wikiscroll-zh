// Chinese Wikipedia and Wikivoyage keep every article in whatever script its
// author typed and only convert on output. A request that names no variant is
// served the raw source, which is usually Simplified — the server's default
// variant is "no conversion". This interface is written in Traditional
// Chinese, so Chinese articles are always asked for in the Taiwan variant.
// Other languages have no variants and must not carry the parameter.
export const variantParams = lang => lang === 'zh' ? {variant: 'zh-tw'} : {};

// The same conversion never reaches the title: the Action API returns every
// `title` in the script the page was created in, whatever variant is asked
// for. inprop=varianttitles carries all of them, so Chinese cards can take
// their headline from the one that matches their text.
export const variantTitleProp = (lang, inprop) => lang === 'zh' ? `${inprop}|varianttitles` : inprop;

export const variantTitle = (page, lang) => (lang === 'zh' && page?.varianttitles?.['zh-tw']) || page?.title;
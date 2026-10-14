import type {MessageCatalog,InterpolationValues} from './i18n-core.ts';
import en from './locales/en.json' with {type:'json'};
import ja from './locales/ja.json' with {type:'json'};
import zh from './locales/zh.json' with {type:'json'};
import es from './locales/es.json' with {type:'json'};
import fr from './locales/fr.json' with {type:'json'};
import de from './locales/de.json' with {type:'json'};
import ru from './locales/ru.json' with {type:'json'};
import ar from './locales/ar.json' with {type:'json'};
import pt from './locales/pt.json' with {type:'json'};
import it from './locales/it.json' with {type:'json'};
import tr from './locales/tr.json' with {type:'json'};
import uk from './locales/uk.json' with {type:'json'};
import vi from './locales/vi.json' with {type:'json'};
import id from './locales/id.json' with {type:'json'};
import nl from './locales/nl.json' with {type:'json'};
import pl from './locales/pl.json' with {type:'json'};
import cs from './locales/cs.json' with {type:'json'};
import sv from './locales/sv.json' with {type:'json'};
import da from './locales/da.json' with {type:'json'};
import fi from './locales/fi.json' with {type:'json'};
import ro from './locales/ro.json' with {type:'json'};
import hu from './locales/hu.json' with {type:'json'};
import el from './locales/el.json' with {type:'json'};
import bg from './locales/bg.json' with {type:'json'};
import nb from './locales/nb.json' with {type:'json'};
import sk from './locales/sk.json' with {type:'json'};
import ca from './locales/ca.json' with {type:'json'};
import hi from './locales/hi.json' with {type:'json'};
import {translateWithCatalog} from './i18n-core.ts';
export {resolveLocale,formatNumber,formatDate,languages,localeFlag,matchesLocalizedText} from './i18n-core.ts';
const catalogs:Readonly<Record<string,MessageCatalog>>={en,ja,zh,es,fr,de,ru,ar,pt,it,tr,uk,vi,id,nl,pl,cs,sv,da,fi,ro,hu,el,bg,nb,sk,ca,hi};
export const translatedLanguages=['ko',...Object.keys(catalogs)];
export function languageCatalog(locale:unknown):MessageCatalog{const base=String(locale).split('-')[0];return Object.hasOwn(catalogs,base)?catalogs[base]:{};}
export function translate<T>(locale:unknown,text:T,values?:InterpolationValues|null):T|string{return translateWithCatalog(locale,text,values,languageCatalog(locale),en);}
export function languageCoverage(locale:unknown){const base=String(locale).split('-')[0],keys=Object.keys(en),count=base==='ko'?keys.length:keys.filter(key=>Object.hasOwn(languageCatalog(base),key)).length;return {translatedEntries:count,totalEntries:keys.length,complete:count===keys.length};}

const coverageSummary=Object.freeze(Object.fromEntries(translatedLanguages.map(locale=>[locale,Object.freeze(languageCoverage(locale))])));
export function languageCoverageSummary(){return coverageSummary;}

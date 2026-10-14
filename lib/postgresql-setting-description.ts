import catalogs from './locales/postgresql-descriptions.json' with {type:'json'};
import overrides from './locales/postgresql-description-overrides.json' with {type:'json'};

const descriptions:Readonly<Record<string,Record<string,string[]>>>=catalogs;
const localOverrides:Readonly<Record<string,Record<string,string[]>>>=overrides;
const messages:Readonly<Record<string,[string,string,string]>>={
 hi:['अंग्रेज़ी में अतिरिक्त विवरण','इस सेटिंग का अनुवादित विवरण अभी उपलब्ध नहीं है।','फ़ाइल की मूल टिप्पणी'],
 sk:['Doplňujúci popis v angličtine','Preložený popis tohto nastavenia zatiaľ nie je k dispozícii.','Pôvodný komentár súboru'],
 cs:['Doplňující popis v angličtině','Přeložený popis tohoto nastavení zatím není k dispozici.','Původní komentář souboru'],
 bg:['Допълнително описание на английски','Все още няма преведено описание за тази настройка.','Оригинален коментар във файла'],
 el:['Συμπληρωματική περιγραφή στα αγγλικά','Δεν υπάρχει ακόμη μεταφρασμένη περιγραφή για αυτή τη ρύθμιση.','Αρχικό σχόλιο του αρχείου'],
 hu:['Kiegészítő angol leírás','Ehhez a beállításhoz még nem érhető el lefordított leírás.','A fájl eredeti megjegyzése'],
 vi:['Mô tả bổ sung bằng tiếng Anh','Chưa có bản dịch mô tả cho thiết lập này.','Chú thích gốc của tệp'],
 ro:['Descriere suplimentară în engleză','O descriere tradusă a acestei setări nu este încă disponibilă.','Comentariul original al fișierului'],
 nb:['Supplerende engelsk beskrivelse','En oversatt beskrivelse av denne innstillingen er ikke tilgjengelig ennå.','Filens opprinnelige kommentar'],
 da:['Supplerende engelsk beskrivelse','Der findes endnu ikke en oversat beskrivelse af denne indstilling.','Filens oprindelige kommentar'],
 nl:['Aanvullende Engelse beschrijving','Er is nog geen vertaalde beschrijving beschikbaar voor deze instelling.','Oorspronkelijke opmerking in het bestand'],
 fi:['Täydentävä englanninkielinen kuvaus','Tämän asetuksen käännetty kuvaus ei ole vielä saatavilla.','Tiedoston alkuperäinen kommentti'],
 ca:['Descripció complementària en anglès','Encara no hi ha una descripció traduïda d’aquest paràmetre.','Comentari original del fitxer'],
 ko:['영어 보충 설명','이 설정의 번역 설명은 아직 준비되지 않았습니다.','파일의 원본 주석'],
 en:['English supplementary description','A translated description for this setting is not available yet.','Original file comment'],
 ja:['英語の補足説明','この設定の翻訳された説明はまだありません。','ファイルの元のコメント'],
 zh:['英语补充说明','此设置的翻译说明尚未提供。','文件原始注释'],
 es:['Descripción complementaria en inglés','La descripción traducida de este ajuste aún no está disponible.','Comentario original del archivo'],
 fr:['Description complémentaire en anglais','La description traduite de ce paramètre n’est pas encore disponible.','Commentaire original du fichier'],
 de:['Ergänzende englische Beschreibung','Für diese Einstellung ist noch keine übersetzte Beschreibung verfügbar.','Originalkommentar der Datei'],
 ru:['Дополнительное описание на английском','Перевод описания этого параметра пока недоступен.','Исходный комментарий файла'],
 pt:['Descrição complementar em inglês','A descrição traduzida desta configuração ainda não está disponível.','Comentário original do arquivo'],
 ar:['وصف إضافي باللغة الإنجليزية','لا تتوفر ترجمة لوصف هذا الإعداد حتى الآن.','التعليق الأصلي في الملف'],
 id:['Penjelasan tambahan dalam bahasa Inggris','Terjemahan penjelasan untuk pengaturan ini belum tersedia.','Komentar asli berkas'],
 it:['Descrizione supplementare in inglese','La descrizione tradotta di questa impostazione non è ancora disponibile.','Commento originale del file'],
 ka:['დამატებითი აღწერა ინგლისურად','ამ პარამეტრის აღწერის თარგმანი ჯერ არ არის ხელმისაწვდომი.','ფაილის თავდაპირველი კომენტარი'],
 pl:['Dodatkowy opis w języku angielskim','Tłumaczenie opisu tego ustawienia nie jest jeszcze dostępne.','Oryginalny komentarz w pliku'],
 sv:['Kompletterande beskrivning på engelska','En översatt beskrivning av den här inställningen är ännu inte tillgänglig.','Ursprunglig kommentar i filen'],
 tr:['İngilizce ek açıklama','Bu ayarın çevrilmiş açıklaması henüz mevcut değil.','Dosyanın özgün yorumu'],
 uk:['Додатковий опис англійською','Переклад опису цього параметра ще недоступний.','Початковий коментар у файлі']
};

function entry<T>(catalog:Readonly<Record<string,T>>|undefined,name:string){return catalog&&Object.hasOwn(catalog,name)?catalog[name]:undefined;}
// Stable order on the server and client; extensions remain free-text input.
export const postgresqlSettingNames=Object.freeze(Object.keys(catalogs.en).sort());
const parameterNames=new Map(Object.keys(catalogs.en).map(name=>[name.toLowerCase(),name]));
export function postgresqlSettingDescription(name:unknown,locale:unknown='ko'){
 const parameter=typeof name==='string'?name.toLowerCase():'';
 const officialName=parameterNames.get(parameter)||parameter;
 const language=String(locale).toLowerCase().split(/[-_]/)[0];
 const labels=entry(messages,language)||messages.en;
 const local=entry(entry(localOverrides,language),parameter)||entry(entry(descriptions,language),officialName);
 const paragraphs=local||entry(overrides.en,parameter)||entry(catalogs.en,officialName)||[];
 const translated=Boolean(local);
 return {paragraphs,language:translated?language:'en',translated,
  fallbackLabel:labels[0],unavailable:labels[1],commentLabel:labels[2]};
}

// База данных смайликов с переводами на русский, немецкий и английский
const emojiDatabase = {
    // Эмоции и чувства
    '😀': { ru: ['радость', 'счастье', 'улыбка', 'веселье'], de: ['freude', 'glück', 'lächeln', 'fröhlich'], en: ['joy', 'happiness', 'smile', 'cheerful'] },
    '😃': { ru: ['радость', 'восторг', 'веселье'], de: ['freude', 'begeisterung', 'fröhlich'], en: ['joy', 'excitement', 'cheerful'] },
    '😄': { ru: ['смех', 'радость', 'веселье'], de: ['lachen', 'freude', 'fröhlich'], en: ['laughter', 'joy', 'cheerful'] },
    '😁': { ru: ['ухмылка', 'довольство'], de: ['grinsen', 'zufrieden'], en: ['grin', 'satisfied'] },
    '😊': { ru: ['застенчивость', 'скромность'], de: ['schüchtern', 'bescheiden'], en: ['shy', 'modest'] },
    '😍': { ru: ['любовь', 'восхищение'], de: ['liebe', 'bewunderung'], en: ['love', 'admiration'] },
    '🤔': { ru: ['думать', 'размышлять', 'вопрос'], de: ['denken', 'nachdenken', 'frage'], en: ['think', 'ponder', 'question'] },
    '😢': { ru: ['грусть', 'печаль', 'слёзы'], de: ['trauer', 'tränen'], en: ['sadness', 'tears'] },
    '😭': { ru: ['плач', 'рыдания'], de: ['weinen', 'schluchzen'], en: ['crying', 'sobbing'] },
    '😡': { ru: ['злость', 'гнев'], de: ['wut', 'zorn'], en: ['anger', 'rage'] },
    '😨': { ru: ['страх', 'испуг'], de: ['angst', 'schreck'], en: ['fear', 'fright'] },
    '😴': { ru: ['сон', 'усталость', 'спать'], de: ['schlaf', 'müdigkeit', 'schlafen'], en: ['sleep', 'tired', 'sleeping'] },
    
    // Жесты и действия
    '👍': { ru: ['хорошо', 'одобрение', 'да'], de: ['gut', 'zustimmung', 'ja'], en: ['good', 'approval', 'yes'] },
    '👎': { ru: ['плохо', 'неодобрение', 'нет'], de: ['schlecht', 'ablehnung', 'nein'], en: ['bad', 'disapproval', 'no'] },
    '👏': { ru: ['аплодисменты', 'хлопать'], de: ['applaus', 'klatschen'], en: ['applause', 'clapping'] },
    '🙏': { ru: ['молитва', 'просьба', 'спасибо'], de: ['gebet', 'bitte', 'danke'], en: ['prayer', 'please', 'thank you'] },
    '👋': { ru: ['привет', 'махать', 'прощание'], de: ['hallo', 'winken', 'abschied'], en: ['hello', 'wave', 'goodbye'] },
    '✋': { ru: ['стоп', 'рука', 'остановиться'], de: ['stopp', 'hand', 'anhalten'], en: ['stop', 'hand', 'halt'] },
    '👉': { ru: ['указывать', 'направление'], de: ['zeigen', 'richtung'], en: ['point', 'direction'] },
    '👈': { ru: ['указывать', 'назад'], de: ['zeigen', 'zurück'], en: ['point', 'back'] },
    '👆': { ru: ['вверх', 'указывать'], de: ['oben', 'zeigen'], en: ['up', 'point'] },
    '👇': { ru: ['вниз', 'указывать'], de: ['unten', 'zeigen'], en: ['down', 'point'] },
    
    // Животные
    '🐶': { ru: ['собака', 'щенок', 'пёс'], de: ['hund', 'welpe'], en: ['dog', 'puppy'] },
    '🐱': { ru: ['кот', 'кошка', 'котёнок'], de: ['katze', 'kätzchen'], en: ['cat', 'kitten'] },
    '🐭': { ru: ['мышь', 'мышка'], de: ['maus'], en: ['mouse'] },
    '🐹': { ru: ['хомяк'], de: ['hamster'], en: ['hamster'] },
    '🐰': { ru: ['кролик', 'заяц'], de: ['kaninchen', 'hase'], en: ['rabbit', 'bunny'] },
    '🦊': { ru: ['лиса', 'лисица'], de: ['fuchs'], en: ['fox'] },
    '🐻': { ru: ['медведь', 'мишка'], de: ['bär'], en: ['bear'] },
    '🐼': { ru: ['панда'], de: ['panda'], en: ['panda'] },
    '🐨': { ru: ['коала'], de: ['koala'], en: ['koala'] },
    '🐯': { ru: ['тигр'], de: ['tiger'], en: ['tiger'] },
    '🦁': { ru: ['лев'], de: ['löwe'], en: ['lion'] },
    '🐸': { ru: ['лягушка', 'жаба'], de: ['frosch'], en: ['frog'] },
    '🐵': { ru: ['обезьяна'], de: ['affe'], en: ['monkey'] },
    '🐔': { ru: ['курица', 'петух'], de: ['huhn', 'hahn'], en: ['chicken', 'rooster'] },
    '🐧': { ru: ['пингвин'], de: ['pinguin'], en: ['penguin'] },
    '🐦': { ru: ['птица', 'птичка'], de: ['vogel'], en: ['bird'] },
    '🦅': { ru: ['орёл'], de: ['adler'], en: ['eagle'] },
    '🦆': { ru: ['утка'], de: ['ente'], en: ['duck'] },
    '🐢': { ru: ['черепаха'], de: ['schildkröte'], en: ['turtle'] },
    '🐍': { ru: ['змея'], de: ['schlange'], en: ['snake'] },
    '🐠': { ru: ['рыба', 'рыбка'], de: ['fisch'], en: ['fish'] },
    '🐙': { ru: ['осьминог'], de: ['oktopus'], en: ['octopus'] },
    '🦋': { ru: ['бабочка'], de: ['schmetterling'], en: ['butterfly'] },
    '🐝': { ru: ['пчела'], de: ['biene'], en: ['bee'] },
    '🐞': { ru: ['божья коровка'], de: ['marienkäfer'], en: ['ladybug'] },
    '🕷': { ru: ['паук'], de: ['spinne'], en: ['spider'] },
    
    // Еда и напитки
    '🍎': { ru: ['яблоко'], de: ['apfel'], en: ['apple'] },
    '🍌': { ru: ['банан'], de: ['banane'], en: ['banana'] },
    '🍇': { ru: ['виноград'], de: ['trauben'], en: ['grapes'] },
    '🍓': { ru: ['клубника'], de: ['erdbeere'], en: ['strawberry'] },
    '🍊': { ru: ['апельсин'], de: ['orange'], en: ['orange'] },
    '🍋': { ru: ['лимон'], de: ['zitrone'], en: ['lemon'] },
    '🍉': { ru: ['арбуз'], de: ['wassermelone'], en: ['watermelon'] },
    '🍑': { ru: ['вишня', 'черешня'], de: ['kirsche'], en: ['cherry'] },
    '🍒': { ru: ['вишня'], de: ['kirschen'], en: ['cherries'] },
    '🥝': { ru: ['киви'], de: ['kiwi'], en: ['kiwi'] },
    '🍅': { ru: ['помидор', 'томат'], de: ['tomate'], en: ['tomato'] },
    '🥕': { ru: ['морковь'], de: ['karotte'], en: ['carrot'] },
    '🌽': { ru: ['кукуруза'], de: ['mais'], en: ['corn'] },
    '🥒': { ru: ['огурец'], de: ['gurke'], en: ['cucumber'] },
    '🥬': { ru: ['капуста', 'салат'], de: ['kohl', 'salat'], en: ['cabbage', 'lettuce'] },
    '🍞': { ru: ['хлеб'], de: ['brot'], en: ['bread'] },
    '🧀': { ru: ['сыр'], de: ['käse'], en: ['cheese'] },
    '🥛': { ru: ['молоко'], de: ['milch'], en: ['milk'] },
    '☕': { ru: ['кофе'], de: ['kaffee'], en: ['coffee'] },
    '🍵': { ru: ['чай'], de: ['tee'], en: ['tea'] },
    '🍰': { ru: ['торт', 'пирожное'], de: ['kuchen', 'torte'], en: ['cake'] },
    '🍪': { ru: ['печенье'], de: ['keks'], en: ['cookie'] },
    '🍫': { ru: ['шоколад'], de: ['schokolade'], en: ['chocolate'] },
    '🍭': { ru: ['леденец', 'конфета'], de: ['lutscher', 'bonbon'], en: ['lollipop', 'candy'] },
    '🍯': { ru: ['мёд'], de: ['honig'], en: ['honey'] },
    
    // Транспорт
    '🚗': { ru: ['машина', 'автомобиль', 'авто'], de: ['auto', 'wagen'], en: ['car', 'automobile'] },
    '🚕': { ru: ['такси'], de: ['taxi'], en: ['taxi'] },
    '🚙': { ru: ['внедорожник'], de: ['suv'], en: ['suv'] },
    '🚌': { ru: ['автобус'], de: ['bus'], en: ['bus'] },
    '🚎': { ru: ['троллейбус'], de: ['trolleybus'], en: ['trolleybus'] },
    '🏎': { ru: ['гоночная машина'], de: ['rennwagen'], en: ['race car'] },
    '🚓': { ru: ['полицейская машина'], de: ['polizeiauto'], en: ['police car'] },
    '🚑': { ru: ['скорая помощь'], de: ['krankenwagen'], en: ['ambulance'] },
    '🚒': { ru: ['пожарная машина'], de: ['feuerwehr'], en: ['fire truck'] },
    '🚐': { ru: ['минивэн'], de: ['minivan'], en: ['minivan'] },
    '🚚': { ru: ['грузовик'], de: ['lastwagen'], en: ['truck'] },
    '🚛': { ru: ['фура'], de: ['sattelschlepper'], en: ['semi-truck'] },
    '🚜': { ru: ['трактор'], de: ['traktor'], en: ['tractor'] },
    '🏍': { ru: ['мотоцикл'], de: ['motorrad'], en: ['motorcycle'] },
    '🚲': { ru: ['велосипед'], de: ['fahrrad'], en: ['bicycle'] },
    '🛴': { ru: ['самокат'], de: ['roller'], en: ['scooter'] },
    '🚁': { ru: ['вертолёт'], de: ['hubschrauber'], en: ['helicopter'] },
    '✈': { ru: ['самолёт'], de: ['flugzeug'], en: ['airplane'] },
    '🚀': { ru: ['ракета'], de: ['rakete'], en: ['rocket'] },
    '🚢': { ru: ['корабль'], de: ['schiff'], en: ['ship'] },
    '⛵': { ru: ['парусник'], de: ['segelboot'], en: ['sailboat'] },
    '🚤': { ru: ['катер'], de: ['motorboot'], en: ['speedboat'] },
    '🛥': { ru: ['яхта'], de: ['yacht'], en: ['yacht'] },
    '🚂': { ru: ['поезд'], de: ['zug'], en: ['train'] },
    '🚄': { ru: ['скоростной поезд'], de: ['hochgeschwindigkeitszug'], en: ['bullet train'] },
    '🚅': { ru: ['поезд'], de: ['zug'], en: ['train'] },
    '🚆': { ru: ['поезд'], de: ['zug'], en: ['train'] },
    '🚇': { ru: ['метро'], de: ['u-bahn'], en: ['subway'] },
    '🚈': { ru: ['трамвай'], de: ['straßenbahn'], en: ['tram'] },
    '🚉': { ru: ['станция'], de: ['bahnhof'], en: ['station'] },
    
    // Природа
    '🌞': { ru: ['солнце'], de: ['sonne'], en: ['sun'] },
    '🌝': { ru: ['луна'], de: ['mond'], en: ['moon'] },
    '⭐': { ru: ['звезда'], de: ['stern'], en: ['star'] },
    '🌟': { ru: ['звезда', 'блеск'], de: ['stern', 'glanz'], en: ['star', 'sparkle'] },
    '💫': { ru: ['звёзды'], de: ['sterne'], en: ['stars'] },
    '☀': { ru: ['солнце'], de: ['sonne'], en: ['sun'] },
    '⛅': { ru: ['облака'], de: ['wolken'], en: ['clouds'] },
    '⛈': { ru: ['гроза'], de: ['gewitter'], en: ['thunderstorm'] },
    '🌤': { ru: ['солнце за облаками'], de: ['sonne hinter wolken'], en: ['sun behind clouds'] },
    '🌦': { ru: ['дождь'], de: ['regen'], en: ['rain'] },
    '🌧': { ru: ['дождь'], de: ['regen'], en: ['rain'] },
    '⛄': { ru: ['снеговик'], de: ['schneemann'], en: ['snowman'] },
    '❄': { ru: ['снег', 'снежинка'], de: ['schnee', 'schneeflocke'], en: ['snow', 'snowflake'] },
    '🌨': { ru: ['снег'], de: ['schnee'], en: ['snow'] },
    '💨': { ru: ['ветер'], de: ['wind'], en: ['wind'] },
    '🌪': { ru: ['торнадо'], de: ['tornado'], en: ['tornado'] },
    '🌈': { ru: ['радуга'], de: ['regenbogen'], en: ['rainbow'] },
    '🔥': { ru: ['огонь', 'пламя'], de: ['feuer', 'flamme'], en: ['fire', 'flame'] },
    '💧': { ru: ['капля'], de: ['tropfen'], en: ['drop'] },
    '🌊': { ru: ['волна', 'море'], de: ['welle', 'meer'], en: ['wave', 'sea'] },
    
    // Растения
    '🌱': { ru: ['росток', 'растение'], de: ['setzling', 'pflanze'], en: ['seedling', 'plant'] },
    '🌿': { ru: ['трава', 'листья'], de: ['gras', 'blätter'], en: ['grass', 'leaves'] },
    '☘': { ru: ['клевер'], de: ['klee'], en: ['clover'] },
    '🍀': { ru: ['четырёхлистный клевер'], de: ['vierblättriger klee'], en: ['four leaf clover'] },
    '🌾': { ru: ['пшеница', 'зерно'], de: ['weizen', 'getreide'], en: ['wheat', 'grain'] },
    '🌵': { ru: ['кактус'], de: ['kaktus'], en: ['cactus'] },
    '🌲': { ru: ['ель', 'дерево'], de: ['tanne', 'baum'], en: ['evergreen', 'tree'] },
    '🌳': { ru: ['дерево'], de: ['baum'], en: ['tree'] },
    '🌴': { ru: ['пальма'], de: ['palme'], en: ['palm tree'] },
    '🌸': { ru: ['цветок', 'сакура'], de: ['blume', 'sakura'], en: ['flower', 'cherry blossom'] },
    '🌺': { ru: ['цветок'], de: ['blume'], en: ['flower'] },
    '🌻': { ru: ['подсолнух'], de: ['sonnenblume'], en: ['sunflower'] },
    '🌹': { ru: ['роза'], de: ['rose'], en: ['rose'] },
    '🥀': { ru: ['увядший цветок'], de: ['verwelkte blume'], en: ['wilted flower'] },
    '🌷': { ru: ['тюльпан'], de: ['tulpe'], en: ['tulip'] },
    
    // Объекты и предметы
    '📱': { ru: ['телефон', 'смартфон'], de: ['telefon', 'smartphone'], en: ['phone', 'smartphone'] },
    '💻': { ru: ['ноутбук', 'компьютер'], de: ['laptop', 'computer'], en: ['laptop', 'computer'] },
    '⌨': { ru: ['клавиатура'], de: ['tastatur'], en: ['keyboard'] },
    '🖥': { ru: ['монитор'], de: ['monitor'], en: ['monitor'] },
    '🖨': { ru: ['принтер'], de: ['drucker'], en: ['printer'] },
    '📷': { ru: ['фотоаппарат'], de: ['kamera'], en: ['camera'] },
    '📹': { ru: ['видеокамера'], de: ['videokamera'], en: ['video camera'] },
    '📺': { ru: ['телевизор'], de: ['fernseher'], en: ['television'] },
    '🎥': { ru: ['кинокамера'], de: ['filmkamera'], en: ['movie camera'] },
    '📻': { ru: ['радио'], de: ['radio'], en: ['radio'] },
    '🎵': { ru: ['музыка', 'нота'], de: ['musik', 'note'], en: ['music', 'note'] },
    '🎶': { ru: ['музыка', 'ноты'], de: ['musik', 'noten'], en: ['music', 'notes'] },
    '🎤': { ru: ['микрофон'], de: ['mikrofon'], en: ['microphone'] },
    '🎧': { ru: ['наушники'], de: ['kopfhörer'], en: ['headphones'] },
    '📖': { ru: ['книга'], de: ['buch'], en: ['book'] },
    '📝': { ru: ['записка', 'писать'], de: ['notiz', 'schreiben'], en: ['note', 'write'] },
    '✏': { ru: ['карандаш'], de: ['bleistift'], en: ['pencil'] },
    '✒': { ru: ['ручка'], de: ['stift'], en: ['pen'] },
    '📏': { ru: ['линейка'], de: ['lineal'], en: ['ruler'] },
    '📐': { ru: ['треугольник'], de: ['dreieck'], en: ['triangle'] },
    '✂': { ru: ['ножницы'], de: ['schere'], en: ['scissors'] },
    '📎': { ru: ['скрепка'], de: ['büroklammer'], en: ['paperclip'] },
    '🔗': { ru: ['ссылка', 'цепь'], de: ['link', 'kette'], en: ['link', 'chain'] },
    '📌': { ru: ['кнопка', 'булавка'], de: ['reißzwecke', 'stecknadel'], en: ['pushpin', 'pin'] },
    '📍': { ru: ['метка', 'место'], de: ['markierung', 'ort'], en: ['marker', 'location'] },
    '🗂': { ru: ['папка'], de: ['ordner'], en: ['folder'] },
    '📁': { ru: ['папка'], de: ['ordner'], en: ['folder'] },
    '📂': { ru: ['открытая папка'], de: ['offener ordner'], en: ['open folder'] },
    '🗃': { ru: ['картотека'], de: ['kartei'], en: ['file cabinet'] },
    '🗄': { ru: ['шкаф'], de: ['schrank'], en: ['cabinet'] },
    '🗑': { ru: ['корзина'], de: ['papierkorb'], en: ['trash'] },
    '🔒': { ru: ['замок', 'закрыто'], de: ['schloss', 'geschlossen'], en: ['lock', 'closed'] },
    '🔓': { ru: ['открытый замок'], de: ['offenes schloss'], en: ['open lock'] },
    '🔑': { ru: ['ключ'], de: ['schlüssel'], en: ['key'] },
    '🗝': { ru: ['старый ключ'], de: ['alter schlüssel'], en: ['old key'] },
    '🔨': { ru: ['молоток'], de: ['hammer'], en: ['hammer'] },
    '⛏': { ru: ['кирка'], de: ['spitzhacke'], en: ['pickaxe'] },
    '🔧': { ru: ['гаечный ключ'], de: ['schraubenschlüssel'], en: ['wrench'] },
    '🔩': { ru: ['болт'], de: ['schraube'], en: ['bolt'] },
    '⚙': { ru: ['шестерня'], de: ['zahnrad'], en: ['gear'] },
    '🧰': { ru: ['ящик с инструментами'], de: ['werkzeugkasten'], en: ['toolbox'] },
    '⚖': { ru: ['весы'], de: ['waage'], en: ['scales'] },
    '🔬': { ru: ['микроскоп'], de: ['mikroskop'], en: ['microscope'] },
    '🔭': { ru: ['телескоп'], de: ['teleskop'], en: ['telescope'] },
    '📡': { ru: ['антенна'], de: ['antenne'], en: ['antenna'] },
    
    // Спорт и игры
    '⚽': { ru: ['футбол'], de: ['fußball'], en: ['soccer'] },
    '🏀': { ru: ['баскетбол'], de: ['basketball'], en: ['basketball'] },
    '🏈': { ru: ['американский футбол'], de: ['american football'], en: ['american football'] },
    '⚾': { ru: ['бейсбол'], de: ['baseball'], en: ['baseball'] },
    '🥎': { ru: ['софтбол'], de: ['softball'], en: ['softball'] },
    '🎾': { ru: ['теннис'], de: ['tennis'], en: ['tennis'] },
    '🏐': { ru: ['волейбол'], de: ['volleyball'], en: ['volleyball'] },
    '🏉': { ru: ['регби'], de: ['rugby'], en: ['rugby'] },
    '🥏': { ru: ['фрисби'], de: ['frisbee'], en: ['frisbee'] },
    '🎱': { ru: ['бильярд'], de: ['billard'], en: ['billiards'] },
    '🏓': { ru: ['настольный теннис'], de: ['tischtennis'], en: ['ping pong'] },
    '🏸': { ru: ['бадминтон'], de: ['badminton'], en: ['badminton'] },
    '🥅': { ru: ['ворота'], de: ['tor'], en: ['goal'] },
    '⛳': { ru: ['гольф'], de: ['golf'], en: ['golf'] },
    '🏹': { ru: ['лук и стрелы'], de: ['bogen und pfeile'], en: ['bow and arrow'] },
    '🎣': { ru: ['рыбалка'], de: ['angeln'], en: ['fishing'] },
    '🥊': { ru: ['бокс'], de: ['boxen'], en: ['boxing'] },
    '🥋': { ru: ['карате', 'дзюдо'], de: ['karate', 'judo'], en: ['karate', 'judo'] },
    '🎯': { ru: ['дартс', 'мишень'], de: ['darts', 'zielscheibe'], en: ['darts', 'target'] },
    '🎮': { ru: ['игра', 'геймпад'], de: ['spiel', 'gamepad'], en: ['game', 'gamepad'] },
    '🕹': { ru: ['джойстик'], de: ['joystick'], en: ['joystick'] },
    '🎲': { ru: ['кубик', 'игральная кость'], de: ['würfel'], en: ['dice'] },
    '♠': { ru: ['пики'], de: ['pik'], en: ['spades'] },
    '♥': { ru: ['червы'], de: ['herz'], en: ['hearts'] },
    '♦': { ru: ['бубны'], de: ['karo'], en: ['diamonds'] },
    '♣': { ru: ['трефы'], de: ['kreuz'], en: ['clubs'] },
    '♟': { ru: ['шахматы'], de: ['schach'], en: ['chess'] },
    '🃏': { ru: ['джокер'], de: ['joker'], en: ['joker'] },
    
    // Здания и места
    '🏠': { ru: ['дом'], de: ['haus'], en: ['house'] },
    '🏡': { ru: ['дом с садом'], de: ['haus mit garten'], en: ['house with garden'] },
    '🏢': { ru: ['офисное здание'], de: ['bürogebäude'], en: ['office building'] },
    '🏣': { ru: ['японское здание'], de: ['japanisches gebäude'], en: ['japanese building'] },
    '🏤': { ru: ['почта'], de: ['post'], en: ['post office'] },
    '🏥': { ru: ['больница'], de: ['krankenhaus'], en: ['hospital'] },
    '🏦': { ru: ['банк'], de: ['bank'], en: ['bank'] },
    '🏧': { ru: ['банкомат'], de: ['geldautomat'], en: ['atm'] },
    '🏨': { ru: ['отель'], de: ['hotel'], en: ['hotel'] },
    '🏩': { ru: ['отель для влюблённых'], de: ['liebeshotel'], en: ['love hotel'] },
    '🏪': { ru: ['магазин'], de: ['laden'], en: ['store'] },
    '🏫': { ru: ['школа'], de: ['schule'], en: ['school'] },
    '🏬': { ru: ['торговый центр'], de: ['einkaufszentrum'], en: ['shopping mall'] },
    '🏭': { ru: ['фабрика'], de: ['fabrik'], en: ['factory'] },
    '🏮': { ru: ['фонарь'], de: ['laterne'], en: ['lantern'] },
    '🏯': { ru: ['замок'], de: ['burg'], en: ['castle'] },
    '🏰': { ru: ['замок'], de: ['schloss'], en: ['castle'] },
    '🗼': { ru: ['башня'], de: ['turm'], en: ['tower'] },
    '🗽': { ru: ['статуя свободы'], de: ['freiheitsstatue'], en: ['statue of liberty'] },
    '⛪': { ru: ['церковь'], de: ['kirche'], en: ['church'] },
    '🕌': { ru: ['мечеть'], de: ['moschee'], en: ['mosque'] },
    '🛕': { ru: ['храм'], de: ['tempel'], en: ['temple'] },
    '🕍': { ru: ['синагога'], de: ['synagoge'], en: ['synagogue'] },
    '⛩': { ru: ['синтоистские ворота'], de: ['shinto-tor'], en: ['shinto shrine'] },
    '🕋': { ru: ['кааба'], de: ['kaaba'], en: ['kaaba'] }
};

// Функция поиска смайликов по словам
function findEmojisForText(text, language = 'ru', maxResults = 10) {
    const words = text.toLowerCase()
        .replace(/[^\wа-яё\s]/gi, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
    
    const foundEmojis = new Set();
    const results = [];
    
    // Поиск по отдельным словам
    for (const word of words) {
        if (foundEmojis.size >= maxResults) break;
        
        for (const [emoji, translations] of Object.entries(emojiDatabase)) {
            if (foundEmojis.has(emoji)) continue;
            
            const langWords = translations[language] || [];
            if (langWords.some(langWord => 
                langWord.includes(word) || word.includes(langWord)
            )) {
                foundEmojis.add(emoji);
                results.push({
                    emoji,
                    matchedWord: word,
                    translations: translations[language]
                });
                break;
            }
        }
    }
    
    // Поиск по парам слов
    if (foundEmojis.size < maxResults && words.length > 1) {
        for (let i = 0; i < words.length - 1; i++) {
            if (foundEmojis.size >= maxResults) break;
            
            const wordPair = words[i] + ' ' + words[i + 1];
            
            for (const [emoji, translations] of Object.entries(emojiDatabase)) {
                if (foundEmojis.has(emoji)) continue;
                
                const langWords = translations[language] || [];
                if (langWords.some(langWord => 
                    langWord.includes(wordPair) || wordPair.includes(langWord)
                )) {
                    foundEmojis.add(emoji);
                    results.push({
                        emoji,
                        matchedWord: wordPair,
                        translations: translations[language]
                    });
                    break;
                }
            }
        }
    }
    
    return results;
}

// Функция получения случайных смайликов если ничего не найдено
function getRandomEmojis(count = 5) {
    const allEmojis = Object.keys(emojiDatabase);
    const randomEmojis = [];
    
    for (let i = 0; i < count && i < allEmojis.length; i++) {
        const randomIndex = Math.floor(Math.random() * allEmojis.length);
        const emoji = allEmojis[randomIndex];
        
        if (!randomEmojis.find(item => item.emoji === emoji)) {
            randomEmojis.push({
                emoji,
                matchedWord: 'случайный',
                translations: emojiDatabase[emoji].ru
            });
        }
    }
    
    return randomEmojis;
}

module.exports = {
    emojiDatabase,
    findEmojisForText,
    getRandomEmojis
};
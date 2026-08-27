/* AIBROFIST — автоперевод интерфейса
   Язык берётся с сервера (страна по IP -> язык), либо из Settings игрока.
   Порядок в массивах: ru, en, uk, de, fr, es, pt, pl, tr, zh            */
(function () {
  'use strict';

  var LANGS = ['ru', 'en', 'uk', 'de', 'fr', 'es', 'pt', 'pl', 'tr', 'zh'];
  var NAMES = {
    ru: 'Русский', en: 'English', uk: 'Українська', de: 'Deutsch', fr: 'Français',
    es: 'Español', pt: 'Português', pl: 'Polski', tr: 'Türkçe', zh: '中文'
  };

  var D = {
    /* ---------- шапка и навигация ---------- */
    leaderboard:  ['Таблица лидеров','Leaderboard','Таблиця лідерів','Bestenliste','Classement','Clasificación','Classificação','Ranking','Sıralama','排行榜'],
    editor:       ['Редактор','Editor','Редактор','Editor','Éditeur','Editor','Editor','Edytor','Düzenleyici','编辑器'],
    browser:      ['Обзор','Browser','Огляд','Übersicht','Navigateur','Explorador','Explorador','Przeglądarka','Tarayıcı','浏览'],
    mapEditor:    ['Редактор карт','Map Editor','Редактор карт','Karten-Editor','Éditeur de cartes','Editor de mapas','Editor de mapas','Edytor map','Harita düzenleyici','地图编辑器'],
    skinEditor:   ['Редактор скинов','Skin Editor','Редактор скінів','Skin-Editor','Éditeur de skins','Editor de skins','Editor de skins','Edytor skinów','Görünüm düzenleyici','皮肤编辑器'],
    mapsBrowser:  ['Обзор карт','Maps Browser','Огляд карт','Kartenübersicht','Cartes','Mapas','Mapas','Przeglądarka map','Haritalar','地图库'],
    skinsBrowser: ['Обзор скинов','Skins Browser','Огляд скінів','Skin-Übersicht','Skins','Skins','Skins','Przeglądarka skinów','Görünümler','皮肤库'],
    avatar:       ['Аватар','Avatar','Аватар','Avatar','Avatar','Avatar','Avatar','Awatar','Avatar','头像'],
    shop:         ['Магазин','Shop','Магазин','Shop','Boutique','Tienda','Loja','Sklep','Mağaza','商店'],
    logs:         ['Новости','Logs','Новини','Neuigkeiten','Journal','Novedades','Novidades','Aktualności','Günlük','更新日志'],
    menu:         ['Меню','Menu','Меню','Menü','Menu','Menú','Menu','Menu','Menü','菜单'],
    supporters:   ['Поддержавшие','Supporters','Ті, хто підтримав','Unterstützer','Soutiens','Colaboradores','Apoiadores','Wspierający','Destekçiler','支持者'],
    tutorial:     ['Обучение редактору','Editor Tutorial','Навчання редактору','Editor-Tutorial','Tutoriel','Tutorial','Tutorial','Samouczek','Eğitim','编辑器教程'],
    privacy:      ['Политика конфиденциальности','Privacy Policy','Політика конфіденційності','Datenschutz','Confidentialité','Privacidad','Privacidade','Prywatność','Gizlilik','隐私政策'],
    terms:        ['Условия использования','Terms & Conditions','Умови використання','Nutzungsbedingungen','Conditions','Términos','Termos','Regulamin','Şartlar','使用条款'],
    settings:     ['Настройки','Settings','Налаштування','Einstellungen','Paramètres','Ajustes','Configurações','Ustawienia','Ayarlar','设置'],
    viewProfile:  ['Мой профиль','View profile','Мій профіль','Profil ansehen','Voir le profil','Ver perfil','Ver perfil','Mój profil','Profili gör','查看资料'],
    logout:       ['Выйти','Log out','Вийти','Abmelden','Déconnexion','Salir','Sair','Wyloguj','Çıkış','退出'],
    signin:       ['Войти','Sign in','Увійти','Anmelden','Connexion','Entrar','Entrar','Zaloguj','Giriş','登录'],

    /* ---------- режимы ---------- */
    twoPlayer:    ['Игра на двоих','Two Player Adventure','Гра на двох','Zwei Spieler','Deux joueurs','Dos jugadores','Dois jogadores','Dla dwojga','İki oyuncu','双人冒险'],
    hideAndSeek:  ['Прятки','Hide and Seek','Хованки','Verstecken','Cache-cache','Escondite','Esconde-esconde','Chowany','Saklambaç','捉迷藏'],
    sandbox:      ['Песочница','Sandbox','Пісочниця','Sandkasten','Bac à sable','Sandbox','Sandbox','Piaskownica','Serbest mod','沙盒'],
    race:         ['Гонка','Race','Перегони','Rennen','Course','Carrera','Corrida','Wyścig','Yarış','竞速'],

    /* ---------- вход ---------- */
    signInOrUp:   ['Вход или регистрация','Sign in or sign up','Вхід або реєстрація','Anmelden oder registrieren','Connexion ou inscription','Entrar o registrarse','Entrar ou registar','Zaloguj lub zarejestruj','Giriş veya kayıt','登录或注册'],
    loginAcc:     ['Войти в аккаунт','Log in','Увійти в акаунт','Einloggen','Se connecter','Iniciar sesión','Iniciar sessão','Zaloguj się','Hesaba gir','登录账号'],
    createAcc:    ['Создать аккаунт','Create account','Створити акаунт','Konto erstellen','Créer un compte','Crear cuenta','Criar conta','Utwórz konto','Hesap oluştur','创建账号'],
    phLogin:      ['Логин','Username','Логін','Benutzername','Identifiant','Usuario','Utilizador','Login','Kullanıcı adı','用户名'],
    phPass:       ['Пароль','Password','Пароль','Passwort','Mot de passe','Contraseña','Palavra-passe','Hasło','Şifre','密码'],
    enterLogin:   ['Введите логин','Enter a username','Введіть логін','Benutzername eingeben','Saisissez un identifiant','Introduce el usuario','Introduza o utilizador','Podaj login','Kullanıcı adı gir','请输入用户名'],
    enterPass:    ['Введите пароль','Enter a password','Введіть пароль','Passwort eingeben','Saisissez un mot de passe','Introduce la contraseña','Introduza a palavra-passe','Podaj hasło','Şifre gir','请输入密码'],
    checking:     ['Проверяю…','Checking…','Перевіряю…','Prüfe…','Vérification…','Comprobando…','A verificar…','Sprawdzam…','Kontrol ediliyor…','验证中…'],
    creating:     ['Создаю…','Creating…','Створюю…','Erstelle…','Création…','Creando…','A criar…','Tworzę…','Oluşturuluyor…','创建中…'],

    /* ---------- редактор скинов ---------- */
    skinTitle:    ['Редактор скинов','Skin Editor','Редактор скінів','Skin-Editor','Éditeur de skins','Editor de skins','Editor de skins','Edytor skinów','Görünüm düzenleyici','皮肤编辑器'],
    slotColor:    ['Цвет','Colour','Колір','Farbe','Couleur','Color','Cor','Kolor','Renk','颜色'],
    slotHead:     ['Голова','Head','Голова','Kopf','Tête','Cabeza','Cabeça','Głowa','Kafa','头部'],
    slotFace:     ['Лицо','Face','Обличчя','Gesicht','Visage','Cara','Rosto','Twarz','Yüz','面部'],
    slotBody:     ['Тело','Body','Тіло','Körper','Corps','Cuerpo','Corpo','Ciało','Gövde','身体'],
    slotHands:    ['Руки','Hands','Руки','Hände','Mains','Manos','Mãos','Ręce','Eller','手部'],
    slotFeet:     ['Ноги','Feet','Ноги','Füße','Pieds','Pies','Pés','Stopy','Ayaklar','脚部'],
    slotBack:     ['За спиной','Back','За спиною','Rücken','Dos','Espalda','Costas','Plecy','Sırt','背部'],
    buy:          ['Купить','Buy','Купити','Kaufen','Acheter','Comprar','Comprar','Kup','Satın al','购买'],
    equip:        ['Надеть','Equip','Вдягнути','Anlegen','Équiper','Equipar','Equipar','Załóż','Kuşan','装备'],
    equipped:     ['Надето','Equipped','Вдягнено','Angelegt','Équipé','Equipado','Equipado','Założone','Kuşanıldı','已装备'],
    ownedTxt:     ['Куплено','Owned','Куплено','Gekauft','Acheté','Comprado','Comprado','Kupione','Sahipsin','已拥有'],
    free:         ['Бесплатно','Free','Безкоштовно','Kostenlos','Gratuit','Gratis','Grátis','Za darmo','Ücretsiz','免费'],
    coins:        ['Монеты','Coins','Монети','Münzen','Pièces','Monedas','Moedas','Monety','Jeton','金币'],
    notEnough:    ['Не хватает монет','Not enough coins','Не вистачає монет','Nicht genug Münzen','Pièces insuffisantes','Faltan monedas','Moedas insuficientes','Za mało monet','Yeterli jeton yok','金币不足'],
    saved:        ['Сохранено','Saved','Збережено','Gespeichert','Enregistré','Guardado','Guardado','Zapisano','Kaydedildi','已保存'],
    save:         ['Сохранить','Save','Зберегти','Speichern','Enregistrer','Guardar','Guardar','Zapisz','Kaydet','保存'],
    randomize:    ['Случайный образ','Randomise','Випадковий образ','Zufällig','Aléatoire','Aleatorio','Aleatório','Losowo','Rastgele','随机'],
    resetAll:     ['Сбросить','Reset','Скинути','Zurücksetzen','Réinitialiser','Restablecer','Repor','Resetuj','Sıfırla','重置'],
    shopTab:      ['Магазин','Shop','Магазин','Shop','Boutique','Tienda','Loja','Sklep','Mağaza','商店'],
    myTab:        ['Мои вещи','My items','Мої речі','Meine Sachen','Mes objets','Mis objetos','Os meus itens','Moje rzeczy','Eşyalarım','我的物品'],
    preview:      ['Предпросмотр','Preview','Попередній перегляд','Vorschau','Aperçu','Vista previa','Pré-visualização','Podgląd','Önizleme','预览'],

    /* ---------- язык ---------- */
    language:     ['Язык','Language','Мова','Sprache','Langue','Idioma','Idioma','Język','Dil','语言'],
    langAuto:     ['Автоматически (по стране)','Automatic (by country)','Автоматично (за країною)','Automatisch (nach Land)','Automatique (par pays)','Automático (por país)','Automático (por país)','Automatycznie (wg kraju)','Otomatik (ülkeye göre)','自动（按国家）'],
    langHint:     ['Интерфейс переводится сам по стране игрока. Можно выбрать язык вручную.','The interface is translated automatically by country. You can pick a language manually.','Інтерфейс перекладається автоматично за країною. Мову можна обрати вручну.','Die Oberfläche wird automatisch nach Land übersetzt. Sprache ist manuell wählbar.','L\'interface est traduite automatiquement selon le pays. Vous pouvez choisir la langue.','La interfaz se traduce automáticamente según el país. Puedes elegir el idioma.','A interface é traduzida automaticamente pelo país. Pode escolher o idioma.','Interfejs tłumaczy się automatycznie wg kraju. Język można wybrać ręcznie.','Arayüz ülkeye göre otomatik çevrilir. Dili elle seçebilirsin.','界面按国家自动翻译，也可手动选择语言。'],

    /* ---------- обзор карт ---------- */
    colName:      ['Название','Name','Назва','Name','Nom','Nombre','Nome','Nazwa','Ad','名称'],
    colRating:    ['Рейтинг','Rating','Рейтинг','Bewertung','Note','Valoración','Avaliação','Ocena','Puan','评分'],
    colAuthor:    ['Автор','Author','Автор','Autor','Auteur','Autor','Autor','Autor','Yazar','作者'],
    colDate:      ['Дата','Date','Дата','Datum','Date','Fecha','Data','Data','Tarih','日期'],
    play:         ['Играть','PLAY','Грати','Spielen','Jouer','Jugar','Jogar','Graj','Oyna','开始'],
    refresh:      ['Обновить','Refresh','Оновити','Aktualisieren','Actualiser','Actualizar','Atualizar','Odśwież','Yenile','刷新'],
    noMaps:       ['Карты не найдены','No maps found','Карти не знайдено','Keine Karten gefunden','Aucune carte','No hay mapas','Sem mapas','Brak map','Harita yok','未找到地图'],
    sortDate:     ['Сортировать по дате','Sort by date','Сортувати за датою','Nach Datum','Trier par date','Ordenar por fecha','Ordenar por data','Sortuj wg daty','Tarihe göre','按日期排序'],
    sortRating:   ['Сортировать по рейтингу','Sort by rating','Сортувати за рейтингом','Nach Bewertung','Trier par note','Ordenar por valoración','Ordenar por avaliação','Sortuj wg oceny','Puana göre','按评分排序'],
    modeAll:      ['Режим: все','Mode: All','Режим: усі','Modus: alle','Mode : tous','Modo: todos','Modo: todos','Tryb: wszystkie','Mod: hepsi','模式：全部'],

    /* ---------- инструменты владельца ---------- */
    ownerTools:   ['Инструменты владельца','Owner tools','Інструменти власника','Besitzer-Werkzeuge','Outils du propriétaire','Herramientas del dueño','Ferramentas do dono','Narzędzia właściciela','Sahip araçları','所有者工具'],
    addToGame:    ['Добавить в игру','Add to game','Додати в гру','Ins Spiel','Ajouter au jeu','Añadir al juego','Adicionar ao jogo','Dodaj do gry','Oyuna ekle','加入游戏'],
    inGameTxt:    ['В игре','In game','У грі','Im Spiel','Dans le jeu','En el juego','No jogo','W grze','Oyunda','已在游戏中'],
    removeGame:   ['Убрать из игры','Remove from game','Прибрати з гри','Aus dem Spiel','Retirer du jeu','Quitar del juego','Remover do jogo','Usuń z gry','Oyundan çıkar','移出游戏'],
    boostVotes:   ['Накрутка оценок','Set votes','Накрутка оцінок','Bewertungen setzen','Définir les votes','Fijar votos','Definir votos','Ustaw oceny','Oyları ayarla','设置投票'],
    likes:        ['Лайки','Likes','Лайки','Likes','J\'aime','Me gusta','Gostos','Polubienia','Beğeni','点赞'],
    dislikes:     ['Дизлайки','Dislikes','Дизлайки','Dislikes','Je n\'aime pas','No me gusta','Não gostos','Nie lubię','Beğenmeme','点踩'],
    apply:        ['Применить','Apply','Застосувати','Übernehmen','Appliquer','Aplicar','Aplicar','Zastosuj','Uygula','应用'],
    giveCoins:    ['Выдать монеты','Give coins','Видати монети','Münzen geben','Donner des pièces','Dar monedas','Dar moedas','Daj monety','Jeton ver','发放金币'],
    amount:       ['Количество','Amount','Кількість','Menge','Quantité','Cantidad','Quantidade','Ilość','Miktar','数量'],
    playerName:   ['Ник игрока','Player name','Нік гравця','Spielername','Nom du joueur','Nombre del jugador','Nome do jogador','Nick gracza','Oyuncu adı','玩家名'],
    onlyOwner:    ['Доступно только владельцу','Owner only','Доступно лише власнику','Nur für den Besitzer','Réservé au propriétaire','Solo para el dueño','Apenas para o dono','Tylko dla właściciela','Sadece sahip','仅所有者'],

    /* ---------- редактор карт ---------- */
    coinLimit:    ['В карте можно поставить максимум 3 монеты','A map can hold at most 3 coins','У карті можна поставити максимум 3 монети','Eine Karte darf höchstens 3 Münzen enthalten','Une carte accepte 3 pièces au maximum','Un mapa admite 3 monedas como máximo','Um mapa aceita no máximo 3 moedas','Mapa może mieć maksymalnie 3 monety','Bir haritada en fazla 3 jeton olabilir','一张地图最多放 3 枚金币'],
    publishMap:   ['Опубликовать в Maps Browser','Publish to Maps Browser','Опублікувати в Maps Browser','In Maps Browser veröffentlichen','Publier dans Maps Browser','Publicar en Maps Browser','Publicar no Maps Browser','Opublikuj w Maps Browser','Maps Browser\'a yayınla','发布到地图库'],

    /* ---------- общее ---------- */
    close:        ['Закрыть','Close','Закрити','Schließen','Fermer','Cerrar','Fechar','Zamknij','Kapat','关闭'],
    back:         ['Назад','Back','Назад','Zurück','Retour','Atrás','Voltar','Wstecz','Geri','返回'],
    cancel:       ['Отмена','Cancel','Скасувати','Abbrechen','Annuler','Cancelar','Cancelar','Anuluj','İptal','取消'],
    loading:      ['Загрузка…','Loading…','Завантаження…','Lädt…','Chargement…','Cargando…','A carregar…','Ładowanie…','Yükleniyor…','加载中…'],
    errorTxt:     ['Ошибка','Error','Помилка','Fehler','Erreur','Error','Erro','Błąd','Hata','错误'],
    serverDown:   ['Сервер недоступен','Server unavailable','Сервер недоступний','Server nicht erreichbar','Serveur indisponible','Servidor no disponible','Servidor indisponível','Serwer niedostępny','Sunucuya ulaşılamıyor','服务器不可用'],
    loginFirst:   ['Сначала войдите в аккаунт','Log in first','Спершу увійдіть в акаунт','Bitte zuerst anmelden','Connectez-vous d\'abord','Inicia sesión primero','Inicie sessão primeiro','Najpierw się zaloguj','Önce giriş yap','请先登录'],
    guest:        ['Гость','Guest','Гість','Gast','Invité','Invitado','Convidado','Gość','Misafir','访客'],
    notReady:     ['Этот раздел ещё не готов','This section is not ready yet','Цей розділ ще не готовий','Dieser Bereich ist noch nicht fertig','Cette section n\'est pas prête','Esta sección aún no está lista','Esta secção ainda não está pronta','Ta sekcja nie jest gotowa','Bu bölüm henüz hazır değil','该板块尚未开放']
  };

  /* строки, которые рисуют чужие бандлы — ловим по тексту */
  var AUTO = {
    'Leaderboard': 'leaderboard', 'Leaderboards': 'leaderboard',
    'Editor': 'editor', 'Browser': 'browser', 'Menu': 'menu',
    'Map Editor': 'mapEditor', 'Skin Editor': 'skinEditor',
    'Maps Browser': 'mapsBrowser', 'Skins Browser': 'skinsBrowser',
    'Avatar': 'avatar', 'Shop': 'shop', 'Logs': 'logs',
    'Supporters': 'supporters', 'Editor Tutorial': 'tutorial',
    'Privacy Policy': 'privacy', 'Terms & Conditions': 'terms',
    'View profile': 'viewProfile', 'Settings': 'settings', 'Log out': 'logout',
    'Sign in': 'signin', 'Sign In or Sign Up': 'signInOrUp',
    'Name': 'colName', 'Rating': 'colRating', 'Author': 'colAuthor', 'Date': 'colDate',
    'PLAY': 'play', 'Refresh': 'refresh', 'No maps found': 'noMaps',
    'Sort by date': 'sortDate', 'Sort by rating': 'sortRating', 'Mode: All': 'modeAll',
    'Author Name': 'colAuthor',
    'Mode: Two Player Adventure': 'twoPlayer', 'Mode: Hide And Seek': 'hideAndSeek',
    'Mode: Race': 'race', 'Two Player Adventure': 'twoPlayer',
    'Hide and Seek': 'hideAndSeek', 'Sandbox': 'sandbox', 'Race': 'race',
    'Таблица лидеров': 'leaderboard', 'Новости': 'logs', 'Настройки': 'settings',
    'Мой профиль': 'viewProfile', 'Выйти': 'logout', 'Войти': 'signin',
    'Вход или регистрация': 'signInOrUp', 'Войти в аккаунт': 'loginAcc',
    'Создать аккаунт': 'createAcc', 'Гость': 'guest', 'Загрузка…': 'loading'
  };

  var lang = 'ru';
  var idx = 0;

  function t(key) {
    var row = D[key];
    if (!row) return key;
    return row[idx] || row[0];
  }

  /* ---------- перевод DOM ---------- */
  function applyTo(root) {
    if (!root || !root.querySelectorAll) return;

    var marked = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < marked.length; i++) {
      var k = marked[i].getAttribute('data-i18n');
      if (D[k]) marked[i].textContent = t(k);
    }
    var ph = root.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < ph.length; j++) {
      var k2 = ph[j].getAttribute('data-i18n-ph');
      if (D[k2]) ph[j].setAttribute('placeholder', t(k2));
    }
    var ti = root.querySelectorAll('[data-i18n-title]');
    for (var n = 0; n < ti.length; n++) {
      var k3 = ti[n].getAttribute('data-i18n-title');
      if (D[k3]) ti[n].setAttribute('title', t(k3));
    }
    autoText(root);
  }

  // подмена текстов, которые рисует чужой код
  function autoText(root) {
    if (lang === 'ru') {
      // русский — переводим только английские подписи вендора
      walk(root, function (s) { return AUTO[s] && D[AUTO[s]][0] !== s ? t(AUTO[s]) : null; });
      return;
    }
    walk(root, function (s) { return AUTO[s] ? t(AUTO[s]) : null; });
  }

  function walk(root, map) {
    var w;
    try {
      w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    } catch (e) { return; }
    var list = [], node;
    while ((node = w.nextNode())) list.push(node);
    for (var i = 0; i < list.length; i++) {
      var tn = list[i];
      var p = tn.parentNode;
      if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.__noI18n) continue;
      var raw = tn.nodeValue;
      var trimmed = raw.trim();
      if (!trimmed || trimmed.length > 60) continue;
      var next = map(trimmed);
      if (next && next !== trimmed) tn.nodeValue = raw.replace(trimmed, next);
    }
    // варианты у <option> и <input value>
    var opts = root.querySelectorAll ? root.querySelectorAll('option') : [];
    for (var o = 0; o < opts.length; o++) {
      var ov = (opts[o].textContent || '').trim();
      var nv = map(ov);
      if (nv && nv !== ov) opts[o].textContent = nv;
    }
    var inputs = root.querySelectorAll ? root.querySelectorAll('input[placeholder]') : [];
    for (var q = 0; q < inputs.length; q++) {
      var pv = (inputs[q].getAttribute('placeholder') || '').trim();
      var pn = map(pv);
      if (pn && pn !== pv) inputs[q].setAttribute('placeholder', pn);
    }
  }

  /* ---------- уточнение по часовому поясу (бесплатно, без сети) ---------- */
  var TZ = {
    'Europe/Moscow': 'ru', 'Europe/Samara': 'ru', 'Asia/Yekaterinburg': 'ru',
    'Asia/Novosibirsk': 'ru', 'Asia/Krasnoyarsk': 'ru', 'Asia/Irkutsk': 'ru',
    'Asia/Vladivostok': 'ru', 'Europe/Minsk': 'ru', 'Asia/Almaty': 'ru',
    'Europe/Kiev': 'uk', 'Europe/Kyiv': 'uk',
    'Europe/Berlin': 'de', 'Europe/Vienna': 'de', 'Europe/Zurich': 'de',
    'Europe/Paris': 'fr', 'Europe/Brussels': 'fr',
    'Europe/Madrid': 'es', 'America/Mexico_City': 'es', 'America/Bogota': 'es',
    'America/Argentina/Buenos_Aires': 'es', 'America/Santiago': 'es', 'America/Lima': 'es',
    'Europe/Lisbon': 'pt', 'America/Sao_Paulo': 'pt',
    'Europe/Warsaw': 'pl', 'Europe/Istanbul': 'tr',
    'Asia/Shanghai': 'zh', 'Asia/Taipei': 'zh', 'Asia/Hong_Kong': 'zh'
  };
  function guess() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (TZ[tz]) return TZ[tz];
    } catch (e) {}
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    var base = String(nav).toLowerCase().split('-')[0];
    if (LANGS.indexOf(base) !== -1) return base;
    if (['be', 'kk', 'ky', 'uz', 'hy', 'az'].indexOf(base) !== -1) return 'ru';
    return 'en';
  }

  function setLang(next, silent) {
    if (LANGS.indexOf(next) === -1) next = 'en';
    lang = next;
    idx = LANGS.indexOf(next);
    document.documentElement.setAttribute('lang', next);
    applyTo(document.body || document.documentElement);
    if (!silent) {
      try { localStorage.setItem('bfLang', next); } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('bf-lang', { detail: { lang: next } }));
  }

  function save(next) {
    var body = 'lang=' + encodeURIComponent(next);
    fetch('/i18n/set', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body
    }).catch(function () {});
    if (next === 'auto') { try { localStorage.removeItem('bfLang'); } catch (e) {} setLang(guess()); }
    else setLang(next);
  }

  /* ---------- старт ---------- */
  function boot() {
    var cached = null;
    try { cached = localStorage.getItem('bfLang'); } catch (e) {}
    if (cached && LANGS.indexOf(cached) !== -1) setLang(cached, true);

    fetch('/i18n/detect', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var next = (d && d.lang) || 'en';
        if (d && d.source === 'auto' && !cached) next = guess();
        if (cached && LANGS.indexOf(cached) !== -1 && !(d && d.saved)) next = cached;
        setLang(next, true);
      })
      .catch(function () { if (!cached) setLang(guess(), true); });

    // чужие бандлы дорисовывают интерфейс позже — следим
    try {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          for (var j = 0; j < muts[i].addedNodes.length; j++) {
            var n = muts[i].addedNodes[j];
            if (n.nodeType === 1) applyTo(n);
          }
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  window.I18N = {
    t: t, apply: applyTo, set: save, langs: LANGS, names: NAMES,
    get current() { return lang; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

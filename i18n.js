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

    skinSub:      ['Все детали бесплатны. Готовый образ можно выложить в Skins Browser.','Every part is free. Publish your look to the Skins Browser.','Усі деталі безкоштовні. Готовий образ можна викласти в Skins Browser.','Alle Teile sind kostenlos. Veröffentliche deinen Look im Skins Browser.','Toutes les pièces sont gratuites. Publiez votre look dans le Skins Browser.','Todas las piezas son gratis. Publica tu look en el Skins Browser.','Todas as peças são grátis. Publique o seu visual no Skins Browser.','Wszystkie części są darmowe. Opublikuj swój wygląd w Skins Browser.','Tüm parçalar ücretsiz. Görünümünü Skins Browser\'a yayınla.','所有部件均免费，可将造型发布到皮肤库。'],
    skinsSub:     ['Скины игроков. Оценивайте чужие работы и примеряйте понравившиеся.','Player skins. Rate other people\'s work and try on what you like.','Скіни гравців. Оцінюйте чужі роботи та приміряйте вподобані.','Spieler-Skins. Bewerte andere und probiere aus, was dir gefällt.','Skins des joueurs. Notez le travail des autres et essayez ce qui vous plaît.','Skins de jugadores. Valora el trabajo de otros y pruébate lo que te guste.','Skins de jogadores. Avalie o trabalho de outros e experimente o que gostar.','Skiny graczy. Oceniaj prace innych i przymierzaj to, co lubisz.','Oyuncu görünümleri. Başkalarını oyla ve beğendiğini dene.','玩家皮肤。为他人作品评分，试穿你喜欢的。'],
    avatarSub:    ['Готовые скины, отобранные разработчиком. Автор каждого скина указан на карточке.','Ready-made skins picked by the developer. Each card credits its author.','Готові скіни, відібрані розробником. Автор кожного скіна вказаний на картці.','Vom Entwickler ausgewählte Skins. Auf jeder Karte steht der Autor.','Skins choisis par le développeur. Chaque carte crédite son auteur.','Skins elegidos por el desarrollador. Cada tarjeta indica su autor.','Skins escolhidos pelo programador. Cada cartão indica o autor.','Skiny wybrane przez twórcę. Każda karta wskazuje autora.','Geliştiricinin seçtiği görünümler. Her kartta yazarı yazar.','由开发者精选的皮肤，每张卡片标注作者。'],
    publishSkin:  ['Выложить в Skins Browser','Publish to Skins Browser','Викласти в Skins Browser','Im Skins Browser veröffentlichen','Publier dans le Skins Browser','Publicar en el Skins Browser','Publicar no Skins Browser','Opublikuj w Skins Browser','Skins Browser\'a yayınla','发布到皮肤库'],
    skinsLeft:    ['Сегодня можно выложить','Publishable today','Сьогодні можна викласти','Heute veröffentlichbar','Publiable aujourd\'hui','Se puede publicar hoy','Pode publicar hoje','Dziś można opublikować','Bugün yayınlanabilir','今日可发布'],
    skinNameAsk:  ['Название скина (2–30 символов):','Skin name (2–30 characters):','Назва скіна (2–30 символів):','Skin-Name (2–30 Zeichen):','Nom du skin (2–30 caractères) :','Nombre del skin (2–30 caracteres):','Nome do skin (2–30 caracteres):','Nazwa skina (2–30 znaków):','Görünüm adı (2–30 karakter):','皮肤名称（2–30 个字符）：'],
    skinNameShort:['Слишком короткое название','Name is too short','Занадто коротка назва','Name zu kurz','Nom trop court','Nombre demasiado corto','Nome muito curto','Nazwa za krótka','Ad çok kısa','名称太短'],
    openSkinsBrowser:['Открыть Skins Browser?','Open the Skins Browser?','Відкрити Skins Browser?','Skins Browser öffnen?','Ouvrir le Skins Browser ?','¿Abrir el Skins Browser?','Abrir o Skins Browser?','Otworzyć Skins Browser?','Skins Browser açılsın mı?','打开皮肤库？'],
    noSkins:      ['Скины не найдены','No skins found','Скіни не знайдено','Keine Skins gefunden','Aucun skin','No hay skins','Sem skins','Brak skinów','Görünüm yok','未找到皮肤'],
    tryOn:        ['Примерить','Try on','Приміряти','Anprobieren','Essayer','Probar','Experimentar','Przymierz','Dene','试穿'],
    wornOk:       ['Скин надет','Skin equipped','Скін вдягнено','Skin angelegt','Skin équipé','Skin equipado','Skin equipado','Skin założony','Görünüm kuşanıldı','已装备皮肤'],
    toAvatar:     ['В Avatar','To Avatar','В Avatar','Zu Avatar','Vers Avatar','A Avatar','Para Avatar','Do Avatar','Avatar\'a','加入 Avatar'],
    removeAvatar: ['Убрать из Avatar','Remove from Avatar','Прибрати з Avatar','Aus Avatar entfernen','Retirer d\'Avatar','Quitar de Avatar','Remover de Avatar','Usuń z Avatar','Avatar\'dan çıkar','移出 Avatar'],
    priceCoins:   ['Цена в монетах','Price in coins','Ціна в монетах','Preis in Münzen','Prix en pièces','Precio en monedas','Preço em moedas','Cena w monetach','Jeton fiyatı','价格（金币）'],
    avatarEmpty:  ['Разработчик пока не отобрал ни одного скина. Свои образы можно выкладывать в Skins Browser.','The developer has not picked any skins yet. You can publish your own in the Skins Browser.','Розробник поки не відібрав жодного скіна. Свої образи можна викладати в Skins Browser.','Der Entwickler hat noch keine Skins ausgewählt. Eigene kannst du im Skins Browser veröffentlichen.','Le développeur n\'a encore choisi aucun skin. Publiez le vôtre dans le Skins Browser.','El desarrollador aún no ha elegido skins. Publica el tuyo en el Skins Browser.','O programador ainda não escolheu skins. Publique o seu no Skins Browser.','Twórca nie wybrał jeszcze skinów. Swoje możesz opublikować w Skins Browser.','Geliştirici henüz görünüm seçmedi. Kendininkini Skins Browser\'da yayınla.','开发者尚未挑选皮肤，你可以在皮肤库发布自己的作品。'],
    skinBy:       ['Скин','Skin','Скін','Skin','Skin','Skin','Skin','Skin','Görünüm','皮肤'],
    ownSkin:      ['Собственный образ','Your own look','Власний образ','Eigener Look','Votre propre look','Tu propio look','O seu visual','Własny wygląd','Kendi görünümün','你自己的造型'],
    bought:       ['Куплено','Purchased','Куплено','Gekauft','Acheté','Comprado','Comprado','Kupione','Satın alındı','已购买'],

    addFromUrl:   ['Из ссылки','From URL','З посилання','Aus URL','Depuis un lien','Desde enlace','A partir de link','Z linku','Bağlantıdan','从链接'],
    addFromFile:  ['Из файла','From file','З файлу','Aus Datei','Depuis un fichier','Desde archivo','A partir de ficheiro','Z pliku','Dosyadan','从文件'],
    setImage:     ['Задать картинку','Set image','Задати картинку','Bild setzen','Définir l\'image','Poner imagen','Definir imagem','Ustaw obraz','Görsel ata','设置图片'],
    changeImage:  ['Сменить картинку','Change image','Змінити картинку','Bild ändern','Changer l\'image','Cambiar imagen','Mudar imagem','Zmień obraz','Görseli değiştir','更换图片'],
    imageAsk:     ['Ссылка на картинку (пусто — убрать):','Image URL (empty to remove):','Посилання на картинку (порожньо — прибрати):','Bild-URL (leer zum Entfernen):','Lien de l\'image (vide pour retirer) :','Enlace de la imagen (vacío para quitar):','Link da imagem (vazio para remover):','Link do obrazu (puste — usuń):','Görsel bağlantısı (boş — kaldır):','图片链接（留空则移除）：'],
    needUrl:      ['Вставьте ссылку на картинку','Paste an image URL','Вставте посилання на картинку','Bild-URL einfügen','Collez un lien d\'image','Pega un enlace de imagen','Cole um link de imagem','Wklej link do obrazu','Görsel bağlantısı yapıştır','请粘贴图片链接'],
    imgTooBig:    ['Картинка слишком тяжёлая даже после сжатия','Image is too heavy even after compression','Картинка завелика навіть після стиснення','Bild ist auch komprimiert zu groß','Image trop lourde même compressée','La imagen pesa demasiado incluso comprimida','Imagem pesada demais mesmo comprimida','Obraz za ciężki nawet po kompresji','Görsel sıkıştırıldıktan sonra da çok büyük','图片压缩后仍然过大'],
    imgBad:       ['Не удалось прочитать картинку','Could not read the image','Не вдалося прочитати картинку','Bild konnte nicht gelesen werden','Impossible de lire l\'image','No se pudo leer la imagen','Não foi possível ler a imagem','Nie udało się odczytać obrazu','Görsel okunamadı','无法读取图片'],

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

    joinDate:     ['Дата регистрации','Join Date','Дата реєстрації','Beitrittsdatum','Date d\'inscription','Fecha de registro','Data de registo','Data rejestracji','Katılma tarihi','注册日期'],
    accept:       ['Принять','Accept','Прийняти','Annehmen','Accepter','Aceptar','Aceitar','Akceptuj','Kabul et','接受'],
    decline:      ['Отклонить','Decline','Відхилити','Ablehnen','Refuser','Rechazar','Recusar','Odrzuć','Reddet','拒绝'],
    searchUsers:  ['Поиск игроков','Search users','Пошук гравців','Spieler suchen','Rechercher des joueurs','Buscar jugadores','Procurar jogadores','Szukaj graczy','Oyuncu ara','搜索玩家'],
    addFriend:    ['Добавить в друзья','Add friend','Додати в друзі','Freund hinzufügen','Ajouter en ami','Añadir amigo','Adicionar amigo','Dodaj znajomego','Arkadaş ekle','加为好友'],
    report:       ['Пожаловаться','Report','Поскаржитися','Melden','Signaler','Reportar','Denunciar','Zgłoś','Bildir','举报'],
    editTxt:      ['Изменить','Edit','Змінити','Bearbeiten','Modifier','Editar','Editar','Edytuj','Düzenle','编辑'],
    removeTxt:    ['Удалить','Remove','Видалити','Entfernen','Retirer','Quitar','Remover','Usuń','Kaldır','移除'],
    friendsTxt:   ['Друзья','Friends','Друзі','Freunde','Amis','Amigos','Amigos','Znajomi','Arkadaşlar','好友'],
    requestsTxt:  ['Заявки','Requests','Заявки','Anfragen','Demandes','Solicitudes','Pedidos','Zaproszenia','İstekler','请求'],
    pendingTxt:   ['Отправленные','Pending','Надіслані','Ausstehend','En attente','Pendientes','Pendentes','Oczekujące','Bekleyen','待处理'],
    mapsTxt:      ['Карты','Maps','Карти','Karten','Cartes','Mapas','Mapas','Mapy','Haritalar','地图'],
    skinsTxt:     ['Скины','Skins','Скіни','Skins','Skins','Skins','Skins','Skiny','Görünümler','皮肤'],

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
    'Play': 'play', 'Mode: All': 'modeAll', 'Sort by rating': 'sortRating',
    'Sort by date': 'sortDate', 'Refresh': 'refresh', 'Author': 'colAuthor',
    'Name': 'colName', 'Rating': 'colRating', 'Date': 'colDate',
    'Two Player Adventure': 'twoPlayer', 'Hide And Seek': 'hideAndSeek',
    'Join Date': 'joinDate', 'Add friend': 'addFriend', 'Remove': 'removeTxt',
    'Accept': 'accept', 'Decline': 'decline', 'Cancel': 'cancel',
    'Equip': 'equip', 'Equipped': 'equipped', 'Free': 'free', 'Buy': 'buy',
    'Try on': 'tryOn', 'Save': 'save', 'Reset': 'resetAll', 'Randomise': 'randomize',
    'Head': 'slotHead', 'Face': 'slotFace', 'Body': 'slotBody', 'Back': 'slotBack',
    'Shop': 'shop', 'My items': 'myTab', 'Preview': 'preview',
    'Publish to Skins Browser': 'publishSkin',
    'Author Name': 'colAuthor', 'Skin Name': 'colName',
    'Search users': 'searchUsers', 'Add friend': 'addFriend', 'Report': 'report',
    'Edit': 'editTxt', 'Remove': 'removeTxt', 'Friends': 'friendsTxt',
    'Requests': 'requestsTxt', 'Pending': 'pendingTxt', 'Maps': 'mapsTxt', 'Skins': 'skinsTxt',
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
    // чужие скрипты рисуют интерфейс с задержкой — добираем их
    setTimeout(function () { applyTo(document.body || document.documentElement); }, 250);
    setTimeout(function () { applyTo(document.body || document.documentElement); }, 900);
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

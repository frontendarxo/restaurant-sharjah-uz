/* Samarkand Madina — cart, checkout with UAE-only address, order sent to the restaurant's WhatsApp.
   Optional: set GOOGLE_MAPS_KEY to a Maps JavaScript API key (Places enabled) to add Google address
   suggestions restricted to the UAE. Without a key the built-in list of UAE areas is used. */
(function(){
  var GOOGLE_MAPS_KEY = (window.SM_CONFIG && window.SM_CONFIG.googleMapsKey) || "";
  var SM = window.SM;
  var UAE_BOUNDS = { s: 22.5, n: 26.2, w: 51.4, e: 56.5 };
  var STORE_CART = "sm-cart", STORE_ADDR = "sm-addr";

  var L = {
    en: {
      add: "Add to order", added: "Added to your order", cart: "Your order", empty: "Your order is empty. Add dishes from the menu.",
      items1: "item", items: "items", subtotal: "Subtotal", checkout: "Checkout", back_menu: "Back to menu",
      delivery: "Delivery", pickup: "Pickup", pickup_note: "Pick up at Bu Khamseen 03, Al Majaz 2, Sharjah. We will message you when it is ready.",
      addr_h: "Delivery address in the UAE", emirate: "Emirate", area: "Area", area_ph: "Start typing: Al Nahda, Qasimia, Al Majaz…",
      area_help: "Choose your area from the list. We deliver only within the UAE.",
      locate: "Use my location", locating: "Finding you…", located: "Location added", geo_out: "This location is outside the UAE. Please choose an area in the UAE.",
      geo_err: "Could not get your location. Choose your area from the list.",
      near: "Nearest area", street: "Street and building", street_ph: "e.g. Al Arouba St, Al Majaz Tower", flat: "Flat / villa", flat_ph: "e.g. Flat 1204",
      landmark: "Landmark or directions", landmark_ph: "Optional: next to Lulu, entrance from the back", makani: "Makani number", makani_ph: "Optional, 10 digits",
      contact_h: "Contact", name: "Your name", phone: "UAE mobile number", phone_help: "Format 05X XXX XXXX. The restaurant confirms the order by WhatsApp.",
      notes: "Comment for the kitchen", notes_ph: "Optional: less spicy, no onion…",
      send: "Send order on WhatsApp", fee: "Delivery fee and time are confirmed by the restaurant in WhatsApp.",
      outside_zone: "We usually deliver in Sharjah, Dubai and Ajman. For this emirate the restaurant will confirm if delivery is possible.",
      e_area: "Choose your area from the list, or use your location.", e_street: "Add the street and building.", e_flat: "Add the flat or villa number.",
      e_name: "Add your name.", e_phone: "Enter a UAE mobile number, for example 050 123 4567.", e_makani: "Makani number has 10 digits.", e_cart: "Add at least one dish.",
      no_match: "No area found. Check the spelling or pick the emirate first.",
      msg_title: "New order — Samarkand restaurant", msg_total: "Total", msg_delivery: "Delivery to", msg_pickup: "Pickup at the restaurant",
      msg_loc: "Location", msg_land: "Landmark", msg_name: "Name", msg_phone: "Phone", msg_notes: "Comment", remove: "Remove"
    },
    ru: {
      add: "В заказ", added: "Добавлено в заказ", cart: "Ваш заказ", empty: "В заказе пока пусто. Добавьте блюда из меню.",
      items1: "блюдо", items: "блюд", subtotal: "Сумма", checkout: "Оформить", back_menu: "К меню",
      delivery: "Доставка", pickup: "Самовывоз", pickup_note: "Заберите заказ по адресу Bu Khamseen 03, Al Majaz 2, Шарджа. Напишем, когда будет готово.",
      addr_h: "Адрес доставки в ОАЭ", emirate: "Эмират", area: "Район", area_ph: "Начните вводить: Al Nahda, Касимия, Аль-Маджаз…",
      area_help: "Выберите район из списка. Доставляем только по ОАЭ.",
      locate: "Определить моё место", locating: "Определяем…", located: "Геолокация добавлена", geo_out: "Это место за пределами ОАЭ. Выберите район в ОАЭ.",
      geo_err: "Не удалось определить местоположение. Выберите район из списка.",
      near: "Ближайший район", street: "Улица и здание", street_ph: "Например: Al Arouba St, Al Majaz Tower", flat: "Квартира / вилла", flat_ph: "Например: кв. 1204",
      landmark: "Ориентир", landmark_ph: "Необязательно: рядом с Lulu, вход со двора", makani: "Номер Makani", makani_ph: "Необязательно, 10 цифр",
      contact_h: "Контакты", name: "Ваше имя", phone: "Мобильный номер ОАЭ", phone_help: "Формат 05X XXX XXXX. Ресторан подтвердит заказ в WhatsApp.",
      notes: "Комментарий для кухни", notes_ph: "Необязательно: менее остро, без лука…",
      send: "Отправить заказ в WhatsApp", fee: "Стоимость и время доставки ресторан подтвердит в WhatsApp.",
      outside_zone: "Обычно мы доставляем по Шардже, Дубаю и Аджману. Для этого эмирата ресторан подтвердит, возможна ли доставка.",
      e_area: "Выберите район из списка или определите местоположение.", e_street: "Укажите улицу и здание.", e_flat: "Укажите номер квартиры или виллы.",
      e_name: "Укажите имя.", e_phone: "Введите мобильный номер ОАЭ, например 050 123 4567.", e_makani: "В номере Makani 10 цифр.", e_cart: "Добавьте хотя бы одно блюдо.",
      no_match: "Район не найден. Проверьте написание или сначала выберите эмират.",
      msg_title: "Новый заказ — ресторан «Самарканд»", msg_total: "Итого", msg_delivery: "Доставка", msg_pickup: "Самовывоз из ресторана",
      msg_loc: "Геолокация", msg_land: "Ориентир", msg_name: "Имя", msg_phone: "Телефон", msg_notes: "Комментарий", remove: "Убрать"
    },
    ar: {
      add: "أضف إلى الطلب", added: "أُضيف إلى طلبك", cart: "طلبك", empty: "طلبك فارغ. أضف أطباقاً من القائمة.",
      items1: "طبق", items: "أطباق", subtotal: "المجموع", checkout: "إتمام الطلب", back_menu: "العودة إلى القائمة",
      delivery: "توصيل", pickup: "استلام", pickup_note: "استلم طلبك من بو خمسين ٠٣، المجاز ٢، الشارقة. سنراسلك عندما يجهز.",
      addr_h: "عنوان التوصيل في الإمارات", emirate: "الإمارة", area: "المنطقة", area_ph: "ابدأ الكتابة: النهدة، القاسمية، المجاز…",
      area_help: "اختر منطقتك من القائمة. نوصّل داخل دولة الإمارات فقط.",
      locate: "استخدم موقعي", locating: "جارٍ تحديد موقعك…", located: "تمت إضافة الموقع", geo_out: "هذا الموقع خارج دولة الإمارات. اختر منطقة داخل الإمارات.",
      geo_err: "تعذّر تحديد موقعك. اختر منطقتك من القائمة.",
      near: "أقرب منطقة", street: "الشارع والمبنى", street_ph: "مثال: شارع العروبة، برج المجاز", flat: "الشقة / الفيلا", flat_ph: "مثال: شقة ١٢٠٤",
      landmark: "معلم قريب", landmark_ph: "اختياري: بجانب لولو، المدخل الخلفي", makani: "رقم مكاني", makani_ph: "اختياري، ١٠ أرقام",
      contact_h: "التواصل", name: "الاسم", phone: "رقم الجوال الإماراتي", phone_help: "بصيغة 05X XXX XXXX. يؤكد المطعم الطلب عبر واتساب.",
      notes: "ملاحظة للمطبخ", notes_ph: "اختياري: حار أقل، بدون بصل…",
      send: "أرسل الطلب عبر واتساب", fee: "يؤكد المطعم رسوم التوصيل ووقته عبر واتساب.",
      outside_zone: "نوصّل عادةً في الشارقة ودبي وعجمان. لهذه الإمارة سيؤكد المطعم إمكانية التوصيل.",
      e_area: "اختر منطقتك من القائمة أو استخدم موقعك.", e_street: "أضف الشارع والمبنى.", e_flat: "أضف رقم الشقة أو الفيلا.",
      e_name: "أضف اسمك.", e_phone: "أدخل رقم جوال إماراتي، مثل 050 123 4567.", e_makani: "رقم مكاني مكوّن من ١٠ أرقام.", e_cart: "أضف طبقاً واحداً على الأقل.",
      no_match: "لم نجد المنطقة. تحقق من الكتابة أو اختر الإمارة أولاً.",
      msg_title: "طلب جديد — مطعم سمرقند", msg_total: "الإجمالي", msg_delivery: "التوصيل إلى", msg_pickup: "استلام من المطعم",
      msg_loc: "الموقع", msg_land: "معلم قريب", msg_name: "الاسم", msg_phone: "الهاتف", msg_notes: "ملاحظة", remove: "حذف"
    }
  };
  function l(k){ var x = L[SM.lang()] || L.en; return x[k] || L.en[k] || ""; }
  var esc = SM.esc;
  function $(s, r){ return (r||document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function load(k, d){ try { var v = JSON.parse(localStorage.getItem(k)); return v || d; } catch(_) { return d; } }
  function save(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(_) {} }

  /* ---------- cart ---------- */
  var cart = load(STORE_CART, {});
  Object.keys(cart).forEach(function(id){ if (!SM.byId[id] || !(cart[id] > 0)) delete cart[id]; });
  function count(){ return Object.keys(cart).reduce(function(a, id){ return a + cart[id]; }, 0); }
  function total(){ return Object.keys(cart).reduce(function(a, id){ return a + cart[id] * SM.byId[id][2]; }, 0); }
  function setQty(id, q){ if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, 50); save(STORE_CART, cart); syncBars(); }
  function itemsWord(n){
    if (SM.lang() === "ru"){ var m10 = n % 10, m100 = n % 100; return (m10 === 1 && m100 !== 11) ? "блюдо" : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? "блюда" : "блюд"; }
    return n === 1 ? l("items1") : l("items"); }
  function syncBars(){
    var n = count();
    $$(".js-cart-count").forEach(function(el){ el.hidden = !n; el.textContent = SM.num(n); });
    var cartBtn = $(".js-bar-cart"), emptyBtn = $(".js-bar-empty");
    if (cartBtn){ cartBtn.hidden = !n; emptyBtn.hidden = !!n;
      $(".js-bar-text").textContent = l("cart") + " · " + SM.num(n) + " " + itemsWord(n);
      $(".js-bar-total").textContent = SM.priceText(total()); }
    var fab = $(".cart-fab");
    if (fab){ fab.hidden = !n; $(".js-fab-text", fab).textContent = l("checkout") + " · " + SM.num(n) + " " + itemsWord(n); $(".js-fab-total", fab).textContent = SM.priceText(total()); }
    if (dlg && dlg.open) renderItems();
  }

  /* dish sheet: quantity stepper + add */
  var q = 1;
  function syncAdd(){ var d = SM.byId[SM.current]; if (!d) return; $(".js-q").textContent = SM.num(q); $(".js-add-text").textContent = l("add") + " · " + SM.priceText(d[2] * q); }
  SM.onDishOpen = function(){ q = 1; syncAdd(); };
  $(".js-q-minus").addEventListener("click", function(){ q = Math.max(1, q - 1); syncAdd(); });
  $(".js-q-plus").addEventListener("click", function(){ q = Math.min(20, q + 1); syncAdd(); });
  $(".js-add").addEventListener("click", function(){
    var id = SM.current; setQty(id, (cart[id] || 0) + q); SM.close(); toast(l("added") + ": " + SM.byId[id][4][SM.lang()] + " × " + SM.num(q));
  });

  /* toast */
  var toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.hidden = true; document.body.appendChild(toastEl);
  var toastT;
  function toast(msg){ toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.hidden = true; }, 2600); }

  /* desktop floating cart */
  document.body.insertAdjacentHTML("beforeend", '<button type="button" class="cart-fab js-cart-open" hidden><svg class="ico" viewBox="0 0 24 24"><path d="M4 8h16M4 8l1.5 11h13L20 8M9 8a3 3 0 0 1 6 0"/></svg><span class="js-fab-text"></span><b class="js-fab-total"></b></button>');

  /* ---------- checkout dialog ---------- */
  document.body.insertAdjacentHTML("beforeend",
  '<dialog class="sheet checkout" id="checkout" aria-labelledby="co-h">' +
    '<form class="co" novalidate>' +
      '<div class="co-head"><h3 id="co-h" class="js-l" data-l="cart"></h3><button class="sheet-close co-close" type="button" data-co-close aria-label="Close"><svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="co-items js-items"></div>' +
      '<div class="co-sub"><span class="js-l" data-l="subtotal"></span><b class="price js-subtotal"></b></div>' +
      '<p class="co-err js-err-cart" hidden></p>' +
      '<div class="seg" role="radiogroup"><label><input type="radio" name="mode" value="delivery" checked><span class="js-l" data-l="delivery"></span></label><label><input type="radio" name="mode" value="pickup"><span class="js-l" data-l="pickup"></span></label></div>' +
      '<fieldset class="co-block js-delivery"><legend class="co-legend js-l" data-l="addr_h"></legend>' +
        '<div class="f"><label for="co-emirate" class="js-l" data-l="emirate"></label><select id="co-emirate" name="emirate"></select></div>' +
        '<div class="f f-area"><label for="co-area" class="js-l" data-l="area"></label>' +
          '<div class="combo"><input id="co-area" name="area" type="text" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="co-area-list" aria-describedby="co-area-help">' +
          '<ul id="co-area-list" class="combo-list" role="listbox" hidden></ul></div>' +
          '<p id="co-area-help" class="help js-l" data-l="area_help"></p>' +
          '<button type="button" class="locate js-locate"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="7"/></svg><span class="js-locate-text"></span></button>' +
          '<p class="co-err js-err-area" hidden></p><p class="co-warn js-zone" hidden></p></div>' +
        '<div class="f"><label for="co-street" class="js-l" data-l="street"></label><input id="co-street" name="street" type="text" autocomplete="address-line1"><p class="co-err js-err-street" hidden></p></div>' +
        '<div class="f2"><div class="f"><label for="co-flat" class="js-l" data-l="flat"></label><input id="co-flat" name="flat" type="text" autocomplete="address-line2"><p class="co-err js-err-flat" hidden></p></div>' +
        '<div class="f js-makani-f" hidden><label for="co-makani" class="js-l" data-l="makani"></label><input id="co-makani" name="makani" type="text" inputmode="numeric" maxlength="12"><p class="co-err js-err-makani" hidden></p></div></div>' +
        '<div class="f"><label for="co-landmark" class="js-l" data-l="landmark"></label><input id="co-landmark" name="landmark" type="text"></div>' +
      '</fieldset>' +
      '<p class="co-pickup js-pickup js-l" data-l="pickup_note" hidden></p>' +
      '<fieldset class="co-block"><legend class="co-legend js-l" data-l="contact_h"></legend>' +
        '<div class="f2"><div class="f"><label for="co-name" class="js-l" data-l="name"></label><input id="co-name" name="name" type="text" autocomplete="name"><p class="co-err js-err-name" hidden></p></div>' +
        '<div class="f"><label for="co-phone" class="js-l" data-l="phone"></label><div class="phone"><span dir="ltr">+971</span><input id="co-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" dir="ltr" placeholder="05X XXX XXXX" aria-describedby="co-phone-help"></div><p id="co-phone-help" class="help js-l" data-l="phone_help"></p><p class="co-err js-err-phone" hidden></p></div></div>' +
        '<div class="f"><label for="co-notes" class="js-l" data-l="notes"></label><textarea id="co-notes" name="notes" rows="2"></textarea></div>' +
      '</fieldset>' +
      '<div class="co-foot"><p class="help js-l" data-l="fee"></p><a class="btn btn-order js-send" href="#" target="_blank" rel="noopener"><svg class="ico" viewBox="0 0 24 24"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5"/></svg><span class="js-send-text"></span></a></div>' +
    '</form>' +
  '</dialog>');

  var dlg = $("#checkout"), form = $("form.co", dlg);
  var areaInput = $("#co-area"), list = $("#co-area-list"), emirSel = $("#co-emirate");
  var state = load(STORE_ADDR, {}); // {emirate, areaIdx, areaText, street, flat, landmark, makani, name, phone, lat, lng, mode}
  var chosen = (typeof state.areaIdx === "number" && UAE_AREAS[state.areaIdx]) ? state.areaIdx : null;
  var geo = (state.lat && state.lng) ? { lat: state.lat, lng: state.lng } : null;
  var googleChoice = state.google || null;

  function emirName(id){ var e = UAE_EMIRATES.filter(function(x){ return x.id === id; })[0]; return e ? e[SM.lang()] || e.en : id; }
  function areaName(i){ var a = UAE_AREAS[i]; var lg = SM.lang(); return lg === "ar" ? a[2] : lg === "ru" ? a[3] : a[1]; }
  function fillStatic(){
    $$(".js-l", dlg).forEach(function(el){ el.textContent = l(el.getAttribute("data-l")); });
    areaInput.placeholder = l("area_ph");
    $("#co-street").placeholder = l("street_ph"); $("#co-flat").placeholder = l("flat_ph");
    $("#co-landmark").placeholder = l("landmark_ph"); $("#co-makani").placeholder = l("makani_ph"); $("#co-notes").placeholder = l("notes_ph");
    $(".js-locate-text").textContent = geo ? l("located") : l("locate");
    var cur = emirSel.value || state.emirate || "SHJ";
    emirSel.innerHTML = UAE_EMIRATES.map(function(e){ return '<option value="' + e.id + '">' + esc(e[SM.lang()] || e.en) + '</option>'; }).join("");
    emirSel.value = cur;
    if (chosen !== null) areaInput.value = areaName(chosen);
    $(".js-send-text").textContent = l("send") + " · " + SM.priceText(total());
  }

  function renderItems(){
    var ids = Object.keys(cart);
    $(".js-items").innerHTML = ids.length ? ids.map(function(id){
      var d = SM.byId[id];
      return '<div class="co-item"><span class="co-thumb">' + (d[3] ? '<img src="' + SM.img(d[3]) + '" alt="">' : SM.placeholder(d[4][SM.lang()])) + '</span>' +
        '<span class="co-name">' + esc(d[4][SM.lang()]) + '<small>' + SM.priceText(d[2]) + '</small></span>' +
        '<span class="stepper sm" role="group"><button type="button" data-dec="' + id + '" aria-label="' + esc(l("remove")) + '">−</button><output>' + SM.num(cart[id]) + '</output><button type="button" data-inc="' + id + '" aria-label="+">+</button></span>' +
        '<b class="price">' + SM.priceText(d[2] * cart[id]) + '</b></div>';
    }).join("") : '<p class="co-empty">' + esc(l("empty")) + ' <a href="#menu" data-co-close>' + esc(l("back_menu")) + '</a></p>';
    $(".js-subtotal").textContent = SM.priceText(total());
    $(".js-send-text").textContent = l("send") + " · " + SM.priceText(total());
  }
  $(".js-items").addEventListener("click", function(e){
    var inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
    if (inc) setQty(inc.getAttribute("data-inc"), cart[inc.getAttribute("data-inc")] + 1);
    if (dec) setQty(dec.getAttribute("data-dec"), cart[dec.getAttribute("data-dec")] - 1);
  });

  function setMode(m){
    $$('input[name="mode"]', dlg).forEach(function(r){ r.checked = r.value === m; });
    $(".js-delivery").hidden = m !== "delivery"; $(".js-pickup").hidden = m !== "pickup";
  }
  $$('input[name="mode"]', dlg).forEach(function(r){ r.addEventListener("change", function(){ setMode(r.value); }); });

  function syncEmirate(){
    var em = emirSel.value;
    $(".js-makani-f").hidden = em !== "DXB";
    var warn = $(".js-zone"); warn.hidden = UAE_DELIVERY_ZONE.indexOf(em) > -1; warn.textContent = l("outside_zone");
  }
  emirSel.addEventListener("change", function(){
    if (chosen !== null && UAE_AREAS[chosen][0] !== emirSel.value){ chosen = null; areaInput.value = ""; }
    googleChoice = null; syncEmirate();
  });

  /* ---------- area autocomplete ---------- */
  function norm(s){
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
      .replace(/\b(al|el|ad|as|ar)[\s-]+/g, "").replace(/^ال/, "").replace(/\sال/g, " ").replace(/[‑\-'’()]/g, " ").replace(/\s+/g, " ").trim();
  }
  var INDEX = UAE_AREAS.map(function(a, i){ return { i: i, hay: [a[1], a[2], a[3], a[6] || ""].map(norm) }; });
  var opts = [], active = -1;
  function suggest(){
    var qv = norm(areaInput.value), em = emirSel.value;
    if (!qv){ opts = UAE_AREAS.map(function(a, i){ return i; }).filter(function(i){ return UAE_AREAS[i][0] === em; }).slice(0, 8).map(function(i){ return { i: i }; }); }
    else {
      var scored = [];
      INDEX.forEach(function(x){
        var best = 99;
        x.hay.forEach(function(h){ if (h.indexOf(qv) === 0) best = Math.min(best, 0); else if (h.indexOf(" " + qv) > -1) best = Math.min(best, 1); else if (h.indexOf(qv) > -1) best = Math.min(best, 2); });
        if (best < 99) scored.push({ i: x.i, s: best + (UAE_AREAS[x.i][0] === em ? 0 : 3) });
      });
      scored.sort(function(a, b){ return a.s - b.s; });
      opts = scored.slice(0, 8).map(function(x){ return { i: x.i }; });
    }
    if (GOOGLE_MAPS_KEY && qv.length > 2) googleSuggest(areaInput.value);
    drawList();
  }
  function drawList(extra){
    var all = opts.concat(extra || []);
    active = -1;
    if (!all.length){
      list.innerHTML = '<li class="combo-none" role="option" aria-disabled="true">' + esc(l("no_match")) + '</li>';
    } else {
      list.innerHTML = all.map(function(o, k){
        if (o.g) return '<li role="option" id="opt-' + k + '" data-g="' + k + '"><span>' + esc(o.g.main) + '</span><small>' + esc(o.g.sub) + ' · Google</small></li>';
        return '<li role="option" id="opt-' + k + '" data-i="' + o.i + '"><span>' + esc(areaName(o.i)) + '</span><small>' + esc(emirName(UAE_AREAS[o.i][0])) + '</small></li>';
      }).join("");
    }
    list._all = all;
    list.hidden = false; areaInput.setAttribute("aria-expanded", "true");
  }
  function closeList(){ list.hidden = true; areaInput.setAttribute("aria-expanded", "false"); areaInput.removeAttribute("aria-activedescendant"); }
  function pick(k){
    var o = list._all && list._all[k]; if (!o) return;
    if (o.g){ googleChoice = o.g; chosen = null; areaInput.value = o.g.main + ", " + o.g.sub; }
    else { chosen = o.i; googleChoice = null; areaInput.value = areaName(o.i); emirSel.value = UAE_AREAS[o.i][0]; syncEmirate(); }
    closeList(); showErr("area", "");
  }
  areaInput.addEventListener("input", function(){ chosen = null; googleChoice = null; suggest(); });
  areaInput.addEventListener("focus", suggest);
  areaInput.addEventListener("blur", function(){ setTimeout(closeList, 150); });
  areaInput.addEventListener("keydown", function(e){
    var items = $$("li[role=option]:not([aria-disabled])", list);
    if (e.key === "ArrowDown" || e.key === "ArrowUp"){
      e.preventDefault(); if (list.hidden) suggest();
      active = e.key === "ArrowDown" ? Math.min(items.length - 1, active + 1) : Math.max(0, active - 1);
      items.forEach(function(li, k){ li.classList.toggle("on", k === active); });
      if (items[active]){ areaInput.setAttribute("aria-activedescendant", items[active].id); items[active].scrollIntoView({ block: "nearest" }); }
    } else if (e.key === "Enter" && !list.hidden && active > -1){ e.preventDefault(); pick(active); }
    else if (e.key === "Escape"){ closeList(); }
  });
  list.addEventListener("mousedown", function(e){ var li = e.target.closest("li[role=option]:not([aria-disabled])"); if (li){ e.preventDefault(); pick($$("li[role=option]", list).indexOf(li)); } });

  /* optional Google Places, restricted to the UAE */
  var gSvc = null, gLoading = false;
  function googleSuggest(text){
    if (!gSvc){
      if (!gLoading){ gLoading = true; var s = document.createElement("script"); s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(GOOGLE_MAPS_KEY) + "&libraries=places&callback=__smPlaces"; s.async = true;
        window.__smPlaces = function(){ gSvc = new google.maps.places.AutocompleteService(); }; document.head.appendChild(s); }
      return;
    }
    gSvc.getPlacePredictions({ input: text, componentRestrictions: { country: "ae" }, language: SM.lang() }, function(res){
      if (!res || areaInput !== document.activeElement) return;
      drawList(res.slice(0, 4).map(function(p){ return { g: { main: p.structured_formatting.main_text, sub: p.structured_formatting.secondary_text || "UAE", id: p.place_id } }; }));
    });
  }

  /* geolocation, accepted only inside the UAE */
  function inUAE(lat, lng){ return lat >= UAE_BOUNDS.s && lat <= UAE_BOUNDS.n && lng >= UAE_BOUNDS.w && lng <= UAE_BOUNDS.e; }
  $(".js-locate").addEventListener("click", function(){
    var btnText = $(".js-locate-text");
    if (!navigator.geolocation){ showErr("area", l("geo_err")); return; }
    btnText.textContent = l("locating");
    navigator.geolocation.getCurrentPosition(function(pos){
      var la = pos.coords.latitude, ln = pos.coords.longitude;
      if (!inUAE(la, ln)){ geo = null; btnText.textContent = l("locate"); showErr("area", l("geo_out")); return; }
      geo = { lat: +la.toFixed(6), lng: +ln.toFixed(6) };
      var best = 0, bd = 1e9;
      UAE_AREAS.forEach(function(a, i){ var d = Math.pow(a[4] - la, 2) + Math.pow((a[5] - ln) * Math.cos(la * Math.PI / 180), 2); if (d < bd){ bd = d; best = i; } });
      if (chosen === null && !googleChoice){ chosen = best; areaInput.value = areaName(best); emirSel.value = UAE_AREAS[best][0]; syncEmirate(); }
      btnText.textContent = l("located") + " · " + l("near") + ": " + areaName(best);
      showErr("area", "");
    }, function(){ btnText.textContent = l("locate"); showErr("area", l("geo_err")); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  });

  /* ---------- validation + message ---------- */
  function showErr(k, msg){ var el = $(".js-err-" + k, dlg); if (!el) return; el.textContent = msg; el.hidden = !msg; var inp = $("#co-" + k); if (inp) inp.setAttribute("aria-invalid", msg ? "true" : "false"); }
  function normPhone(v){
    var d = String(v).replace(/[^\d+]/g, "");
    d = d.replace(/^\+?00?971/, "").replace(/^\+/, "");
    if (d.charAt(0) === "0") d = d.slice(1);
    return /^5[024568]\d{7}$/.test(d) ? "+971 " + d.slice(0, 2) + " " + d.slice(2, 5) + " " + d.slice(5) : null;
  }
  function val(id){ return $("#co-" + id).value.trim(); }
  function validate(){
    var mode = $('input[name="mode"]:checked', dlg).value, first = null, ok = true;
    function fail(k, msg){ showErr(k, msg); ok = false; if (!first) first = $("#co-" + k); }
    ["area","street","flat","makani","name","phone"].forEach(function(k){ showErr(k, ""); });
    var ec = $(".js-err-cart"); ec.hidden = !!count(); ec.textContent = l("e_cart"); if (!count()) ok = false;
    if (mode === "delivery"){
      if (chosen === null && !googleChoice && !geo) fail("area", l("e_area"));
      if (!val("street")) fail("street", l("e_street"));
      if (!val("flat")) fail("flat", l("e_flat"));
      if (emirSel.value === "DXB" && val("makani") && !/^\d{10}$/.test(val("makani").replace(/\s/g, ""))) fail("makani", l("e_makani"));
    }
    if (!val("name")) fail("name", l("e_name"));
    if (!normPhone(val("phone"))) fail("phone", l("e_phone"));
    if (first) first.focus();
    return ok;
  }
  function message(){
    var lg = SM.lang(), lines = [l("msg_title"), ""];
    Object.keys(cart).forEach(function(id){ var d = SM.byId[id]; lines.push(cart[id] + " × " + d[4][lg] + " — " + SM.priceText(d[2] * cart[id])); });
    lines.push("", l("msg_total") + ": " + SM.priceText(total()), "");
    var mode = $('input[name="mode"]:checked', dlg).value;
    if (mode === "delivery"){
      var areaTxt = googleChoice ? googleChoice.main + ", " + googleChoice.sub : chosen !== null ? areaName(chosen) : "";
      var parts = [emirName(emirSel.value), areaTxt, val("street"), val("flat")].filter(Boolean);
      lines.push(l("msg_delivery") + ": " + parts.join(", "));
      if (emirSel.value === "DXB" && val("makani")) lines.push("Makani: " + val("makani").replace(/\s/g, ""));
      if (val("landmark")) lines.push(l("msg_land") + ": " + val("landmark"));
      if (geo) lines.push(l("msg_loc") + ": https://maps.google.com/?q=" + geo.lat + "," + geo.lng);
    } else lines.push(l("msg_pickup"));
    lines.push(l("msg_name") + ": " + val("name"), l("msg_phone") + ": " + normPhone(val("phone")));
    if (val("notes")) lines.push(l("msg_notes") + ": " + val("notes"));
    return lines.join("\n");
  }
  $(".js-send").addEventListener("click", function(e){
    if (!validate()){ e.preventDefault(); return; }
    var a = e.currentTarget;
    a.href = "https://wa.me/" + SM.WA + "?text=" + encodeURIComponent(message());
    save(STORE_ADDR, { emirate: emirSel.value, areaIdx: chosen, google: googleChoice, street: val("street"), flat: val("flat"), landmark: val("landmark"), makani: val("makani"),
      name: val("name"), phone: val("phone"), lat: geo && geo.lat, lng: geo && geo.lng, mode: $('input[name="mode"]:checked', dlg).value });
  });
  form.addEventListener("submit", function(e){ e.preventDefault(); });

  /* open / close */
  function openCheckout(){
    fillStatic();
    ["street","flat","landmark","makani","name","phone"].forEach(function(k){ if (state[k] && !val(k)) $("#co-" + k).value = state[k]; });
    setMode(state.mode || "delivery"); syncEmirate(); renderItems();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  document.addEventListener("click", function(e){
    if (e.target.closest(".js-cart-open")){ e.preventDefault(); openCheckout(); return; }
    if (e.target.closest("[data-co-close]")) dlg.close();
  });
  dlg.addEventListener("click", function(e){ if (e.target === dlg) dlg.close(); });

  SM.onLang = function(){ fillStatic(); syncBars(); syncEmirate(); if (SM.current && $("#sheet").open) syncAdd(); };
  fillStatic(); syncEmirate(); syncBars();
})();

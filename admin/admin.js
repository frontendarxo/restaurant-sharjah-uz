/* Samarkand Madina — menu admin. Talks to Supabase directly; Row Level Security decides who may change what:
   owner = everything, staff = only "available" (stop-list). */
(function(){
  "use strict";
  var cfg = window.SM_CONFIG || {};
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var toastT;
  function toast(msg, bad){ var el = $("#toast"); el.textContent = msg; el.classList.toggle("bad", !!bad); el.hidden = false; clearTimeout(toastT); toastT = setTimeout(function(){ el.hidden = true; }, bad ? 5000 : 2200); }
  function errText(e){
    var m = (e && (e.message || e.error_description)) || String(e);
    if (/Invalid login credentials/i.test(m)) return "Неверная почта или пароль.";
    if (/Staff can only change availability/i.test(m)) return "У сотрудника есть доступ только к стоп-листу.";
    if (/row-level security|permission denied/i.test(m)) return "Нет прав на это действие.";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Нет связи с сервером. Проверьте интернет.";
    if (/foreign key/i.test(m)) return "В категории есть блюда. Сначала перенесите или удалите их.";
    return "Ошибка: " + m;
  }
  function imgSrc(x){ return x || ""; }

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase){
    var why = !window.SM_CONFIG ? "Файл /assets/config.js не загрузился: на хостинге не сработала функция config (проверьте netlify.toml и папку netlify/functions в репозитории)."
      : !cfg.supabaseUrl ? "Переменная SUPABASE_URL пустая: её нет в настройках хостинга или после её добавления не было нового деплоя."
      : !cfg.supabaseAnonKey ? "Переменная SUPABASE_ANON_KEY пустая: её нет в настройках хостинга или после её добавления не было нового деплоя."
      : "Не загрузилась библиотека Supabase с cdn.jsdelivr.net. Проверьте интернет или блокировщик рекламы.";
    $("#setup-why").textContent = why;
    $("#setup").hidden = false; return;
  }
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });

  var state = { role: null, cats: [], dishes: [], filter: "all", stop: false, q: "" };
  var isOwner = function(){ return state.role === "owner"; };

  /* ---------- auth ---------- */
  $("#login-form").addEventListener("submit", function(e){
    e.preventDefault();
    var btn = $("#login-btn"), err = $("#login-err");
    err.hidden = true; btn.disabled = true; btn.textContent = "Входим…";
    sb.auth.signInWithPassword({ email: $("#email").value.trim(), password: $("#password").value }).then(function(r){
      if (r.error) throw r.error;
      return start();
    }).catch(function(e2){ err.textContent = errText(e2); err.hidden = false; })
      .then(function(){ btn.disabled = false; btn.textContent = "Войти"; });
  });
  $("#logout").addEventListener("click", function(){ sb.auth.signOut().then(function(){ location.reload(); }); });

  function start(){
    return sb.auth.getSession().then(function(r){
      var session = r.data && r.data.session;
      if (!session){ $("#login").hidden = false; $("#app").hidden = true; return; }
      return sb.from("admins").select("role").eq("user_id", session.user.id).maybeSingle().then(function(a){
        if (a.error) throw a.error;
        if (!a.data){
          $("#login").hidden = false; $("#app").hidden = true;
          var err = $("#login-err"); err.textContent = "У этой почты нет доступа к меню. Попросите владельца добавить вас."; err.hidden = false;
          return sb.auth.signOut();
        }
        state.role = a.data.role;
        $("#role").textContent = isOwner() ? "Владелец" : "Сотрудник";
        $$(".owner-only").forEach(function(el){ el.hidden = !isOwner(); });
        $("#login").hidden = true; $("#app").hidden = false;
        return loadAll();
      });
    }).catch(function(e){ toast(errText(e), true); $("#login").hidden = false; });
  }

  function loadAll(){
    return Promise.all([
      sb.from("categories").select("*").order("sort", { ascending: true }),
      sb.from("dishes").select("*").order("sort", { ascending: true })
    ]).then(function(r){
      if (r[0].error) throw r[0].error; if (r[1].error) throw r[1].error;
      state.cats = r[0].data; state.dishes = r[1].data;
      renderChips(); renderList(); renderCats();
    }).catch(function(e){ toast(errText(e), true); });
  }

  /* ---------- tabs ---------- */
  $$(".tab").forEach(function(t){ t.addEventListener("click", function(){
    $$(".tab").forEach(function(x){ x.setAttribute("aria-selected", x === t); });
    $("#tab-menu").hidden = t.dataset.tab !== "menu"; $("#tab-cats").hidden = t.dataset.tab !== "cats";
  }); });

  /* ---------- dish list ---------- */
  function catName(id){ var c = state.cats.filter(function(x){ return x.id === id; })[0]; return c ? c.name_ru : id; }
  function renderChips(){
    var html = '<button class="chip" data-f="all" aria-pressed="' + (state.filter === "all") + '">Все</button>' +
      '<button class="chip stop" data-stop aria-pressed="' + state.stop + '">Стоп-лист</button>' +
      state.cats.map(function(c){ return '<button class="chip" data-f="' + esc(c.id) + '" aria-pressed="' + (state.filter === c.id) + '">' + esc(c.name_ru) + '</button>'; }).join("");
    $("#chips").innerHTML = html;
  }
  $("#chips").addEventListener("click", function(e){
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-stop")) state.stop = !state.stop; else state.filter = b.dataset.f;
    renderChips(); renderList();
  });
  $("#q").addEventListener("input", function(e){ state.q = e.target.value.trim().toLowerCase(); renderList(); });

  var PENCIL = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>';
  function renderList(){
    var list = state.dishes.filter(function(d){
      if (state.filter !== "all" && d.category_id !== state.filter) return false;
      if (state.stop && d.available) return false;
      if (state.q && [d.name_ru, d.name_en, d.name_ar].join(" ").toLowerCase().indexOf(state.q) < 0) return false;
      return true;
    });
    var off = state.dishes.filter(function(d){ return !d.available; }).length;
    $("#summary").textContent = "Блюд: " + state.dishes.length + " · в стоп-листе: " + off;
    if (!list.length){ $("#list").innerHTML = '<p class="empty">' + (state.stop ? "Стоп-лист пуст — всё в наличии." : "Ничего не найдено.") + '</p>'; return; }
    var html = "";
    state.cats.forEach(function(c){
      var items = list.filter(function(d){ return d.category_id === c.id; });
      if (!items.length) return;
      html += '<div class="cat-h">' + esc(c.name_ru) + ' <small>' + items.length + (c.visible ? "" : " · скрыта") + '</small></div>' + items.map(row).join("");
    });
    $("#list").innerHTML = html;
  }
  function row(d){
    return '<div class="row' + (d.available ? "" : " off") + (d.visible ? "" : " hiddenrow") + '" data-id="' + esc(d.id) + '">' +
      '<span class="thumb">' + (d.image_url ? '<img src="' + esc(imgSrc(d.image_url)) + '" alt="" loading="lazy">' : esc((d.name_ru || "?").charAt(0))) + '</span>' +
      '<span class="name"><b>' + esc(d.name_ru) + '</b><span>' + esc(d.name_en) + (d.visible ? "" : " · скрыто с сайта") + '</span></span>' +
      '<span class="price">' + Number(d.price) + ' AED</span>' +
      '<span class="row-actions"><label class="sw"><input type="checkbox" data-avail="' + esc(d.id) + '"' + (d.available ? " checked" : "") + '><span class="track"></span><span class="state">' + (d.available ? "В наличии" : "Нет") + '</span></label>' +
      (isOwner() ? '<button class="edit" type="button" data-edit="' + esc(d.id) + '" aria-label="Изменить ' + esc(d.name_ru) + '">' + PENCIL + '</button>' : '') + '</span></div>';
  }
  $("#list").addEventListener("change", function(e){
    var cb = e.target.closest("[data-avail]"); if (!cb) return;
    var id = cb.dataset.avail, d = state.dishes.filter(function(x){ return x.id === id; })[0], val = cb.checked;
    cb.disabled = true;
    sb.from("dishes").update({ available: val }).eq("id", id).select("id").then(function(r){
      if (r.error) throw r.error;
      if (!r.data || !r.data.length) throw new Error("permission denied");
      d.available = val; toast(val ? d.name_ru + " — снова в наличии" : d.name_ru + " — в стоп-листе"); renderList();
    }).catch(function(err){ cb.checked = !val; cb.disabled = false; toast(errText(err), true); });
  });
  $("#list").addEventListener("click", function(e){ var b = e.target.closest("[data-edit]"); if (b) openEditor(b.dataset.edit); });
  $("#add-dish").addEventListener("click", function(){ openEditor(null); });

  /* ---------- editor ---------- */
  var dlg = $("#editor"), cur = null, edLang = "ru", draft = null, pendingFile = null;
  function openEditor(id){
    cur = id ? state.dishes.filter(function(x){ return x.id === id; })[0] : null;
    draft = cur ? JSON.parse(JSON.stringify(cur)) : { id: null, category_id: state.filter !== "all" ? state.filter : (state.cats[0] && state.cats[0].id), price: "", image_url: null,
      name_ru: "", name_en: "", name_ar: "", comp_ru: "", comp_en: "", comp_ar: "", tags: [], available: true, visible: true, sort: nextSort() };
    pendingFile = null;
    $("#ed-title").textContent = cur ? cur.name_ru : "Новое блюдо";
    $("#ed-cat").innerHTML = state.cats.map(function(c){ return '<option value="' + esc(c.id) + '">' + esc(c.name_ru) + '</option>'; }).join("");
    $("#ed-cat").value = draft.category_id || "";
    $("#ed-price").value = draft.price === "" ? "" : Number(draft.price);
    $$("#ed-tags input").forEach(function(i){ i.checked = (draft.tags || []).indexOf(i.value) > -1; });
    $("#ed-available").checked = !!draft.available; $("#ed-visible").checked = !!draft.visible;
    $("#ed-delete").hidden = !cur; $("#ed-confirm").hidden = true; $("#ed-err").hidden = true;
    edLang = null; setLang("ru"); drawThumb();
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
  }
  function nextSort(){ return state.dishes.reduce(function(m, d){ return Math.max(m, d.sort || 0); }, 0) + 10; }
  function drawThumb(){
    var t = $("#ed-thumb");
    if (pendingFile) t.innerHTML = '<img src="' + URL.createObjectURL(pendingFile) + '" alt="">';
    else t.innerHTML = draft.image_url ? '<img src="' + esc(imgSrc(draft.image_url)) + '" alt="">' : esc((draft.name_ru || "?").charAt(0));
    $("#ed-photo-remove").hidden = !(pendingFile || draft.image_url);
  }
  function stash(){ draft["name_" + edLang] = $("#ed-name").value.trim(); draft["comp_" + edLang] = $("#ed-comp").value.trim(); }
  function setLang(l){
    if (draft && edLang) stash();
    edLang = l;
    $$(".langs button").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.l === l); b.classList.toggle("missing", !draft["name_" + b.dataset.l]); });
    var n = $("#ed-name"), c = $("#ed-comp");
    n.value = draft["name_" + l] || ""; c.value = draft["comp_" + l] || "";
    n.dir = c.dir = l === "ar" ? "rtl" : "ltr";
    $("label[for=ed-name]").textContent = l === "ru" ? "Название" : l === "en" ? "Name" : "الاسم";
    $("label[for=ed-comp]").textContent = l === "ru" ? "Состав" : l === "en" ? "Ingredients" : "المكونات";
  }
  $$(".langs button").forEach(function(b){ b.addEventListener("click", function(){ setLang(b.dataset.l); }); });
  $("#ed-name").addEventListener("input", function(){ var b = $('.langs button[data-l="' + edLang + '"]'); b.classList.toggle("missing", !this.value.trim()); });
  $$("[data-close]", dlg).forEach(function(b){ b.addEventListener("click", function(){ dlg.close(); }); });
  $("#ed-file").addEventListener("change", function(e){ var f = e.target.files && e.target.files[0]; if (f){ pendingFile = f; drawThumb(); } e.target.value = ""; });
  $("#ed-photo-remove").addEventListener("click", function(){ pendingFile = null; draft.image_url = null; drawThumb(); });

  function slugify(s){
    var map = { "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"h","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya" };
    return String(s || "").toLowerCase().split("").map(function(ch){ return map[ch] != null ? map[ch] : ch; }).join("")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "dish";
  }
  function uniqueId(base, taken){ var id = base, n = 2; while (taken.indexOf(id) > -1) id = base + "-" + n++; return id; }

  /* resize to max 1000px and convert to WebP (JPEG where WebP encoding is unsupported) */
  function compress(file){
    return new Promise(function(res, rej){
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function(){
        var k = Math.min(1, 1000 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function(b){
          if (b && b.type === "image/webp") return res({ blob: b, ext: "webp", type: "image/webp" });
          c.toBlob(function(j){ j ? res({ blob: j, ext: "jpg", type: "image/jpeg" }) : rej(new Error("Не удалось обработать фото")); }, "image/jpeg", 0.86);
        }, "image/webp", 0.85);
      };
      img.onerror = function(){ rej(new Error("Этот файл не похож на фото")); };
      img.src = url;
    });
  }
  function uploadPhoto(id){
    if (!pendingFile) return Promise.resolve(draft.image_url);
    return compress(pendingFile).then(function(p){
      var path = id + "/" + Date.now() + "." + p.ext;
      return sb.storage.from("dishes").upload(path, p.blob, { contentType: p.type, cacheControl: "31536000", upsert: false }).then(function(r){
        if (r.error) throw r.error;
        return sb.storage.from("dishes").getPublicUrl(path).data.publicUrl;
      });
    });
  }

  $("#ed-form").addEventListener("submit", function(e){
    e.preventDefault(); stash();
    var err = $("#ed-err"); err.hidden = true;
    var price = parseFloat(String($("#ed-price").value).replace(",", "."));
    var problems = [];
    if (!draft.name_ru) problems.push("название на русском");
    if (!draft.name_en) problems.push("название на английском");
    if (!draft.name_ar) problems.push("название на арабском");
    if (!(price >= 0)) problems.push("цену");
    if (problems.length){ err.textContent = "Заполните: " + problems.join(", ") + "."; err.hidden = false; return; }
    var btn = $("#ed-save"); btn.disabled = true; btn.textContent = "Сохраняем…";
    var id = cur ? cur.id : uniqueId(slugify(draft.name_en || draft.name_ru), state.dishes.map(function(d){ return d.id; }));
    uploadPhoto(id).then(function(url){
      var rowData = { category_id: $("#ed-cat").value, price: price, image_url: url || null,
        name_ru: draft.name_ru, name_en: draft.name_en, name_ar: draft.name_ar,
        comp_ru: draft.comp_ru || null, comp_en: draft.comp_en || null, comp_ar: draft.comp_ar || null,
        tags: $$("#ed-tags input:checked").map(function(i){ return i.value; }),
        available: $("#ed-available").checked, visible: $("#ed-visible").checked };
      var q = cur ? sb.from("dishes").update(rowData).eq("id", id).select().single()
                  : sb.from("dishes").insert(Object.assign({ id: id, sort: draft.sort }, rowData)).select().single();
      return q.then(function(r){
        if (r.error) throw r.error;
        if (cur){ Object.assign(cur, r.data); } else { state.dishes.push(r.data); }
        dlg.close(); toast("Сохранено. На сайте уже обновилось."); renderList();
      });
    }).catch(function(e2){ err.textContent = errText(e2); err.hidden = false; })
      .then(function(){ btn.disabled = false; btn.textContent = "Сохранить"; });
  });
  $("#ed-delete").addEventListener("click", function(){ $("#ed-confirm").hidden = false; });
  $("#ed-del-no").addEventListener("click", function(){ $("#ed-confirm").hidden = true; });
  $("#ed-del-yes").addEventListener("click", function(){
    sb.from("dishes").delete().eq("id", cur.id).then(function(r){
      if (r.error) throw r.error;
      state.dishes = state.dishes.filter(function(d){ return d.id !== cur.id; });
      dlg.close(); toast("Блюдо удалено"); renderList();
    }).catch(function(e){ $("#ed-err").textContent = errText(e); $("#ed-err").hidden = false; });
  });

  /* ---------- categories (owner) ---------- */
  function renderCats(){
    if (!isOwner()) return;
    var html = state.cats.map(function(c, i){
      var n = state.dishes.filter(function(d){ return d.category_id === c.id; }).length;
      return '<div class="crow" data-cat="' + esc(c.id) + '">' +
        '<span class="arrows"><button type="button" data-up ' + (i === 0 ? "disabled" : "") + ' aria-label="Выше">▲</button><button type="button" data-down ' + (i === state.cats.length - 1 ? "disabled" : "") + ' aria-label="Ниже">▼</button></span>' +
        '<span class="cnames"><input data-k="name_ru" value="' + esc(c.name_ru) + '" aria-label="Название RU"><input data-k="name_en" value="' + esc(c.name_en) + '" aria-label="Name EN"><input data-k="name_ar" dir="rtl" value="' + esc(c.name_ar) + '" aria-label="الاسم AR"></span>' +
        '<span class="cmeta"><label class="sw"><input type="checkbox" data-vis' + (c.visible ? " checked" : "") + '><span class="track"></span></label><span class="muted small">' + n + ' блюд</span>' +
        (n ? "" : '<button class="btn btn-danger btn-sm" type="button" data-cdel>Удалить</button>') + '</span></div>';
    }).join("");
    $("#cats").innerHTML = html || '<p class="empty">Категорий пока нет.</p>';
  }
  function saveCat(id, patch, okMsg){
    return sb.from("categories").update(patch).eq("id", id).then(function(r){
      if (r.error) throw r.error;
      var c = state.cats.filter(function(x){ return x.id === id; })[0]; Object.assign(c, patch);
      if (okMsg) toast(okMsg); renderChips(); renderList();
    }).catch(function(e){ toast(errText(e), true); loadAll(); });
  }
  $("#cats").addEventListener("change", function(e){
    var rowEl = e.target.closest(".crow"); if (!rowEl) return; var id = rowEl.dataset.cat;
    if (e.target.hasAttribute("data-vis")) return saveCat(id, { visible: e.target.checked }, e.target.checked ? "Категория видна на сайте" : "Категория скрыта");
    var k = e.target.dataset.k, v = e.target.value.trim();
    if (k && v) { var p = {}; p[k] = v; saveCat(id, p, "Название сохранено"); }
  });
  $("#cats").addEventListener("click", function(e){
    var rowEl = e.target.closest(".crow"); if (!rowEl) return; var id = rowEl.dataset.cat;
    var i = state.cats.findIndex(function(c){ return c.id === id; });
    if (e.target.closest("[data-up]") || e.target.closest("[data-down]")){
      var j = e.target.closest("[data-up]") ? i - 1 : i + 1; var a = state.cats[i], b = state.cats[j];
      var sa = a.sort, sbv = b.sort; if (sa === sbv) { sbv = sa + 1; }
      Promise.all([sb.from("categories").update({ sort: sbv }).eq("id", a.id), sb.from("categories").update({ sort: sa }).eq("id", b.id)]).then(function(rs){
        rs.forEach(function(r){ if (r.error) throw r.error; });
        a.sort = sbv; b.sort = sa; state.cats.sort(function(x, y){ return x.sort - y.sort; }); renderCats(); renderChips(); renderList();
      }).catch(function(err){ toast(errText(err), true); });
    }
    if (e.target.closest("[data-cdel]")){
      sb.from("categories").delete().eq("id", id).then(function(r){
        if (r.error) throw r.error; state.cats = state.cats.filter(function(c){ return c.id !== id; }); renderCats(); renderChips(); toast("Категория удалена");
      }).catch(function(err){ toast(errText(err), true); });
    }
  });
  $("#add-cat").addEventListener("click", function(){
    var id = uniqueId("category", state.cats.map(function(c){ return c.id; }));
    var sort = state.cats.reduce(function(m, c){ return Math.max(m, c.sort); }, 0) + 10;
    sb.from("categories").insert({ id: id, name_ru: "Новая категория", name_en: "New category", name_ar: "فئة جديدة", sort: sort, visible: false }).select().single().then(function(r){
      if (r.error) throw r.error; state.cats.push(r.data); renderCats(); renderChips();
      toast("Категория добавлена и пока скрыта. Задайте названия и включите её.");
      var last = $("#cats .crow:last-child input"); if (last) { last.focus(); last.select(); }
    }).catch(function(err){ toast(errText(err), true); });
  });

  start();
})();

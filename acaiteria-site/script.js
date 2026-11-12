/* Açaíê — catálogo, carrinho e pedido via WhatsApp.
   PERSONALIZE CONFIG e os valores em CATALOG antes de publicar. */
"use strict";

const CONFIG = {
  // Use apenas números: código do Brasil + DDD + número. Ex.: 5599999999999
  whatsappNumber: "",
  instagramUrl: "",
  address: "Endereço a configurar",
  openingHours: "Horário de funcionamento a configurar",
  currency: "BRL",
  storageKey: "acaie-cart-v1"
};

const CATALOG = {
  products: [
    { id: "combo-classico", name: "Clássico do Açaí", description: "Açaí 300 ml, banana e granola.", size: "300 ml", price: 18, badge: "queridinho", image: "img/imagem5.jpg" },
    { id: "combo-tropical", name: "Tropical", description: "Açaí 500 ml com frutas e crocância.", size: "500 ml", price: 25, badge: "frutadinho", image: "img/tropical.jpg" },
    { id: "combo-choco", name: "Choco Lovers", description: "Açaí 500 ml com calda e leite em pó.", size: "500 ml", price: 28, badge: "chocolatudo", image: "img/choco.jpg" },
    { id: "barca-familia", name: "Barca da Galera", description: "Barca para compartilhar, com toppings.", size: "600 g", price: 42, badge: "pra dividir", image: "img/barca.jpg" }
  ],
  sizes: { 300: 12, 500: 17, 700: 22 },
  toppings: [
    { id: "leite-condensado", name: "Leite condensado", price: 2, emoji: "🥛" },
    { id: "leite-em-po", name: "Leite em pó", price: 2, emoji: "🥄" },
    { id: "nutella", name: "Creme de avelã", price: 4, emoji: "🍫" },
    { id: "granola", name: "Granola", price: 2, emoji: "🌾" },
    { id: "morango", name: "Morango", price: 3, emoji: "🍓" },
    { id: "banana", name: "Banana", price: 2, emoji: "🍌" },
    { id: "pacoca", name: "Paçoca", price: 2, emoji: "🥜" },
    { id: "confetes", name: "Confetes", price: 2, emoji: "🍬" },
    { id: "calda-chocolate", name: "Calda de chocolate", price: 3, emoji: "🍫" }
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: CONFIG.currency }).format(value);
const safeText = value => String(value ?? "").trim();
let cart = loadCart();
let selectedSize = 300;
let selectedToppings = new Set();
let toastTimeout;

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONFIG.storageKey) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(item => item && typeof item.id === "string" && typeof item.name === "string" &&
      Number.isFinite(item.price) && item.price >= 0 && Number.isInteger(item.quantity) &&
      item.quantity > 0 && item.quantity <= 99).map(item => ({
        id: item.id, name: item.name.slice(0, 100), description: safeText(item.description).slice(0, 500),
        price: Number(item.price), quantity: item.quantity, type: item.type === "custom" ? "custom" : "product",
        size: safeText(item.size).slice(0, 30), toppings: Array.isArray(item.toppings) ? item.toppings.map(t => safeText(t).slice(0, 60)).slice(0, 20) : [],
        notes: safeText(item.notes).slice(0, 240)
      }));
  } catch (error) {
    console.warn("Não foi possível ler o carrinho salvo.", error);
    return [];
  }
}
function saveCart() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart)); }
  catch (error) { console.warn("Não foi possível salvar o carrinho neste navegador.", error); }
}
function cartCount() { return cart.reduce((sum, item) => sum + item.quantity, 0); }
function cartTotal() { return cart.reduce((sum, item) => sum + item.price * item.quantity, 0); }
function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => node.classList.remove("show"), 2600);
}
function findProduct(id) { return CATALOG.products.find(product => product.id === id); }

function renderProducts() {
  const grid = $("#comboGrid");
  grid.innerHTML = CATALOG.products.map(product => `
    <article class="product-card reveal">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy" width="700" height="500" onerror="this.style.display='none'">
        <span class="product-badge">${product.badge}</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3><p>${product.description}</p>
        <div class="product-bottom"><span class="product-price">${money(product.price)}</span>
        <button class="add-button" type="button" data-add-product="${product.id}" aria-label="Adicionar ${product.name} ao pedido" title="Adicionar ao pedido">+</button></div>
      </div>
    </article>`).join("");
  observeReveals(grid);
}
function renderToppings() {
  $("#toppingGrid").innerHTML = CATALOG.toppings.map(topping => `
    <button type="button" class="topping-option" data-topping="${topping.id}" aria-pressed="false">
      <span class="topping-emoji" aria-hidden="true">${topping.emoji}</span>
      <span class="topping-text"><strong>${topping.name}</strong><small>+ ${money(topping.price)}</small></span>
    </button>`).join("");
}
function customPrice() {
  return Number(CATALOG.sizes[selectedSize]) + CATALOG.toppings.filter(t => selectedToppings.has(t.id)).reduce((sum, t) => sum + Number(t.price), 0);
}
function updateBuilderTotal() { $("#builderTotal").textContent = money(customPrice()); }
function addProductToCart(productId) {
  const product = findProduct(productId);
  if (!product) { toast("Esse produto não está disponível."); return; }
  const existing = cart.find(item => item.id === product.id && item.type === "product");
  if (existing) existing.quantity = Math.min(99, existing.quantity + 1);
  else cart.push({ id: product.id, name: product.name, description: product.description, price: product.price, quantity: 1, type: "product", size: product.size, toppings: [], notes: "" });
  afterCartChange();
  toast(`${product.name} adicionado ao pedido!`);
}
function addCustomToCart() {
  const sizePrice = Number(CATALOG.sizes[selectedSize]);
  if (!Number.isFinite(sizePrice) || sizePrice < 0) { toast("Confira o preço do tamanho escolhido."); return; }
  const toppings = CATALOG.toppings.filter(t => selectedToppings.has(t.id));
  const item = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "Açaí personalizado", description: toppings.length ? toppings.map(t => t.name).join(", ") : "Sem complementos",
    price: customPrice(), quantity: 1, type: "custom", size: `${selectedSize} ml`,
    toppings: toppings.map(t => `${t.name} (+${money(t.price)})`), notes: safeText($("#builderNotes").value).slice(0, 240)
  };
  if (!Number.isFinite(item.price) || item.price < 0) { toast("Não foi possível calcular esse açaí."); return; }
  cart.push(item);
  afterCartChange();
  selectedToppings.clear();
  $$(".topping-option").forEach(button => button.setAttribute("aria-pressed", "false"));
  $("#builderNotes").value = "";
  updateBuilderTotal();
  toast("Seu açaí personalizado foi adicionado!");
}
function afterCartChange() { saveCart(); renderCart(); }
function renderCart() {
  const count = cartCount();
  $("#cartCount").textContent = count > 99 ? "99+" : count;
  $("#drawerCount").textContent = `(${count})`;
  $("#cartSubtotal").textContent = money(cartTotal());
  $("#cartTotal").textContent = money(cartTotal());
  $("#checkoutOpen").disabled = cart.length === 0;
  if (!cart.length) {
    $("#cartItems").innerHTML = `<div class="cart-empty"><span>♡</span><h3>Seu carrinho está vazio</h3><p>Escolha um combo ou monte seu açaí favorito.</p><button class="button button-yellow" id="browseProducts">Ver produtos</button></div>`;
    return;
  }
  $("#cartItems").innerHTML = cart.map((item, index) => `
    <article class="cart-line">
      <div><h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.size)}${item.description ? " · " + escapeHTML(item.description) : ""}${item.notes ? "\nObs.: " + escapeHTML(item.notes) : ""}</p>
        <div class="quantity-control">
          <button type="button" data-quantity="${index}" data-delta="-1" aria-label="Diminuir quantidade">−</button><span>${item.quantity}</span>
          <button type="button" data-quantity="${index}" data-delta="1" aria-label="Aumentar quantidade">+</button>
          <button type="button" class="remove-item" data-remove="${index}">Remover</button>
        </div>
      </div><div class="cart-line-price">${money(item.price * item.quantity)}</div>
    </article>`).join("");
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function openCart() {
  $("#cartOverlay").hidden = false;
  requestAnimationFrame(() => $("#cartDrawer").classList.add("open"));
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  $("#checkoutForm").hidden = true;
  $(".cart-summary").hidden = false;
  $("#closeCart").focus();
}
function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  $("#cartOverlay").hidden = true;
  document.body.classList.remove("drawer-open");
}
function openCheckout() {
  if (!cart.length) return;
  $("#checkoutForm").hidden = false;
  $(".cart-summary").hidden = true;
  $("#customerName").focus();
}
function showCart() { closeCart(); $("#combos").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" }); }
function reducedMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

function buildWhatsAppMessage(formData) {
  const name = safeText(formData.get("customerName"));
  const delivery = safeText(formData.get("delivery"));
  const address = safeText(formData.get("customerAddress"));
  const payment = safeText(formData.get("paymentMethod"));
  const changeFor = safeText(formData.get("changeFor"));
  const notes = safeText(formData.get("orderNotes"));
  if (!name || !["Retirada", "Entrega"].includes(delivery) || !payment) throw new Error("Preencha nome, entrega e pagamento.");
  if (delivery === "Entrega" && !address) throw new Error("Informe o endereço para entrega.");
  if (!cart.length) throw new Error("Adicione pelo menos um produto ao pedido.");

  const lines = cart.map(item => {
    const extras = item.toppings.length ? `\n   Complementos: ${item.toppings.join(", ")}` : "";
    const notesLine = item.notes ? `\n   Observação: ${item.notes}` : "";
    return `• ${item.quantity}x ${item.name} (${item.size || "tamanho não informado"}) — ${money(item.price)} cada${extras}${notesLine}\n   Total do item: ${money(item.price * item.quantity)}`;
  });
  const parts = [
    "Olá! Gostaria de fazer um pedido na Açaíê 💜",
    "",
    `Nome: ${name}`,
    "",
    "PEDIDO:",
    ...lines,
    "",
    `Subtotal: ${money(cartTotal())}`,
    `Total: ${money(cartTotal())}`,
    `Recebimento: ${delivery}`,
    ...(delivery === "Entrega" ? [`Endereço: ${address}`] : []),
    `Pagamento: ${payment}`,
    ...(payment === "Dinheiro" && changeFor ? [`Troco para: R$ ${changeFor}`] : []),
    ...(notes ? [`Observações gerais: ${notes}`] : []),
    "",
    "Enviei pelo site e aguardo a confirmação. Obrigado(a)!"
  ];
  return parts.join("\n");
}
function checkout(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  if (!CONFIG.whatsappNumber || !/^\d{12,15}$/.test(CONFIG.whatsappNumber)) {
    toast("A loja ainda precisa configurar o número do WhatsApp no arquivo script.js.");
    return;
  }
  try {
    const message = buildWhatsAppMessage(new FormData(form));
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) window.location.href = url;
  } catch (error) { toast(error.message || "Confira os dados do pedido."); }
}

function setBusinessLinks() {
  $("#footerAddress").textContent = CONFIG.address;
  $("#footerHours").textContent = CONFIG.openingHours;
  const whatsapp = CONFIG.whatsappNumber && /^\d{12,15}$/.test(CONFIG.whatsappNumber) ? `https://wa.me/${CONFIG.whatsappNumber}` : "";
  const links = [$("#footerWhatsapp"), $("#whatsappFloat")];
  links.forEach(link => {
    if (whatsapp) { link.href = whatsapp; link.target = "_blank"; link.rel = "noopener noreferrer"; }
    else { link.href = "#contato"; link.addEventListener("click", event => { event.preventDefault(); toast("Configure o número de WhatsApp no script.js."); }); }
  });
  if (whatsapp) $("#footerWhatsapp").textContent = "Conversar pelo WhatsApp";
  if (CONFIG.instagramUrl && /^https:\/\/(www\.)?instagram\.com\//i.test(CONFIG.instagramUrl)) {
    $("#footerInstagram").href = CONFIG.instagramUrl;
    $("#footerInstagram").target = "_blank";
    $("#footerInstagram").rel = "noopener noreferrer";
  } else {
    $("#footerInstagram").href = "#contato";
    $("#footerInstagram").addEventListener("click", event => { event.preventDefault(); toast("Configure o perfil do Instagram no script.js."); });
  }
}
function observeReveals(root = document) {
  const items = $$(".reveal:not([data-observed])", root);
  if (!("IntersectionObserver" in window) || reducedMotion()) {
    items.forEach(item => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(item => { item.dataset.observed = "true"; observer.observe(item); });
}
function initNavigation() {
  const header = $(".site-header"), toggle = $("#menuToggle"), nav = $("#mainNav");
  const updateHeader = () => {
    header.classList.toggle("scrolled", window.scrollY > 25);
    $("#backToTop").classList.toggle("visible", window.scrollY > 500);
  };
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  $$("#mainNav a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Abrir menu");
  }));
  $("#backToTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" }));
  document.addEventListener("keydown", event => { if (event.key === "Escape" && $("#cartDrawer").classList.contains("open")) closeCart(); });
}

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add-product]");
  if (addButton) { addProductToCart(addButton.dataset.addProduct); return; }
  if (event.target.closest("[data-open-cart]")) { openCart(); return; }
  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const index = Number(quantityButton.dataset.quantity), delta = Number(quantityButton.dataset.delta);
    if (!Number.isInteger(index) || !cart[index] || ![-1, 1].includes(delta)) return;
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    if (cart[index] && cart[index].quantity > 99) cart[index].quantity = 99;
    afterCartChange(); return;
  }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) { cart.splice(Number(removeButton.dataset.remove), 1); afterCartChange(); toast("Item removido."); return; }
  if (event.target.closest("#browseProducts")) { showCart(); return; }
});

$("#closeCart").addEventListener("click", closeCart);
$("#cartOverlay").addEventListener("click", closeCart);
$("#checkoutOpen").addEventListener("click", openCheckout);
$("#backCheckout").addEventListener("click", () => { $("#checkoutForm").hidden = true; $(".cart-summary").hidden = false; });
$("#checkoutForm").addEventListener("submit", checkout);
$("#addCustom").addEventListener("click", addCustomToCart);
$("#sizeOptions").addEventListener("click", event => {
  const button = event.target.closest("[data-size]");
  if (!button) return;
  selectedSize = Number(button.dataset.size);
  if (!Object.hasOwn(CATALOG.sizes, selectedSize)) return;
  $$(".size-option").forEach(option => option.setAttribute("aria-pressed", String(option === button)));
  updateBuilderTotal();
});
$("#toppingGrid").addEventListener("click", event => {
  const button = event.target.closest("[data-topping]");
  if (!button) return;
  const id = button.dataset.topping;
  if (!CATALOG.toppings.some(t => t.id === id)) return;
  if (selectedToppings.has(id)) selectedToppings.delete(id); else selectedToppings.add(id);
  button.setAttribute("aria-pressed", String(selectedToppings.has(id)));
  updateBuilderTotal();
});
$$('input[name="delivery"]').forEach(input => input.addEventListener("change", () => {
  const delivery = $('input[name="delivery"]:checked').value;
  $("#addressWrap").hidden = delivery !== "Entrega";
  $("#customerAddress").required = delivery === "Entrega";
}));
$("#paymentMethod").addEventListener("change", () => {
  $("#changeWrap").hidden = $("#paymentMethod").value !== "Dinheiro";
});
$("#year").textContent = new Date().getFullYear();

renderProducts();
renderToppings();
renderCart();
updateBuilderTotal();
setBusinessLinks();
initNavigation();
observeReveals();

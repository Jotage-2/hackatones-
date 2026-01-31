const myOrdersBtn = document.getElementById('myOrdersBtn');
const ordersModal = document.getElementById('ordersModal');
const API_URL = 'http://localhost:3000/api';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));

// Elementos DOM
const productsGrid = document.getElementById('productsGrid');
const cartIcon = document.getElementById('cartIcon');
const cartCount = document.getElementById('cartCount');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const cartModal = document.getElementById('cartModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const searchInput = document.getElementById('searchInput');

// Cargar productos
async function loadProducts(search = '') {
  try {
    const url = search ? `${API_URL}/products?search=${search}` : `${API_URL}/products`;
    const res = await fetch(url);
    products = await res.json();
    renderProducts();
  } catch (error) {
    console.error('Error cargando productos:', error);
  }
}

// Renderizar productos
function renderProducts() {
  productsGrid.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description.substring(0, 60)}...</p>
      <p class="price">S/${p.price}</p>
      <button onclick="addToCart('${p._id}')">Agregar al Carrito</button>
    </div>
  `).join('');
}

// Agregar al carrito
function addToCart(productId) {
  const product = products.find(p => p._id === productId);
  const existing = cart.find(item => item.product._id === productId);
  
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ product, quantity: 1, price: product.price });
  }
  
  saveCart();
  updateCartCount();
  alert('Producto agregado al carrito');
}

// Guardar carrito
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Actualizar contador
function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = total;
}

// Mostrar carrito
cartIcon.addEventListener('click', () => {
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Carrito vacío</p>';
    cartTotal.textContent = '0';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <span>${item.product.name} x${item.quantity}</span>
        <span>S/${item.price * item.quantity}</span>
      </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total;
  }
  
  cartModal.classList.add('active');
});

// Login
document.getElementById('loginSubmit').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(currentUser));
      updateAuthUI();
      loginModal.classList.remove('active');
      alert('Sesión iniciada correctamente');
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert('Error al iniciar sesión');
  }
});

// Register
document.getElementById('registerSubmit').addEventListener('click', async () => {
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(currentUser));
      updateAuthUI();
      registerModal.classList.remove('active');
      alert('Cuenta creada exitosamente');
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert('Error al registrarse');
  }
});

// Checkout
document.getElementById('checkoutBtn').addEventListener('click', async () => {
  if (!token) {
    alert('Debes iniciar sesión para comprar');
    return;
  }
  
  if (cart.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const items = cart.map(item => ({
    product: item.product._id,
    quantity: item.quantity,
    price: item.price
  }));
  
  try {
    const res = await fetch(`${API_URL}/orders/checkout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items, total, culqiToken: 'fake_token_123' })
    });
    
    if (res.ok) {
      alert('¡Compra exitosa!');
      cart = [];
      saveCart();
      updateCartCount();
      cartModal.classList.remove('active');
    } else {
      alert('Error en la compra');
    }
  } catch (error) {
    alert('Error al procesar compra');
  }
});

// Aplicar cupón
document.getElementById('applyCouponBtn').addEventListener('click', async () => {
  const code = document.getElementById('couponInput').value;
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  try {
    const res = await fetch(`${API_URL}/cart/apply-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, total })
    });
    
    const data = await res.json();
    if (res.ok) {
      document.getElementById('cartTotal').textContent = data.finalTotal;
      alert(`Cupón aplicado! Descuento: $${data.discount}`);
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert('Error al aplicar cupón');
  }
});

// Búsqueda
searchInput.addEventListener('input', (e) => {
  loadProducts(e.target.value);
});

// UI Auth
function updateAuthUI() {
  if (currentUser) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    myOrdersBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'inline-block';
    userName.textContent = `Hola, ${currentUser.name}`;
  } else {
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    myOrdersBtn.style.display = 'none';
    logoutBtn.style.display = 'none';
    userName.textContent = '';
  }
}

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  token = null;
  currentUser = null;
  updateAuthUI();
  alert('Sesión cerrada');
});
// Cargar mis compras
async function loadMyOrders() {
  if (!token) {
    alert('Debes iniciar sesión');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const orders = await res.json();
    const ordersList = document.getElementById('ordersList');

    if (orders.length === 0) {
      ordersList.innerHTML = '<div class="empty-orders">No tienes compras aún 🛒</div>';
    } else {
      ordersList.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const statusClass = `status-${order.paymentStatus}`;
        const statusText = {
          completed: 'Completado',
          pending: 'Pendiente',
          failed: 'Fallido'
        }[order.paymentStatus];

        const items = order.items.map(item => `
          <div class="order-item">
            <span>${item.product?.name || 'Producto'} x${item.quantity}</span>
            <span>S/${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('');

        return `
          <div class="order-card">
            <div class="order-header">
              <span>📅 ${date}</span>
              <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            ${items}
            ${order.discount > 0 ? `<div style="color: green;">Descuento aplicado: -$${order.discount.toFixed(2)}</div>` : ''}
            <div class="order-total">Total: $${order.finalTotal.toFixed(2)}</div>
          </div>
        `;
      }).join('');
    }

    ordersModal.classList.add('active');
  } catch (error) {
    console.error('Error cargando órdenes:', error);
    alert('Error al cargar tus compras');
  }
}
// Modales
loginBtn.addEventListener('click', () => loginModal.classList.add('active'));
registerBtn.addEventListener('click', () => registerModal.classList.add('active'));
document.getElementById('closeLogin').addEventListener('click', () => loginModal.classList.remove('active'));
document.getElementById('closeRegister').addEventListener('click', () => registerModal.classList.remove('active'));
document.getElementById('closeCart').addEventListener('click', () => cartModal.classList.remove('active'));
myOrdersBtn.addEventListener('click', loadMyOrders);
document.getElementById('closeOrders').addEventListener('click', () => ordersModal.classList.remove('active'));

// Inicializar
updateCartCount();
updateAuthUI();
loadProducts();
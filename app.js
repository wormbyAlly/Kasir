(function () {
  'use strict';

  const KEY = 'kasir_transaksi_v1';
  const $ = (s) => document.querySelector(s);
  const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID'); // n selalu integer
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTgl = (iso) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  let cart = []; // { kode, nama, harga, qty }

  /* ---------- Penyimpanan (localStorage) ---------- */
  function loadTrx() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function saveTrx(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }

  /* ---------- Gambar produk (SVG data-URI, tanpa file eksternal) ---------- */
  const WARNA = { Pistol: '#2e4a47', Senapan: '#6b4f2a', Aksesori: '#4a5568' };
  function gambar(p) {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 80'>" +
      "<rect width='120' height='80' fill='" + (WARNA[p.kategori] || '#444') + "'/>" +
      "<text x='60' y='48' font-family='Georgia,serif' font-size='24' font-weight='700' fill='#efe6d0' text-anchor='middle'>" +
      p.kode.split('-')[0] + '</text></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /* ---------- Navigasi ---------- */
  function show(view) {
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('on', v.id === view));
    document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    if (view === 'dashboard') renderDashboard();
    if (view === 'riwayat') renderRiwayat();
  }
  $('#nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(b.dataset.view); });
  document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => show(b.dataset.goto)));

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    const list = loadTrx();
    $('#stTotal').textContent = rp(list.reduce((a, t) => a + t.total, 0));
    $('#stJumlah').textContent = list.length.toLocaleString('id-ID');
  }

  /* ---------- Katalog & pencarian (FR-01, FR-02) ---------- */
  function renderKatalog() {
    const q = $('#cari').value.trim().toLowerCase();
    const hasil = PRODUCTS.filter((p) => p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q));
    $('#grid').innerHTML = hasil.length
      ? hasil.map((p) =>
        '<button class="prod" data-kode="' + esc(p.kode) + '">' +
        '<img src="' + gambar(p) + '" alt="">' +
        '<div><div class="kode">' + esc(p.kode) + '</div><div class="nama">' + esc(p.nama) + '</div>' +
        '<div class="harga">' + rp(p.harga) + '</div></div></button>').join('')
      : '<div class="empty" style="grid-column:1/-1"><strong>Produk tidak ditemukan</strong>Coba kata kunci atau kode lain.</div>';
  }
  $('#cari').addEventListener('input', renderKatalog);
  $('#grid').addEventListener('click', (e) => {
    const b = e.target.closest('.prod');
    if (b) tambah(b.dataset.kode);
  });

  /* ---------- Keranjang (FR-03, FR-04, FR-05) ---------- */
  function tambah(kode) {
    const item = cart.find((c) => c.kode === kode);
    if (item) { item.qty += 1; }
    else {
      const p = PRODUCTS.find((x) => x.kode === kode);
      if (p) cart.push({ kode: p.kode, nama: p.nama, harga: p.harga, qty: 1 });
    }
    renderCart();
  }
  const totalCart = () => cart.reduce((a, c) => a + c.harga * c.qty, 0);

  function renderCart() {
    const box = $('#cartList');
    if (!cart.length) {
      box.innerHTML = '<div class="empty"><strong>Keranjang masih kosong</strong>Pilih produk di katalog untuk memulai transaksi.</div>';
    } else {
      box.innerHTML = cart.map((c) =>
        '<div class="row" data-kode="' + esc(c.kode) + '">' +
        '<div><div class="nama">' + esc(c.nama) + '</div><div>' + rp(c.harga) + '</div></div>' +
        '<div class="sub">' + rp(c.harga * c.qty) + '</div>' +
        '<div class="qty">' +
        '<button data-act="dec" aria-label="Kurangi"' + (c.qty <= 1 ? ' disabled' : '') + '>−</button>' +
        '<input type="number" min="1" step="1" value="' + c.qty + '" aria-label="Jumlah ' + esc(c.nama) + '">' +
        '<button data-act="inc" aria-label="Tambah">+</button>' +
        '<button class="del" data-act="del">Hapus</button></div></div>').join('');
    }
    $('#cartTotal').textContent = rp(totalCart());
    $('#btnBayar').disabled = !cart.length;
  }

  $('#cartList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const kode = btn.closest('.row').dataset.kode;
    const item = cart.find((c) => c.kode === kode);
    if (!item) return;
    if (btn.dataset.act === 'inc') item.qty += 1;
    if (btn.dataset.act === 'dec' && item.qty > 1) item.qty -= 1;
    if (btn.dataset.act === 'del') cart = cart.filter((c) => c.kode !== kode);
    renderCart();
  });
  // Input kuantitas manual: hanya bilangan bulat positif (minimum 1)
  $('#cartList').addEventListener('change', (e) => {
    if (e.target.tagName !== 'INPUT') return;
    const item = cart.find((c) => c.kode === e.target.closest('.row').dataset.kode);
    const n = Math.floor(Number(e.target.value));
    if (item) item.qty = Number.isFinite(n) && n >= 1 ? Math.min(n, 9999) : 1;
    renderCart();
  });

  /* ---------- Pembayaran (FR-06, FR-11) ---------- */
  const dlgBayar = $('#dlgBayar');
  const uangVal = () => parseInt($('#uang').value.replace(/\D/g, ''), 10) || 0;

  $('#btnBayar').addEventListener('click', () => {
    if (!cart.length) return;
    $('#payTotal').textContent = rp(totalCart());
    $('#uang').value = '';
    cekBayar();
    dlgBayar.showModal();
    $('#uang').focus();
  });
  $('#btnBatal').addEventListener('click', () => dlgBayar.close());

  function cekBayar() {
    const total = totalCart();
    const raw = $('#uang').value.replace(/\D/g, '').slice(0, 12);
    $('#uang').value = raw ? Number(raw).toLocaleString('id-ID') : '';
    const uang = uangVal();
    const cukup = cart.length > 0 && uang >= total;
    $('#payKembali').textContent = cukup ? rp(uang - total) : rp(0);
    $('#payError').textContent = raw && !cukup ? 'Nominal uang kurang! Kurang ' + rp(total - uang) + '.' : '';
    $('#btnSelesai').disabled = !cukup;
    return cukup;
  }
  $('#uang').addEventListener('input', cekBayar);

  $('#formBayar').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cekBayar()) { $('#payError').textContent = 'Nominal uang kurang!'; return; }
    const list = loadTrx();
    const total = totalCart();
    const bayar = uangVal();
    const trx = {
      id: 'TRX-' + String(list.length + 1).padStart(4, '0'),
      waktu: new Date().toISOString(),
      // Snapshot: harga & nama dikunci saat transaksi terjadi (FR-07)
      items: cart.map((c) => ({ kode: c.kode, nama: c.nama, harga: c.harga, qty: c.qty, subtotal: c.harga * c.qty })),
      total: total,
      bayar: bayar,
      kembali: bayar - total
    };
    list.push(trx);
    if (!saveTrx(list)) { $('#payError').textContent = 'Gagal menyimpan transaksi. Penyimpanan browser tidak tersedia.'; return; }
    cart = [];
    renderCart();
    dlgBayar.close();
    tampilStruk(trx, 'Transaksi selesai');
  });

  /* ---------- Struk & detail (FR-09) ---------- */
  function strukHTML(t) {
    const rows = t.items.map((i) =>
      '<div>' + esc(i.nama) + '</div><div class="r"><span>' + i.qty + ' x ' + rp(i.harga) + '</span><span>' + rp(i.subtotal) + '</span></div>').join('');
    return '<div class="struk"><div class="c"><b>ARMERIA FIKTIF</b><br>Struk demonstrasi</div><hr>' +
      '<div>' + esc(t.id) + '</div><div>' + esc(fmtTgl(t.waktu)) + '</div><hr>' + rows + '<hr>' +
      '<div class="r"><b>Total</b><b>' + rp(t.total) + '</b></div>' +
      '<div class="r"><span>Tunai</span><span>' + rp(t.bayar) + '</span></div>' +
      '<div class="r"><span>Kembali</span><span>' + rp(t.kembali) + '</span></div><hr>' +
      '<div class="c">Data fiktif, bukan transaksi nyata</div></div>';
  }
  function tampilStruk(t, judul) {
    $('#strukJudul').textContent = judul;
    $('#strukBox').innerHTML = strukHTML(t);
    $('#dlgStruk').showModal();
  }
  $('#btnTutup').addEventListener('click', () => { $('#dlgStruk').close(); renderDashboard(); renderRiwayat(); });
  $('#btnCetak').addEventListener('click', () => window.print());

  /* ---------- Riwayat (FR-08, FR-10) ---------- */
  function renderRiwayat() {
    const list = loadTrx().slice().reverse();
    $('#riwayatBox').innerHTML = list.length
      ? '<table><thead><tr><th>ID Transaksi</th><th>Tanggal</th><th class="num">Total</th><th>Aksi</th></tr></thead><tbody>' +
        list.map((t) => '<tr><td>' + esc(t.id) + '</td><td>' + esc(fmtTgl(t.waktu)) + '</td><td class="num">' + rp(t.total) +
          '</td><td><button class="btn" data-id="' + esc(t.id) + '">Detail</button></td></tr>').join('') + '</tbody></table>'
      : '<div class="empty"><strong>Belum ada transaksi</strong>Transaksi yang sudah selesai akan muncul di sini.</div>';
  }
  $('#riwayatBox').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    const t = loadTrx().find((x) => x.id === b.dataset.id);
    if (t) tampilStruk(t, 'Detail transaksi');
  });

  /* ---------- Init ---------- */
  renderKatalog();
  renderCart();
  renderDashboard();
  renderRiwayat();
})();

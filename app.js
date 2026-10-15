(function () {
  'use strict';

  const KEY = 'kasir_transaksi_v1';
  const $ = (s) => document.querySelector(s);
  const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID'); // n selalu integer (FR-05 & NFR)
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

  /* ---------- Gambar Produk (Cozy Cartoon SVG data-URI) ---------- */
  function gambar(p) {
    const bgMap = {
      Pistol: { bg: '#E2F4EC', accent: '#52B788', secondary: '#F4D06F' },
      Senapan: { bg: '#FFF0E5', accent: '#FF7675', secondary: '#F4D06F' },
      Aksesori: { bg: '#EAF4FC', accent: '#A0C4E2', secondary: '#52B788' }
    };
    const c = bgMap[p.kategori] || { bg: '#FAF5EE', accent: '#F4D06F', secondary: '#FF7675' };

    let iconSvg = '';
    if (p.kode === 'AKS-03') {
      // Kacamata Pelindung
      iconSvg = "<circle cx='55' cy='50' r='16' fill='#FFFFFF' stroke='#382F2D' stroke-width='4'/>" +
                "<circle cx='105' cy='50' r='16' fill='#FFFFFF' stroke='#382F2D' stroke-width='4'/>" +
                "<path d='M71 50 Q80 44 89 50' fill='none' stroke='#382F2D' stroke-width='4' stroke-linecap='round'/>" +
                "<path d='M39 50 L25 45 M121 50 L135 45' fill='none' stroke='#382F2D' stroke-width='4' stroke-linecap='round'/>" +
                "<circle cx='60' cy='46' r='4' fill='#A0C4E2'/>" +
                "<circle cx='110' cy='46' r='4' fill='#A0C4E2'/>";
    } else if (p.kode === 'AKS-06') {
      // Papan Target
      iconSvg = "<circle cx='80' cy='50' r='32' fill='#FFFFFF' stroke='#382F2D' stroke-width='4'/>" +
                "<circle cx='80' cy='50' r='22' fill='#FF7675' stroke='#382F2D' stroke-width='3'/>" +
                "<circle cx='80' cy='50' r='12' fill='#FFFFFF' stroke='#382F2D' stroke-width='3'/>" +
                "<circle cx='80' cy='50' r='5' fill='#F4D06F' stroke='#382F2D' stroke-width='2'/>";
    } else if (p.kode === 'AKS-02') {
      // Tas Penyimpanan
      iconSvg = "<rect x='45' y='36' width='70' height='46' rx='10' fill='#F4D06F' stroke='#382F2D' stroke-width='4'/>" +
                "<path d='M65 36 V26 C65 20 95 20 95 26 V36' fill='none' stroke='#382F2D' stroke-width='4' stroke-linecap='round'/>" +
                "<circle cx='80' cy='56' r='5' fill='#FF7675' stroke='#382F2D' stroke-width='2'/>" +
                "<line x1='45' y1='56' x2='115' y2='56' stroke='#382F2D' stroke-width='2.5' stroke-dasharray='4,4'/>";
    } else if (p.kategori === 'Pistol') {
      // Cartoon Pistol Blaster
      iconSvg = "<rect x='48' y='38' width='64' height='20' rx='8' fill='#52B788' stroke='#382F2D' stroke-width='4'/>" +
                "<path d='M88 56 L76 80 L62 76 L70 56' fill='#F4D06F' stroke='#382F2D' stroke-width='4' stroke-linejoin='round'/>" +
                "<rect x='108' y='44' width='14' height='8' rx='3' fill='#FF7675' stroke='#382F2D' stroke-width='3'/>" +
                "<circle cx='62' cy='48' r='4' fill='#FFFFFF' stroke='#382F2D' stroke-width='2'/>";
    } else if (p.kategori === 'Senapan') {
      // Cartoon Rifle Blaster
      iconSvg = "<rect x='30' y='42' width='92' height='16' rx='7' fill='#FF7675' stroke='#382F2D' stroke-width='4'/>" +
                "<rect x='120' y='46' width='22' height='8' rx='3' fill='#382F2D'/>" +
                "<path d='M30 46 L14 66 L26 70 L44 54' fill='#F4D06F' stroke='#382F2D' stroke-width='4' stroke-linejoin='round'/>" +
                "<rect x='70' y='34' width='24' height='8' rx='4' fill='#52B788' stroke='#382F2D' stroke-width='3'/>";
    } else {
      // Aksesori Umum / Kit
      iconSvg = "<rect x='52' y='36' width='56' height='48' rx='12' fill='#A0C4E2' stroke='#382F2D' stroke-width='4'/>" +
                "<circle cx='80' cy='58' r='10' fill='#FFFFFF' stroke='#382F2D' stroke-width='3'/>" +
                "<path d='M80 52 V64 M74 58 H86' stroke='#52B788' stroke-width='3.5' stroke-linecap='round'/>";
    }

    // Sparkles & background details
    const sparkles = "<path d='M25 24 L27 18 L29 24 L35 26 L29 28 L27 34 L25 28 L19 26 Z' fill='" + c.secondary + "'/>" +
                     "<circle cx='135' cy='25' r='4' fill='" + c.accent + "'/>" +
                     "<circle cx='142' cy='33' r='2' fill='" + c.accent + "'/>";

    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 110'>" +
      "<rect width='160' height='110' fill='" + c.bg + "'/>" +
      sparkles +
      iconSvg +
      "</svg>";
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /* ---------- Navigasi Antar Halaman ---------- */
  function show(view) {
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('on', v.id === view));
    document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    if (view === 'dashboard') renderDashboard();
    if (view === 'riwayat') renderRiwayat();
  }
  $('#nav').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) show(b.dataset.view);
  });
  document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => show(b.dataset.goto)));

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    const list = loadTrx();
    $('#stTotal').textContent = rp(list.reduce((a, t) => a + t.total, 0));
    $('#stJumlah').textContent = list.length.toLocaleString('id-ID');
  }

  /* ---------- Katalog & Pencarian (FR-01, FR-02) ---------- */
  function renderKatalog() {
    const q = $('#cari').value.trim().toLowerCase();
    const hasil = PRODUCTS.filter((p) => p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q));
    $('#grid').innerHTML = hasil.length
      ? hasil.map((p) =>
        '<button class="prod" data-kode="' + esc(p.kode) + '">' +
        '<img src="' + gambar(p) + '" alt="' + esc(p.nama) + '" loading="lazy">' +
        '<div class="prod-body">' +
        '<span class="prod-tag">' + esc(p.kategori) + '</span>' +
        '<div class="kode">' + esc(p.kode) + '</div>' +
        '<div class="nama">' + esc(p.nama) + '</div>' +
        '<div class="harga">' + rp(p.harga) + '</div></div></button>').join('')
      : '<div class="empty" style="grid-column:1/-1">' +
        '<span class="empty-icon" aria-hidden="true">🔍</span>' +
        '<strong>Produk Tidak Ditemukan</strong>' +
        '<p>Coba kata kunci atau kode produk lain ya.</p></div>';
  }
  $('#cari').addEventListener('input', renderKatalog);
  $('#grid').addEventListener('click', (e) => {
    const b = e.target.closest('.prod');
    if (b) tambah(b.dataset.kode);
  });

  /* ---------- Keranjang (FR-03, FR-04, FR-05) ---------- */
  function tambah(kode) {
    const item = cart.find((c) => c.kode === kode);
    if (item) {
      item.qty += 1;
    } else {
      const p = PRODUCTS.find((x) => x.kode === kode);
      if (p) cart.push({ kode: p.kode, nama: p.nama, harga: p.harga, qty: 1 });
    }
    renderCart();
  }
  const totalCart = () => cart.reduce((a, c) => a + c.harga * c.qty, 0);

  function renderCart() {
    const box = $('#cartList');
    const totalQty = cart.reduce((a, c) => a + c.qty, 0);
    const pill = $('#cartPill');
    if (pill) pill.textContent = totalQty + ' Item';

    if (!cart.length) {
      box.innerHTML = '<div class="empty">' +
        '<span class="empty-icon" aria-hidden="true">🛒</span>' +
        '<strong>Keranjang Masih Kosong</strong>' +
        '<p>Yuk pilih item dari katalog untuk memulai transaksi.</p></div>';
    } else {
      box.innerHTML = cart.map((c) =>
        '<div class="row" data-kode="' + esc(c.kode) + '">' +
        '<div><div class="nama">' + esc(c.nama) + '</div><div class="unit-price">' + rp(c.harga) + ' / item</div></div>' +
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
    tampilStruk(trx, 'Transaksi Selesai 🎉');
  });

  /* ---------- Struk & Detail Transaksi (FR-09) ---------- */
  function strukHTML(t) {
    const rows = t.items.map((i) =>
      '<div>' + esc(i.nama) + '</div><div class="r"><span>' + i.qty + ' x ' + rp(i.harga) + '</span><span>' + rp(i.subtotal) + '</span></div>').join('');
    return '<div class="struk">' +
      '<div class="c"><b>🎯 ARMERIA FIKTIF</b><br>Kasir Ramah & Sederhana<br><small>Struk Demonstrasi Edukasi</small></div><hr>' +
      '<div><b>' + esc(t.id) + '</b></div><div>' + esc(fmtTgl(t.waktu)) + '</div><hr>' + rows + '<hr>' +
      '<div class="r"><b>Total</b><b>' + rp(t.total) + '</b></div>' +
      '<div class="r"><span>Tunai</span><span>' + rp(t.bayar) + '</span></div>' +
      '<div class="r"><span>Kembali</span><span>' + rp(t.kembali) + '</span></div><hr>' +
      '<div class="c"><small>Terima kasih atas kunjungan Anda!<br>*** Data fiktif demonstrasi ***</small></div></div>';
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
      ? '<table><thead><tr><th>ID Transaksi</th><th>Tanggal & Waktu</th><th class="num">Total</th><th>Aksi</th></tr></thead><tbody>' +
        list.map((t) => '<tr><td><b>' + esc(t.id) + '</b></td><td>' + esc(fmtTgl(t.waktu)) + '</td><td class="num"><b>' + rp(t.total) +
          '</b></td><td><button class="btn" data-id="' + esc(t.id) + '">Detail Struk 🔍</button></td></tr>').join('') + '</tbody></table>'
      : '<div class="empty">' +
        '<span class="empty-icon" aria-hidden="true">📜</span>' +
        '<strong>Belum Ada Transaksi</strong>' +
        '<p>Transaksi yang telah berhasil diselesaikan akan tercatat rapi di sini.</p></div>';
  }

  $('#riwayatBox').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    const t = loadTrx().find((x) => x.id === b.dataset.id);
    if (t) tampilStruk(t, 'Detail Transaksi 📜');
  });

  /* ---------- Inisialisasi ---------- */
  renderKatalog();
  renderCart();
  renderDashboard();
  renderRiwayat();
})();

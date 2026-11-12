# Real-Time Kitchen Display System (KDS) — Mie Gacoan (PT Pesta Pora Abadi)

> **Live Demo / Preview:** [**https://ppakds.farstywan.my.id/**](https://ppakds.farstywan.my.id/)

Purwarupa **Real-Time Kitchen Display System (KDS)** berbasis **Next.js (App Router)** dan **TypeScript** untuk memantau serta mengelola antrean dapur berkecepatan tinggi (*Incoming*, *Cooking*, dan *Ready*).

Proyek ini dirancang khusus untuk menjawab tantangan teknis di lapangan pada operasional outlet F&B dengan *order rate* tinggi:
1. **Zero Timer Re-render Propagation** — Durasi tunggu pesanan berdetak setiap detik tanpa memicu *re-render* ke *parent board* maupun kartu pesanan lainnya.
2. **Optimistic State Update & Targeted Rollback** — Transisi status kartu berlangsung instan (`0ms` di layar) meski *request* `PATCH` memiliki *artificial network delay* (`~400ms`), disertai mekanisme *rollback* presisi dan *toast alert* apabila jaringan gagal.
3. **Presisi Server vs Client Boundary** — Halaman utama (`src/app/page.tsx`) tetap menjadi **React Server Component (RSC)** murni, sementara direktif `'use client'` hanya ditempatkan pada *interactive leaf/island components*.
4. **URL State Synchronization (`?search=...`)** — Pencarian nomor pesanan (`#ORD-101`), nomor meja (`Meja 08`), maupun nama menu tersinkronisasi langsung dengan *query string* URL dan aman saat halaman di-*refresh*.

---

## Panduan Menjalankan Aplikasi Secara Lokal

### Prasyarat
- **Node.js** `>= 18.18.0` (direkomendasikan v20 atau v22 LTS)
- **npm**

### Langkah Instalasi & Menjalankan Server Development
```bash
# 1. Clone repositori
git clone https://github.com/Farstywn/PPARealTimeKitchenDisplaySystem.git
cd PPARealTimeKitchenDisplaySystem

# 2. Install dependensi
npm install

# 3. Jalankan development server
npm run dev
```
Buka **`http://localhost:3000`** di browser untuk melihat dashboard KDS.

### Menjalankan Build Produksi
```bash
npm run build
npm run start
```

---

## Struktur Direktori & Arsitektur Komponen

```text
src/
├── app/
│   ├── api/
│   │   └── orders/
│   │       ├── route.ts            # GET /api/orders & POST reset store
│   │       └── [id]/
│   │           └── route.ts        # PATCH /api/orders/[id] (validasi + delay 400ms)
│   ├── globals.css                 # Styling global & selector atribut [data-urgency]
│   ├── layout.tsx                  # Root Server Layout
│   └── page.tsx                    # Server Component (RSC) - Initial Data Fetch & Header
├── components/
│   ├── kds/
│   │   ├── KanbanBoard.tsx         # 'use client' - Optimistic state, in-flight & rollback
│   │   ├── KanbanColumn.tsx        # 'use client' (React.memo) - Kolom Incoming/Cooking/Ready
│   │   ├── OrderCard.tsx           # 'use client' (React.memo) - Kartu pesanan & drag/click
│   │   ├── OrderTimer.tsx          # 'use client' (React.memo + useRef) - Isolated Live Timer
│   │   └── SearchBar.tsx           # 'use client' - Sinkronisasi URL (?search=...)
│   └── ui/
│       └── ToastContainer.tsx      # 'use client' - Notifikasi error rollback
├── lib/
│   └── orders-store.ts             # Singleton in-memory store (globalThis)
└── types/
    └── order.ts                    # Definisi tipe data & helper validasi status
```

---

## Catatan Teknis Utama (Engineering Explanations)

### 1. Isolasi Komponen Live Timer Tanpa Memicu Re-render (`OrderTimer.tsx`)

#### Masalah Umum di Lapangan
Jika durasi tunggu disimpan menggunakan `useState` di level `KanbanBoard` atau `OrderCard` dengan `setInterval(..., 1000)`, maka setiap detik seluruh pohon komponen (`KanbanBoard` → 3 `KanbanColumn` → 8+ `OrderCard` → puluhan item menu) akan mengalami siklus *re-render* berulang. Pada outlet sibuk dengan puluhan pesanan aktif, hal ini menyebabkan UI *lag*, *flickering*, dan *layout thrashing*.

#### Solusi Arsitektur yang Diterapkan
Kami menerapkan **dua lapis isolasi** pada [`src/components/kds/OrderTimer.tsx`](src/components/kds/OrderTimer.tsx):

1. **Isolasi Siklus Render via `useRef` & Manipulasi `textContent` Langsung (Zero React Re-render per Detik)**
   - Alih-alih memanggil `setState` setiap `1000ms` (yang tetap memaksa React menjalankan *Virtual DOM diffing* setiap detik), komponen `OrderTimer` memegang referensi langsung ke *leaf DOM node* melalui `textRef = useRef<HTMLSpanElement>(null)` dan `badgeRef = useRef<HTMLDivElement>(null)`.
   - Di dalam `useEffect`, `setInterval` menghitung selisih waktu terhadap `Date.parse(createdAt)` lalu memperbarui `textRef.current.textContent` (contoh: `"5m 12s lalu"`) serta atribut `badgeRef.current.dataset.urgency` (`"normal"` | `"warning"` | `"critical"` | `"completed"`) secara langsung di DOM.
   - Styling warna indikator SLA dikendalikan oleh selector atribut CSS murni (`.kds-timer-badge[data-urgency="..."]` di `globals.css`) dan font angka menggunakan `tabular-nums` (`font-variant-numeric: tabular-nums`) sehingga perubahan lebar karakter angka (`1` ke `8`) tidak pernah memicu *browser layout reflow / layout thrashing*.

2. **Isolasi Batas Komponen via `React.memo`**
   - `OrderTimer` dibungkus `React.memo` dengan komparator `(prev, next) => prev.createdAt === next.createdAt && prev.status === next.status`.
   - `OrderCard` juga dibungkus `React.memo` dengan referensi prop fungsi (`onStatusChange`, `onDragStartOrder`, `onDragEndOrder`) yang dijaga tetap stabil menggunakan `useCallback` + `useRef`.

#### Catatan Verifikasi dari React DevTools Profiler
Cara memverifikasi secara langsung di browser:
1. Buka aplikasi di Chrome (`http://localhost:3000`) dan buka **React DevTools** → tab **Profiler**.
2. Klik ikon **Settings (⚙️)** pada Profiler → centang **"Record why each component rendered while profiling"** dan **"Highlight updates when components render"**.
3. Klik tombol **Record (🔵)** dan biarkan aplikasi berjalan selama **10–15 detik** sambil mengamati seluruh timer kartu pesanan berdetak (`5m 12s lalu` → `5m 13s lalu` → dst.).
4. Hentikan rekaman Profiler:
   - **Hasil ketika tidak ada interaksi klik**: **0 commit React tercatat** selama timer berdetak setiap detik! Seluruh 8 timer di layar ter-update secara *real-time* di DOM tanpa satu pun siklus *re-render* pada `KanbanBoard`, `KanbanColumn`, `OrderCard`, maupun `OrderTimer`.
   - **Hasil ketika 1 kartu dipindah status**: Hanya kartu yang bersangkutan (`OrderCard`) dan kolom terkait yang di-*render*, sedangkan **7 `OrderCard` lainnya berstatus *Did not render*** karena terjaga oleh `React.memo` dan referensi objek yang tidak berubah.

---

### 2. Pendekatan Optimistic State Update & Rollback saat Request Network Gagal (`KanbanBoard.tsx`)

#### Alur Kerja Optimistic Update & Rollback
Implementasi pada [`src/components/kds/KanbanBoard.tsx`](src/components/kds/KanbanBoard.tsx) dirancang agar staf dapur tidak pernah tertahan oleh latensi jaringan (`~400ms`):

```mermaid
sequenceDiagram
    participant Staff as Staf Dapur (UI)
    participant Board as KanbanBoard State
    participant API as PATCH /api/orders/[id]

    Staff->>Board: Klik "Masak" / Drag #ORD-101 (Incoming -> Cooking)
    Note over Board: 1. Simpan snapshot confirmedStatusRef ("incoming")
    Note over Board: 2. Increment requestSeqRef[ord-1] (cegah race condition)
    Board-->>Staff: 3. Optimistic Update (0ms): Kartu langsung pindah ke kolom Cooking + badge "Syncing..."
    Board->>API: 4. Fetch PATCH /api/orders/ord-1 { status: "cooking" }
    Note over API: Validasi payload + Artificial Delay ~400ms
    alt Request Sukses (200 OK)
        API-->>Board: Return updatedOrder
        Board-->>Staff: Update confirmedStatusRef("cooking") & hilangkan badge "Syncing..."
    else Request Gagal (503 / 400 / Network Drop)
        API-->>Board: Error Response / Network Exception
        Note over Board: 5. Targeted Functional Rollback (hanya ord-1 kembali ke "incoming")
        Board-->>Staff: Kartu #ORD-101 kembali ke Incoming + Tampilkan Toast Alert Error
    end
```

#### Mengapa Menggunakan *Targeted Functional Rollback* + *Request Sequence Guard*?
1. **Tidak Menimpa Kartu Lain yang Sedang Berjalan Bersamaan (*Concurrent Safe*)**:
   - Jika staf dapur memindahkan `#ORD-101` lalu `100ms` kemudian memindahkan `#ORD-102`, menyimpan *snapshot* seluruh array `orders` secara naif akan berbahaya karena *rollback* pada `#ORD-101` bisa ikut membatalkan perubahan `#ORD-102`.
   - Solusi kami menyimpan status terkonfirmasi per-ID di `confirmedStatusRef` (`Map<string, OrderStatus>`) dan melakukan *rollback* secara spesifik hanya pada ID pesanan yang gagal menggunakan *functional state update*:
     ```ts
     setOrders((prevOrders) =>
       prevOrders.map((item) =>
         item.id === orderId
           ? { ...item, status: previousConfirmedStatus }
           : item
       )
     );
     ```
2. **Pencegahan *Race Condition* (`requestSeqRef`)**:
   - Setiap kali sebuah kartu dipindahkan, nomor urut *request* untuk `orderId` tersebut di-increment (`requestSeqRef.current.set(orderId, currentSeq)`). Jika ada respons lama yang baru selesai setelah aksi yang lebih baru, respons usang (*stale*) tersebut diabaikan.

#### Cara Menguji Mekanisme Rollback Secara Langsung
1. Di bagian atas papan KDS, klik tombol **"Simulasi Gagal API: Nonaktif"** hingga berubah menjadi **"Simulasi Gagal API: Aktif"**.
2. Klik tombol **"Masak"** pada salah satu kartu di kolom *Incoming* (atau *drag-and-drop* kartu ke kolom lain).
3. Amati hasilnya:
   - Kartu **langsung berpindah kolom seketika** (`0ms`) dengan indikator `Menyinkronkan...`.
   - Setelah simulasi delay `~400ms`, endpoint `PATCH /api/orders/[id]` mengembalikan `503 Service Unavailable`.
   - Kartu **otomatis kembali (*rollback*)** ke kolom asalnya dan muncul **Toast Alert Error** di pojok kanan bawah layar beserta detail transisi yang di-*rollback*.

---

## Dokumentasi Endpoint API

### 1. `GET /api/orders`
Mengambil daftar pesanan dari *in-memory store*.
```bash
curl http://localhost:3000/api/orders
```

### 2. `PATCH /api/orders/[id]`
Mengubah status pesanan dengan validasi *payload* ketat dan *artificial delay* `400ms`.
- **Body Valid**: `{ "status": "incoming" | "cooking" | "ready", "simulateError"?: boolean }`
- **Response `200 OK`**: Mengembalikan objek `Order` terbaru.
- **Response `400 Bad Request`**: Jika JSON tidak valid atau nilai `status` di luar `incoming | cooking | ready`.
- **Response `404 Not Found`**: Jika `id` pesanan tidak ditemukan.
- **Response `503 Service Unavailable`**: Jika mode simulasi gagal diaktifkan (`simulateError: true`).

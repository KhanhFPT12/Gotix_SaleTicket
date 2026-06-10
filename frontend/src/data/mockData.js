export const TICKET_CATEGORIES = [
  { id: "movie", label: "Vé phim", icon: "🎬" },
];

export const LOCATIONS = [
  "Đà Nẵng",
];

export const CINEMA_CHAINS = [
  "CGV Vincom Plaza Đà Nẵng",
  "CGV Vĩnh Trung Plaza",
  "Lotte Cinema Đà Nẵng",
  "BHD Star Vincom Đà Nẵng",
  "Galaxy Coop Mart Đà Nẵng",
  "Metiz Cinema Đà Nẵng",
  "Starlight Nguyễn Kim Đà Nẵng",
  "Khác",
];

export const USERS = [
  {
    id: "u1", name: "Nguyễn Văn An", email: "an@gmail.com", password: "123456",
    role: "seller", avatar: null, phone: "0901234567", rating: 4.8,
    totalSold: 23, joinDate: "2024-01-15", verified: true,
  },
  {
    id: "u2", name: "Trần Thị Bình", email: "binh@gmail.com", password: "123456",
    role: "buyer", avatar: null, phone: "0912345678", rating: null,
    totalSold: 0, joinDate: "2024-03-20", verified: true,
  },
];

export const TICKETS = [
  {
    id: "t1",
    title: "Avengers: Secret Wars",
    category: "movie",
    location: "CGV Vincom Plaza Đà Nẵng",
    city: "Đà Nẵng",
    date: "2026-07-15",
    time: "20:30",
    originalPrice: 80000,
    passPrice: 60000,
    quantity: 2,
    images: [],
    description: "Suất tối 20:30, ghế đôi SWEETBOX. Bận đột xuất không đi được.",
    sellerId: "u1",
    status: "approved",
    verified: true,
    createdAt: "2026-06-01",
    views: 245,
    movieTitle: "Avengers: Secret Wars",
    cinema: "CGV Vincom Plaza Đà Nẵng",
    cinemaAddress: "Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng",
    room: "Phòng 5",
    seats: ["S7", "S8"],
  },
  {
    id: "t2",
    title: "Inside Out 3",
    category: "movie",
    location: "Lotte Cinema Đà Nẵng",
    city: "Đà Nẵng",
    date: "2026-07-08",
    time: "14:00",
    originalPrice: 80000,
    passPrice: 60000,
    quantity: 2,
    images: [],
    description: "Suất chiếu 2D. Ghế D5, D6. Lịch trùng không xem được.",
    sellerId: "u2",
    status: "approved",
    verified: true,
    createdAt: "2026-06-05",
    views: 43,
    movieTitle: "Inside Out 3",
    cinema: "Lotte Cinema Đà Nẵng",
    cinemaAddress: "Lotte Mart Đà Nẵng, 6 Nai Nam, Đà Nẵng",
    room: "Phòng 4",
    seats: ["D5", "D6"],
  },
];

export const TRANSACTIONS = [];
export const REVIEWS = [];
export const REPORTS = [];
export const CHAT_MESSAGES = [];

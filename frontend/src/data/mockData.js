export const TICKET_CATEGORIES = [
  { id: "movie", label: "Vé phim", icon: "🎬" },
];

export const LOCATIONS = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Nha Trang",
  "Đà Lạt",
  "Huế",
];

export const CINEMA_CHAINS = [
  "CGV", "BHD Star", "Lotte Cinema", "Galaxy Cinema",
  "Mega GS", "Beta Cinemas", "Cinestar", "Khác",
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
    location: "CGV Vincom Đống Đa",
    city: "Hà Nội",
    date: "2025-08-15",
    time: "20:30",
    originalPrice: 120000,
    passPrice: 90000,
    quantity: 2,
    images: [],
    description: "Suất tối 20:30, ghế đôi SWEETBOX. Bận đột xuất không đi được.",
    sellerId: "u1",
    status: "approved",
    verified: true,
    createdAt: "2025-05-01",
    views: 245,
    movieTitle: "Avengers: Secret Wars",
    cinema: "CGV Vincom Đống Đa",
    cinemaAddress: "Vincom Đống Đa, Hà Nội",
    room: "Phòng 5",
    seats: ["S7", "S8"],
  },
  {
    id: "t2",
    title: "Inside Out 3",
    category: "movie",
    location: "CGV Crescent Mall",
    city: "TP. Hồ Chí Minh",
    date: "2025-06-08",
    time: "14:00",
    originalPrice: 110000,
    passPrice: 80000,
    quantity: 2,
    images: [],
    description: "Suất chiếu 2D. Ghế D5, D6. Lịch trùng không xem được.",
    sellerId: "u2",
    status: "approved",
    verified: true,
    createdAt: "2025-05-20",
    views: 43,
    movieTitle: "Inside Out 3",
    cinema: "CGV Crescent Mall",
    cinemaAddress: "Crescent Mall, Quận 7, TP.HCM",
    room: "Phòng 4",
    seats: ["D5", "D6"],
  },
];

export const TRANSACTIONS = [];
export const REVIEWS = [];
export const REPORTS = [];
export const CHAT_MESSAGES = [];

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTickets } from "../../context/TicketContext";
import { TICKET_CATEGORIES } from "../../data/mockData";
import "./AIChatBot.css";

// ── AI Brain: knowledge base + intent engine ─────────────────────────────────

const CATEGORY_KEYWORDS = {
  bus: [
    "xe", "xe khách", "xe khach", "xe buýt", "xe buyt", "xe giường nằm", "xe giuong nam", "limousine", "bus",
    "xe đò", "xe do", "xe coach", "bến xe", "ben xe", "phương trang", "phuong trang", "thành bưởi", "thanh buoi",
    "xe đi", "xe di", "vé xe", "ve xe", "chuyến xe", "chuyen xe", "nhà xe", "nha xe",
  ],
  train: [
    "tàu", "tau", "tàu hoả", "tau hoa", "tàu lửa", "tau lua", "ga", "giường nằm tàu", "giuong nam tau",
    "toa", "đường sắt", "duong sat", "train", "se1", "se2", "se3", "vé tàu", "ve tau",
  ],
  concert: [
    "concert", "ca nhạc", "ca nhac", "nhạc sống", "nhac song", "show", "liveshow", "live concert",
    "đại nhạc hội", "dai nhac hoi", "nhạc", "nhac", "biểu diễn", "bieu dien", "nghệ sĩ", "nghe si",
    "singer", "band", "anh trai", "lệ quyên", "le quyen", "sơn tùng", "son tung", "mtp", "blackpink", "monsoon",
    "vé concert", "ve concert", "âm nhạc", "am nhac", "vé ca nhạc", "ve ca nhac",
  ],
  movie: [
    "phim", "xem phim", "vé phim", "ve phim", "vé xem phim", "ve xem phim",
    "rạp", "rap", "rạp phim", "rap phim", "rạp chiếu", "rap chieu", "cinema", "movie",
    "cgv", "lotte", "bhd", "galaxy", "cinestar", "beta", "imax", "4dx", "3d", "2d", "sweetbox",
    "chiếu phim", "chieu phim", "suất chiếu", "suat chieu", "màn ảnh", "man anh",
    "phim hành động", "phim hanh dong", "phim tình cảm", "phim tinh cam", "phim kinh dị", "phim kinh di",
    "phim hoạt hình", "phim hoat hinh", "phim hài", "phim hai", "phim võ thuật", "phim vo thuat",
    "lật mặt", "lat mat", "avengers", "inside out", "deadpool", "wolverine", "kung fu panda",
    "demon slayer", "interstellar", "dark knight", "avatar", "past lives", "encanto", "spiderman", "spider-man",
  ],
  sport: [
    "bóng đá", "bong da", "thể thao", "the thao", "sport", "trận đấu", "tran dau", "sân vận động", "san van dong",
    "aff", "v-league", "vleague", "cup", "chung kết", "chung ket", "bóng rổ", "bong ro", "tennis",
    "cầu lông", "cau long", "football", "soccer", "khán đài", "khan dai", "thi đấu", "thi dau", "vé bóng đá", "ve bong da",
  ],
  event: [
    "sự kiện", "su kien", "event", "triển lãm", "trien lam", "festival", "lễ hội", "le hoi", "hội chợ", "hoi cho",
    "van gogh", "ánh sáng", "anh sang", "trưng bày", "trung bay", "expo", "vé sự kiện", "ve su kien",
  ],
  workshop: [
    "workshop", "hội thảo", "hoi thao", "khóa học", "khoa hoc", "học", "hoc", "seminar", "training",
    "kỹ năng", "ky nang", "vẽ tranh", "ve tranh", "thiền", "thien", "yoga", "nấu ăn", "nau an",
    "lớp học", "lop hoc", "dạy học", "day hoc",
  ],
};

const LOCATION_KEYWORDS = {
  "Hà Nội": ["hà nội", "ha noi", "hn", "thủ đô", "thu do", "bắc", "miền bắc", "mien bac"],
  "TP. Hồ Chí Minh": ["hồ chí minh", "ho chi minh", "tp.hcm", "tphcm", "hcm", "sài gòn", "sai gon", "sg", "miền nam", "mien nam", "nam"],
  "Đà Nẵng": ["đà nẵng", "da nang", "dn", "miền trung", "mien trung"],
};

const INTENT_PATTERNS = [
  { intent: "search_ticket", patterns: [
    "tìm", "tim", "muốn mua", "muon mua", "cần mua", "can mua", "có vé", "co ve",
    "bán", "ban", "còn vé", "con ve", "tìm giúp", "tim giup", "mua vé", "mua ve",
    "cần vé", "can ve", "kiếm vé", "kiem ve", "search", "show", "xem phim",
    "vé phim", "ve phim", "đi xem", "di xem", "muốn xem", "muon xem", "tìm phim", "tim phim",
    "có phim", "co phim", "phim gì", "phim gi", "phim nào", "phim nao", "suất chiếu", "suat chieu",
    "rạp nào", "rap nao", "kiếm", "kiem",
  ]},
  { intent: "greeting", patterns: [
    "xin chào", "xin chao", "hello", "hi", "chào", "chao", "hey", "alo", "xin hỏi", "xin hoi"
  ] },
  { intent: "help", patterns: [
    "giúp", "giup", "help", "hướng dẫn", "huong dan", "làm thế nào", "lam the nao",
    "cách", "cach", "instruction", "thế nào", "the nao"
  ] },
  { intent: "about", patterns: [
    "gotix là gì", "gotix la gi", "gotix", "về gotix", "ve gotix", "nền tảng", "nen tang",
    "platform", "app này", "app nay"
  ] },
  { intent: "price", patterns: [
    "giá", "gia", "bao nhiêu", "bao nhieu", "phí", "phi", "price", "cost", "chi phí", "chi phi", "tiền", "tien"
  ] },
  { intent: "trust", patterns: [
    "uy tín", "uy tin", "lừa đảo", "lua dao", "an toàn", "an toan", "safe", "trust",
    "có đảm bảo", "co dam bao", "giả mạo", "gia mao"
  ] },
];

const SEARCH_STOPWORDS = [
  "tìm kiếm", "tìm giúp", "tìm", "kiếm", "muốn mua", "muon mua", "cần mua", "can mua", "mua",
  "pass lại", "pass", "nhượng lại", "nhượng", "bán lại", "bán", "ban",
  "có vé", "co ve", "còn vé", "con ve", "có", "co", "còn", "con", "vé", "ve", "với", "voi",
  "cho", "giúp", "giup", "hộ", "ho", "ở đâu", "o dau", "ở", "o", "tại", "tai", "nào", "nao",
  "gì", "gi", "không", "khong", "nhỉ", "nhi", "nhé", "nhe", "nha", "được không", "duoc khong",
  "hỏi", "hoi", "cho hỏi", "cho hoi", "xin hỏi", "xin hoi", "lịch chiếu", "lich chieu",
  "suất chiếu", "suat chieu", "rạp", "rap", "cinema", "phim", "xem", "đi xem", "di xem",
  "muốn xem", "muon xem", "xem phim"
];

// Helper to clean and pad text for whole-word / exact phrase matching
function prepareText(text) {
  if (!text) return " ";
  const cleaned = text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?@'"\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? ` ${cleaned} ` : " ";
}

function prepareKeyword(k) {
  const cleaned = k
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?@'"\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ` ${cleaned} `;
}

function detectIntent(text) {
  const prepared = prepareText(text);
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => prepared.includes(prepareKeyword(p)))) return intent;
  }
  return "unknown";
}

function detectCategory(text) {
  const prepared = prepareText(text);
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => prepared.includes(prepareKeyword(k)))) return cat;
  }
  return null;
}

function detectLocation(text) {
  const prepared = prepareText(text);
  for (const [loc, keywords] of Object.entries(LOCATION_KEYWORDS)) {
    if (keywords.some((k) => prepared.includes(prepareKeyword(k)))) return loc;
  }
  return null;
}

function extractSearchQuery(text) {
  if (!text) return "";
  let q = text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?@'"\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  if (!q) return "";
  q = ` ${q} `;
  
  const sortedStopwords = [...SEARCH_STOPWORDS].sort((a, b) => b.length - a.length);
  
  for (const word of sortedStopwords) {
    const target = ` ${word.trim()} `;
    while (q.includes(target)) {
      q = q.replace(target, " ");
    }
  }
  
  for (const keywords of Object.values(LOCATION_KEYWORDS)) {
    for (const kw of keywords) {
      const target = ` ${kw.trim()} `;
      while (q.includes(target)) {
        q = q.replace(target, " ");
      }
    }
  }
  
  return q.replace(/\s+/g, ' ').trim();
}

function searchTickets(tickets, category, location, query) {
  let results = tickets.filter(
    (t) => t.status === "approved" || t.verifyStatus === "verified" || t.status === "available"
  );

  if (category) results = results.filter((t) => t.category === category);
  if (location) results = results.filter((t) => t.location?.toLowerCase().includes(location.toLowerCase()));

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q)
    );
  }

  return results.slice(0, 6);
}

// ── AI Response generator ────────────────────────────────────────────────────

const EMOTIONS = {
  sad: {
    label: "Sad (Buồn bã)",
    energy: "low",
    vibe: "Acoustic chill & Healing",
    confidence: 0.85,
    keywords: ["buồn", "sad", "tệ", "khóc", "nản", "chán", "down", "thất vọng", "tổn thương", "đau lòng", "cô đơn", "khoc", "buon", "te", "nan", "chan", "that vong", "ton thuong", "dau long"],
    responseIntro: "If hôm nay bạn hơi buồn và muốn trốn thế giới một xíu, một góc nhỏ nghe acoustic hay rạp phim yên tĩnh sẽ giúp xoa dịu tâm hồn á. Chuyện gì rồi cũng sẽ qua thui nha! 🤍",
    categories: ["movie", "concert"],
    mockRecommendations: [
      {
        title: "Acoustic Night: Nhạc Trịnh & Những Bản Tình Ca Xưa",
        category: "concert",
        location: "Góc Ban Công Cafe, Hà Nội",
        passPrice: 120000,
        suggestedTime: "Buổi tối (19:30 - 21:30)",
        description: "Đêm nhạc acoustic ấm cúng, phù hợp cho những ai muốn lắng lòng lại.",
        moodTags: ["Healing", "Chill", "Slow Vibe"],
      },
      {
        title: "Workshop Vẽ Tranh Thư Giãn Bằng Màu Nước",
        category: "workshop",
        location: "Art & Soul Studio, TP. HCM",
        passPrice: 250000,
        suggestedTime: "Buổi chiều (14:00 - 17:00)",
        description: "Tập trung nét cọ vẽ tranh và gạt bỏ hết những suy nghĩ u ám.",
        moodTags: ["Art Therapy", "Calm", "Solo Activity"],
      }
    ]
  },
  stressed: {
    label: "Stressed (Căng thẳng)",
    energy: "low",
    vibe: "Dopamine & Laughing",
    confidence: 0.85,
    keywords: ["stress", "căng thẳng", "áp lực", "lo lắng", "căng", "deadlines", "deadline", "mệt mỏi", "điên đầu", "đau đầu", "lo au", "cang thang", "ap luc", "met moi", "dau dau"],
    responseIntro: "Áp lực deadline hay cuộc sống đang làm bạn nghẹt thở đúng hông? Để GoTix dắt bạn đi xem hài kịch cười thả ga xả stress hoặc một workshop trải nghiệm xoa dịu tâm trí nghen! 🍃",
    categories: ["movie", "workshop", "sport"],
    mockRecommendations: [
      {
        title: "Đêm Kịch Hài Độc Thoại: Cười Xuyên Đêm",
        category: "event",
        location: "Comedy Club, Quận 1, TP. HCM",
        passPrice: 150000,
        suggestedTime: "Buổi tối (20:00 - 22:00)",
        description: "Liều thuốc dopamine cực mạnh giúp bạn cười quên hết áp lực.",
        moodTags: ["Funny", "High Dopamine", "Anti-stress"],
      },
      {
        title: "Workshop Làm Nến Thơm & Tinh Dầu Trị Liệu",
        category: "workshop",
        location: "The Scent Lab, Cầu Giấy, Hà Nội",
        passPrice: 300000,
        suggestedTime: "Chủ Nhật (09:00 - 12:00)",
        description: "Học cách pha chế nến thơm xoa dịu giác quan cực hiệu quả.",
        moodTags: ["Relaxing", "Therapy", "Healing"],
      }
    ]
  },
  burned_out: {
    label: "Burned Out (Kiệt quệ)",
    energy: "low",
    vibe: "Nature recharge & Cozy",
    confidence: 0.85,
    keywords: ["kiệt sức", "kiet suc", "kiệt quệ", "kiet que", "oải", "hết pin", "het pin", "hết năng lượng", "het nang luong", "burnout", "burned out", "mệt rã rời", "met ra roi"],
    responseIntro: "Hộp pin năng lượng của bạn đang nhấp nháy đỏ rùi kìa. Hãy cất tạm công việc đi và đi cắm trại nhẹ nhàng hoặc nghe nhạc chill để sạc lại năng lượng (recharge) thui! 🔋⚡",
    categories: ["concert", "workshop"],
    mockRecommendations: [
      {
        title: "Camping Chill Trốn Phố Cuối Tuần",
        category: "event",
        location: "Sóc Sơn, Hà Nội",
        passPrice: 450000,
        suggestedTime: "Cả ngày thứ Bảy",
        description: "Hòa mình cùng thiên nhiên rừng thông xanh mát để sạc lại năng lượng.",
        moodTags: ["Nature", "Offline", "Recharge"],
      },
      {
        title: "Trải Nghiệm Thiền Trà & Yoga Phục Hồi",
        category: "workshop",
        location: "Yên Vy Zen House, Bình Thạnh, TP. HCM",
        passPrice: 180000,
        suggestedTime: "Cuối tuần (08:00 - 10:00)",
        description: "Buổi sáng nhẹ nhàng lắng nghe cơ thể phục hồi từ bên trong.",
        moodTags: ["Zen", "Healthy", "Slow-living"],
      }
    ]
  },
  excited: {
    label: "Excited (Phấn khích)",
    energy: "high",
    vibe: "High-energy & Festival",
    confidence: 0.9,
    keywords: ["phấn khích", "hào hứng", "vui quá", "excited", "cháy", "quẩy", "xõa", "sung", "high", "nhiệt", "phan khich", "hao hung", "vui qua", "chay", "quay", "xoa", "nhiet"],
    responseIntro: "Tần số năng lượng cực cao nha! ⚡ Rất thích hợp để bạn ra ngoài quẩy hết mình tại các đêm nhạc sôi động, lễ hội âm nhạc hoặc liveshow hoành tráng nè!",
    categories: ["concert", "event"],
    mockRecommendations: [
      {
        title: "EDM Music Festival: Neon Jungle Night",
        category: "concert",
        location: "Phố Đi Bộ Nguyễn Huệ, TP. HCM",
        passPrice: 350000,
        suggestedTime: "Buổi tối (18:00 - 23:00)",
        description: "Lễ hội âm nhạc điện tử kết hợp ánh sáng hoành tráng nhất hè này.",
        moodTags: ["Dance", "Loud Music", "High Energy"],
      },
      {
        title: "Trận Chung Kết Bóng Đá Cup Quốc Gia",
        category: "sport",
        location: "Sân vận động Mỹ Đình, Hà Nội",
        passPrice: 200000,
        suggestedTime: "Buổi chiều (17:00 - 19:30)",
        description: "Không khí bùng nổ cùng hàng ngàn cổ động viên cuồng nhiệt.",
        moodTags: ["Sporty", "Excited", "Crowd"],
      }
    ]
  },
  romantic: {
    label: "Romantic (Lãng mạn)",
    energy: "medium",
    vibe: "Cozy date & Sweet moments",
    confidence: 0.9,
    keywords: ["hẹn hò", "hen ho", "lãng mạn", "lang man", "date", "dating", "người yêu", "nguoi yeu", "ny", "crush", "gấu", "gau", "sweet", "ngọt ngào", "ngot ngao"],
    responseIntro: "Mùi hương tình yêu ngập tràn rùi nhen! 🌹 Hãy dành thời gian tạo bất ngờ cho nửa kia bằng một buổi xem phim ghế đôi Sweetbox lãng mạn hoặc đêm nhạc tình ca ngọt ngào nhé!",
    categories: ["movie", "concert"],
    mockRecommendations: [
      {
        title: "Đêm Nhạc Acoustic: Love Songs & Sunset",
        category: "concert",
        location: "Rooftop Cafe, Quận 3, TP. HCM",
        passPrice: 180000,
        suggestedTime: "Hoàng hôn (17:30 - 19:30)",
        description: "Ngắm hoàng hôn lãng mạn cùng những bản tình ca ngọt ngào.",
        moodTags: ["Romantic", "Couples", "Sunset Vibe"],
      },
      {
        title: "Ghế Đôi Premium Sweetbox Xem Phim Chiếu Rạp",
        category: "movie",
        location: "Rạp CGV Vincom Đồng Khởi, TP. HCM",
        passPrice: 320000,
        suggestedTime: "Buổi tối (20:00 - 22:30)",
        description: "Ghế Sweetbox không gian riêng tư cực ấm cúng dành cho hai người.",
        moodTags: ["Movie Date", "Cozy", "Privacy"],
      }
    ]
  },
  lonely: {
    label: "Lonely (Cô đơn)",
    energy: "medium",
    vibe: "Warm connection & Social",
    confidence: 0.85,
    keywords: ["cô đơn", "co don", "một mình", "mot minh", "lonely", "trống vắng", "trong vang", "không có ai", "khong co ai", "lẻ loi", "le loi"],
    responseIntro: "Đôi lúc một mình cũng ổn, nhưng nếu muốn tìm thêm kết nối ấm áp và gặp gỡ những người bạn mới, những hoạt động workshop cộng đồng hoặc một buổi coffee meetup nhỏ sẽ cực hợp á! 🤝✨",
    categories: ["workshop", "event"],
    mockRecommendations: [
      {
        title: "Coffee Chat & Kết Bạn Mới Cho Hướng Nội",
        category: "event",
        location: "Warm House Cafe, Bình Thạnh, TP. HCM",
        passPrice: 50000,
        suggestedTime: "Sáng thứ Bảy (09:00 - 11:30)",
        description: "Buổi trò chuyện nhẹ nhàng kết nối những người bạn mới đồng điệu.",
        moodTags: ["Social", "New Friends", "Cozy"],
      },
      {
        title: "Workshop Làm Bánh Gối Cùng Nhau",
        category: "workshop",
        location: "Bếp Nhà Cuckoo, Tây Hồ, Hà Nội",
        passPrice: 280000,
        suggestedTime: "Chiều thứ Bảy (14:00 - 16:30)",
        description: "Vừa học làm bánh thủ công vừa trò chuyện giao lưu vui vẻ.",
        moodTags: ["Interactive", "Friendly", "Connection"],
      }
    ]
  },
  happy: {
    label: "Happy (Vui vẻ)",
    energy: "medium",
    vibe: "Joyful sharing & Creatives",
    confidence: 0.8,
    keywords: ["vui", "hạnh phúc", "happy", "yêu đời", "tuyệt vời", "tốt lành", "thuận lợi", "vui ve", "hanh phuc", "yeu doi", "tuyet voi", "tot lanh", "thuan loi"],
    responseIntro: "Một ngày ngập tràn niềm vui luôn nè! ☀️ Hãy tiếp tục lan tỏa niềm vui này bằng việc trải nghiệm những điều sáng tạo mới hoặc tham gia một liveshow ca nhạc nhẹ cùng bạn bè nhé!",
    categories: ["workshop", "concert", "movie"],
    mockRecommendations: [
      {
        title: "Workshop Làm Gốm Nghệ Thuật: Nặn Mơ Ước",
        category: "workshop",
        location: "Gốm Bát Tràng Studio, Hà Nội",
        passPrice: 350000,
        suggestedTime: "Buổi chiều (14:00 - 17:00)",
        description: "Thỏa sức sáng tạo tạo hình những món đồ gốm xinh xắn của riêng bạn.",
        moodTags: ["Creative", "Joy", "Hands-on"],
      }
    ]
  },
  bored: {
    label: "Bored (Nhàm chán)",
    energy: "medium",
    vibe: "Novelty & Active discovery",
    confidence: 0.8,
    keywords: ["chán", "chan", "bored", "tẻ nhạt", "te nhat", "rảnh quá", "ranh qua", "không biết làm gì", "khong biet lam gi", "vô vị", "vo vi"],
    responseIntro: "Mood đang bị chững lại xíu đúng hông? Để phá tan sự nhàm chán này, thử thách bản thân với một bộ môn workshop mới lạ hoặc đi triển lãm nghệ thuật đầy sắc màu nghen! 🎨🚀",
    categories: ["workshop", "event"],
    mockRecommendations: [
      {
        title: "Triển Lãm Nghệ Thuật Đa Giác Quan Van Gogh",
        category: "event",
        location: "GigaMall Thủ Đức, TP. HCM",
        passPrice: 220000,
        suggestedTime: "Cả ngày",
        description: "Không gian nghệ thuật ánh sáng cực mãn nhãn tha hồ chụp hình check-in.",
        moodTags: ["Art", "Immersive", "Photography"],
      },
      {
        title: "Workshop Thử Làm Xà Phòng Thảo Mộc Handmade",
        category: "workshop",
        location: "Green Lab, Đống Đa, Hà Nội",
        passPrice: 200000,
        suggestedTime: "Chiều Chủ Nhật (15:00 - 17:00)",
        description: "Tự tay làm ra bánh xà soap organic thơm lừng mang về làm quà.",
        moodTags: ["New Skill", "Fun", "DIY"],
      }
    ]
  },
  social: {
    label: "Social (Thèm kết nối)",
    energy: "high",
    vibe: "Active social & Networking",
    confidence: 0.85,
    keywords: ["giao lưu", "giao luu", "kết bạn", "ket ban", "social", "nhiều người", "nhieu nguoi", "tụ tập", "tu tap", "bè bạn", "be ban", "hội nhóm", "hoi nhom", "gặp gỡ", "gap go"],
    responseIntro: "Đang tràn đầy năng lượng hướng ngoại đúng hông? Rủ ngay cạ cứng hoặc đi kết nối cộng đồng tại các buổi trình diễn nhạc kịch, festival náo nhiệt hoặc các buổi gặp gỡ cộng đồng nha! 🥳🔥",
    categories: ["event", "concert"],
    mockRecommendations: [
      {
        title: "Trò Chơi Nhập Vai Kịch Tính (Board Game Night)",
        category: "event",
        location: "Boardgame Hub, Cầu Giấy, Hà Nội",
        passPrice: 70000,
        suggestedTime: "Buổi tối (18:30 - 22:00)",
        description: "Tham gia giải mật mã và nhập vai cùng hàng chục boardgamers vui vẻ.",
        moodTags: ["Group Fun", "Intellectual", "Socialization"],
      }
    ]
  },
  energetic: {
    label: "Energetic (Tràn năng lượng)",
    energy: "high",
    vibe: "Action & High vibe sports",
    confidence: 0.85,
    keywords: ["năng lượng", "nang luong", "khỏe", "khoe", "sung sức", "sung suc", "energetic", "hoạt động", "hoat dong", "vận động", "van dong", "thể thao", "the thao"],
    responseIntro: "Năng lượng đang đạt đỉnh! Rất thích hợp để đi xem các trận đấu thể thao kịch tính, trekking dã ngoại ngoài trời hoặc tham gia nhảy giải phóng hình thể nè! 🏃‍♂️⚡",
    categories: ["sport", "event"],
    mockRecommendations: [
      {
        title: "Giải Chạy Bán Marathon Thành Phố Sáng Sớm",
        category: "sport",
        location: "Hồ Hoàn Kiếm, Hà Nội",
        passPrice: 150000,
        suggestedTime: "Sáng sớm (05:00 - 08:30)",
        description: "Chinh phục cự ly chạy bộ quanh phố cổ rực rỡ nắng mai.",
        moodTags: ["Active", "Challenge", "Morning"],
      }
    ]
  },
  need_healing: {
    label: "Need Healing (Cần chữa lành)",
    energy: "low",
    vibe: "Peaceful calm & Self-care",
    confidence: 0.9,
    keywords: ["healing", "chữa lành", "chua lanh", "bình yên", "binh yen", "nhẹ nhàng", "nhe nhang", "recharge", "thư giãn", "thu gian", "chill", "trầm", "tram"],
    responseIntro: "Lắng nghe đứa trẻ bên trong bạn đang thì thầm cần vỗ về. Hãy cùng GoTix tìm một đêm nhạc Trịnh mộc mạc, một workshop làm gốm tĩnh lặng để tâm hồn dịu lại nha. 🕊️🌸",
    categories: ["concert", "workshop"],
    mockRecommendations: [
      {
        title: "Đêm Nhạc Acoustic Mộc: Gác Nhỏ Mơ Màng",
        category: "concert",
        location: "Mơ Màng Cafe, Quận 1, TP. HCM",
        passPrice: 150000,
        suggestedTime: "Tối thứ Bảy (20:00 - 22:00)",
        description: "Gác gỗ mộc mạc, hòa âm guitar và violon mộc mạc ru êm đêm hè.",
        moodTags: ["Healing", "Chill", "Cozy Space"],
      }
    ]
  },
  overthinking: {
    label: "Overthinking (Suy nghĩ nhiều)",
    energy: "low",
    vibe: "Mindful presence & Relax",
    confidence: 0.8,
    keywords: ["suy nghĩ nhiều", "suy nghi nhieu", "overthink", "overthinking", "lo âu", "lo au", "nghĩ ngợi", "nghi ngoi", "rối bời", "roi boi", "mất ngủ", "mat ngu"],
    responseIntro: "Đầu óc đang chạy quá tải với 1001 suy nghĩ hả bạn ơi? Hãy tắt bớt 'tab suy nghĩ' bằng cách hòa mình vào thế giới nghệ thuật tranh ảnh vẽ màu nước hoặc triển lãm tranh tĩnh lặng nghen! 🧠✨",
    categories: ["event", "workshop"],
    mockRecommendations: [
      {
        title: "Triển Lãm Tranh Sơn Dầu: Sắc Màu Nội Tâm",
        category: "event",
        location: "Bảo tàng Mỹ thuật, Hà Nội",
        passPrice: 50000,
        suggestedTime: "Buổi chiều (13:30 - 17:00)",
        description: "Không gian tranh sơn dầu yên lặng, mở mang góc nhìn nội tâm.",
        moodTags: ["Quiet", "Self-reflection", "Art"],
      }
    ]
  },
  relaxed: {
    label: "Relaxed (Thư thái)",
    energy: "low",
    vibe: "Gentle flow & Easy going",
    confidence: 0.85,
    keywords: ["relax", "thư thái", "thu thai", "thư giãn", "thu gian", "nhẹ nhõm", "nhe nhom", "thong thả", "thong tha", "chill chill"],
    responseIntro: "Tâm trạng thoải mái và thảnh thơi quá nè! 🍹 Thích hợp cho những hoạt động trôi chảy nhẹ nhàng như xem một bộ phim lãng mạn ngoài trời, đi bộ ngắm tranh hoặc nhâm nhi cafe trò chuyện.",
    categories: ["movie", "workshop"],
    mockRecommendations: [
      {
        title: "Đêm Chiếu Phim Indie Ngoài Trời Trên Sân Thượng",
        category: "movie",
        location: "Sky Cinema, Quận 2, TP. HCM",
        passPrice: 120000,
        suggestedTime: "Buổi tối (19:30 - 22:00)",
        description: "Nằm ghế lười xem phim indie chiếu dưới bầu trời sao mát rượi.",
        moodTags: ["Outdoor Cinema", "Breeze", "Relaxing"],
      }
    ]
  }
};

function analyzeEmotion(text) {
  const prepared = prepareText(text);
  
  let detectedEmotionKey = null;
  let maxMatchCount = 0;
  
  for (const [key, emo] of Object.entries(EMOTIONS)) {
    let matchCount = 0;
    for (const kw of emo.keywords) {
      if (prepared.includes(prepareKeyword(kw))) {
        matchCount++;
      }
    }
    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      detectedEmotionKey = key;
    }
  }
  
  if (detectedEmotionKey) {
    const emo = EMOTIONS[detectedEmotionKey];
    return {
      key: detectedEmotionKey,
      mainEmotion: emo.label,
      energyLevel: emo.energy.charAt(0).toUpperCase() + emo.energy.slice(1),
      recommendedVibe: emo.vibe,
      confidenceScore: `${Math.round(emo.confidence * 100)}%`,
    };
  }
  
  return null;
}

function isRecommendationRequest(text) {
  const prepared = prepareText(text);
  const patterns = [
    "hôm nay nên làm gì", "hom nay nen lam gi", "đi đâu", "di dau", "xem gì", "xem gi", 
    "chơi gì", "choi gi", "recommend", "tâm trạng", "mood", "gợi ý", "goi y", "hôm nay nên xem gì", "hom nay nen xem gi"
  ];
  return patterns.some(p => prepared.includes(prepareKeyword(p)));
}

function getMoodRecommendations(emotionKey, tickets) {
  const emo = EMOTIONS[emotionKey];
  if (!emo) return [];
  
  // Find real tickets from the database
  let realResults = tickets.filter(
    (t) => (t.status === "approved" || t.verifyStatus === "verified" || t.status === "available")
  );
  
  // Filter by category if matched
  realResults = realResults.filter(t => emo.categories.includes(t.category));
  
  // Format real tickets
  const formattedReal = realResults.map(t => {
    let matchReason = "";
    if (emotionKey === "sad") {
      matchReason = "Giai điệu mộc mạc và câu chữ sâu lắng sẽ xoa dịu nỗi buồn trong bạn.";
    } else if (emotionKey === "stressed") {
      matchReason = "Không gian tách biệt giúp bạn thoát khỏi âu lo và áp lực hiện tại.";
    } else if (emotionKey === "excited") {
      matchReason = "Bầu không khí bùng nổ, âm thanh cuồng nhiệt để bạn cháy hết mình.";
    } else if (emotionKey === "romantic") {
      matchReason = "Khung cảnh hoàn hảo để vun đắp kỷ niệm ngọt ngào cùng người thương.";
    } else if (emotionKey === "lonely") {
      matchReason = "Nơi lý tưởng để gặp gỡ những tâm hồn đồng điệu và sẻ chia.";
    } else {
      matchReason = "Trải nghiệm mới mẻ mang lại nguồn cảm hứng và năng lượng tích cực.";
    }
    
    return {
      title: t.title,
      category: t.category,
      location: t.location,
      passPrice: t.resalePrice ?? t.passPrice ?? 0,
      suggestedTime: t.eventTime ? `Buổi tối (${t.eventTime})` : "Tối thứ Bảy",
      matchReason,
      moodTags: [emo.vibe, "Vé thật"],
      id: t.id || t._id,
    };
  });
  
  // Format mock recommendations
  const formattedMock = emo.mockRecommendations.map(m => ({
    ...m,
    matchReason: m.matchReason || (
      emotionKey === "sad" ? "Không gian nhẹ nhàng giúp bạn giải bày tâm sự thầm kín." :
      emotionKey === "stressed" ? "Tiếng cười rộn rã xua tan đi mỏi mệt." :
      emotionKey === "burned_out" ? "Recharge năng lượng tích cực từ thiên nhiên." :
      "Tận hưởng vibe cực chill phù hợp với tâm trạng hiện tại."
    )
  }));
  
  const combined = [...formattedReal, ...formattedMock];
  
  return combined.slice(0, 4);
}

function generateResponse(userText, tickets) {
  const intent   = detectIntent(userText);
  const category = detectCategory(userText);
  const location = detectLocation(userText);

  // 1. Check emotion first to provide emotional intelligence
  const emotionAnalysis = analyzeEmotion(userText);
  if (emotionAnalysis) {
    const results = getMoodRecommendations(emotionAnalysis.key, tickets);
    const emo = EMOTIONS[emotionAnalysis.key];
    return {
      text: emo.responseIntro,
      tickets: results,
      emotionAnalysis: {
        mainEmotion: emotionAnalysis.mainEmotion,
        energyLevel: emotionAnalysis.energyLevel,
        recommendedVibe: emotionAnalysis.recommendedVibe,
        confidenceScore: emotionAnalysis.confidenceScore,
      }
    };
  }

  // 2. If user is asking "Hôm nay nên xem gì / làm gì" or asking about recommendation
  if (isRecommendationRequest(userText)) {
    return {
      text: "Hôm nay mood của bạn thế nào nè? Đang chill chill nhẹ nhàng cần chữa lành (recharge), đang cô đơn muốn kết nối bạn bè, hay đang căng thẳng cần nạp dopamine quẩy nhạc? Nói mình nghe để mình chọn trải nghiệm hợp nhất nha! 💖✨",
      tickets: [],
    };
  }

  // 3. Regular Greetings
  if (intent === "greeting") {
    return {
      text: "Yo! 👋 Mình là **GoTix AI** – người bạn đồng hành bắt vibe của bạn! 🎟️✨\n\nHôm nay mood của bạn thế nào nè? Đang chill chill thư thái, mệt mỏi cần chữa lành (recharge), hay đang tràn đầy dopamine muốn quẩy nhạc hội? Nói cho mình biết hoặc chọn thử các gợi ý bên dưới nha! 👇",
      tickets: [],
    };
  }

  // 4. Regular Help
  if (intent === "help") {
    return {
      text: "Cần hướng dẫn hả cạ cứng? Rất đơn giản nha:\n• Nói cho mình biết tâm trạng của bạn (ví dụ: *\"Hôm nay stress quá\"*, *\"Cuối tuần buồn cô đơn\"*).\n• Hoặc tìm vé trực tiếp theo cú pháp: *\"Vé xem phim CGV tại Hà Nội\"*.\n\nSau khi tìm được vé, bạn có thể **bấm thẳng vào hình** để xem chi tiết suất diễn và mua nha! 🚀",
      tickets: [],
    };
  }

  // 5. About
  if (intent === "about") {
    return {
      text: "**GoTix** chính là thiên đường mua bán vé thứ cấp uy tín hàng đầu Việt Nam! 🏆\n\n• Vé được **xác minh thủ công** nên an tâm 100% không sợ fake vé.\n• Giữ tiền trong ví đảm bảo cho tới khi giao dịch hoàn tất.\n• Giao lưu mua bán siêu tốc. Bạn muốn đi trốn ở đâu hay xem phim gì kể mình nghe nha!",
      tickets: [],
    };
  }

  // 6. Trust
  if (intent === "trust") {
    return {
      text: "GoTix bảo vệ quyền lợi của bạn cực kỳ nghiêm ngặt nha! 🔒\n\n• Mọi giao dịch qua ví đều được escrow bảo hộ an toàn.\n• Nói KHÔNG với lừa đảo – nếu vé bị lỗi, GoTix cam kết **hoàn tiền 100%**.\n• Cộng đồng người bán uy tín có đánh giá sao công khai.\n\nCứ tự tin săn vé trải nghiệm đi nha! 😎",
      tickets: [],
    };
  }

  // 7. Price
  if (intent === "price") {
    return {
      text: "Mức giá giao dịch trên GoTix vô cùng mềm và phong phú luôn:\n• 🎬 Vé phim: chỉ từ **60k - 300k**\n• 🎵 Vé concert: khoảng **500k - 5M**\n• ⚽ Thể thao: từ **100k - 2M**\n• 🚌 Vé xe khách: chỉ từ **80k - 500k**\n\nPhí giao dịch nền tảng siêu hạt dẻ chỉ **5%** nha. Bạn đang có ngân sách bao nhiêu thế?",
      tickets: [],
    };
  }

  // 8. Search intent or category/location detected
  if (intent === "search_ticket" || category || location) {
    const query = extractSearchQuery(userText);
    const results = searchTickets(tickets, category, location, query);

    if (results.length === 0) {
      const catLabel = category
        ? TICKET_CATEGORIES.find((c) => c.id === category)?.label
        : null;
      const searchTip = query ? ` với từ khóa "${query}"` : "";
      return {
        text: `Hiện tại mình chưa tìm thấy vé ${catLabel ? catLabel.toLowerCase() : ""} ${location ? "tại " + location : ""}${searchTip} nào phù hợp. 😔\n\nBạn thử:\n• Hỏi danh mục khác (concert, phim, xe, tàu)\n• Kiểm tra lại từ khóa tìm kiếm\n• Xem toàn bộ vé tại trang **Danh sách vé**`,
        tickets: [],
        cta: { text: "Xem tất cả vé →", path: "/tickets" },
      };
    }

    const catLabel = category
      ? TICKET_CATEGORIES.find((c) => c.id === category)?.label
      : "vé";
    const locText = location ? ` tại ${location}` : "";

    let responseText = `Tìm thấy **${results.length} ${catLabel.toLowerCase()}**${locText} cho bạn! 🎉\nBấm vào vé để xem chi tiết và đặt mua nhé 👇`;
    
    if (category === "movie") {
      responseText = `🎬 Mình tìm thấy **${results.length} vé xem phim**${locText} cực hot nè! Ghế đẹp, giá pass siêu hời. Bạn bấm vào hình vé bên dưới để xem chi tiết suất chiếu và đặt mua nhé! 👇`;
    } else if (category === "bus") {
      responseText = `🚌 Mình tìm thấy **${results.length} vé xe khách**${locText} phù hợp với bạn! Bấm vào để xem thông tin nhà xe, lộ trình và đặt vé nhé! 👇`;
    } else if (category === "train") {
      responseText = `🚂 Có **${results.length} vé tàu hoả**${locText} dành cho bạn! Bấm vào xem ga đi/đến, giờ khởi hành và đặt vé ngay nhé! 👇`;
    } else if (category === "concert") {
      responseText = `🎵 Bùng nổ âm nhạc! Có **${results.length} vé concert**${locText} đang bán nè. Bấm vào để xem line-up, sơ đồ ghế và mua vé nhé! 👇`;
    } else if (category === "sport") {
      responseText = `⚽ Cháy cùng đam mê! Có **${results.length} vé thể thao**${locText} cho bạn. Bấm vào để xem thông tin trận đấu, khán đài và mua vé nhé! 👇`;
    } else if (category === "event") {
      responseText = `🎪 Trải nghiệm thú vị! Tìm thấy **${results.length} vé sự kiện**${locText} cho bạn. Bấm vào để xem chi tiết và đặt vé ngay! 👇`;
    } else if (category === "workshop") {
      responseText = `🎓 Nâng cao kiến thức! Tìm thấy **${results.length} vé workshop**${locText} phù hợp. Bấm vào để xem nội dung lớp học và đăng ký nhé! 👇`;
    }

    let inferredVibe = "Trải nghiệm";
    if (category === "movie") inferredVibe = "Xem phim giải trí";
    else if (category === "concert") inferredVibe = "Quẩy nhạc sống";
    else if (category === "bus" || category === "train") inferredVibe = "Du lịch, dịch chuyển";
    else if (category === "workshop") inferredVibe = "Học hỏi & Chia sẻ";

    return {
      text: responseText,
      tickets: results,
      emotionAnalysis: {
        mainEmotion: "Active Search",
        energyLevel: "Medium",
        recommendedVibe: inferredVibe,
        confidenceScore: "100%",
      }
    };
  }

  // Fallback: try to search with keyword
  const keywordResults = searchTickets(tickets, null, null, userText);
  if (keywordResults.length > 0) {
    return {
      text: `Mình tìm thấy **${keywordResults.length} vé** có thể phù hợp với bạn! Bấm vào để xem chi tiết 👇`,
      tickets: keywordResults,
    };
  }

  return {
    text: "Mình chưa hiểu tâm trạng hoặc từ khóa của bạn lắm. 🤔\n\nThử kể cho mình nghe xem:\n• *\"Hôm nay buồn quá, muốn trốn đi đâu đó\"*\n• *\"Đi làm stress cực kỳ, cần xả giận\"*\n• *\"Cuối tuần này rủ crush đi hẹn hò ở đâu nhỉ?\"*",
    tickets: [],
  };
}



// ── Helper ────────────────────────────────────────────────────────────────────

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

const QUICK_SUGGESTIONS = [
  { label: "✨ Hôm nay xem gì?", text: "Hôm nay nên xem gì?" },
  { label: "🍿 Cần chữa lành", text: "Mình đang mệt mỏi và cần chữa lành tâm hồn" },
  { label: "🔥 Muốn quẩy nhiệt", text: "Đang sung sức, muốn đi quẩy đâu đó thật nhiệt" },
  { label: "🌹 Hẹn hò lãng mạn", text: "Kiếm buổi hẹn hò lãng mạn với người yêu" },
  { label: "🎭 Căng thẳng stress", text: "Đầu óc đang cực kỳ stress và áp lực" },
  { label: "🚌 Tìm vé xe khách", text: "Tìm vé xe khách" },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function AIChatBot() {
  const navigate = useNavigate();
  const { tickets } = useTickets();

  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [isTyping,  setIsTyping]  = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Greet on first open
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setTimeout(() => {
        setMessages([
          {
            id: Date.now(),
            role: "ai",
            text: "Yo! 👋 Mình là **GoTix AI** – người bạn đồng hành bắt vibe của bạn! 🎟️✨\n\nHôm nay mood của bạn thế nào nè? Đang chill chill thư thái, mệt mỏi cần chữa lành (recharge), hay đang tràn đầy dopamine muốn quẩy nhạc hội? Nói cho mình biết hoặc chọn gợi ý bên dưới nha! 👇",
            tickets: [],
            time: new Date(),
          },
        ]);
      }, 300);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasGreeted]);

  const handleSend = useCallback(
    async (text) => {
      const userText = (text || input).trim();
      if (!userText) return;

      const userMsg = {
        id: Date.now(),
        role: "user",
        text: userText,
        time: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      // Simulate AI thinking delay
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

      const response = generateResponse(userText, tickets);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          ...response,
          time: new Date(),
        },
      ]);
    },
    [input, tickets]
  );

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTicketClick(ticket) {
    if (ticket.id) {
      navigate(`/tickets/${ticket.id}`);
      setIsOpen(false);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "ai",
          text: `Bạn hứng thú với trải nghiệm **"${ticket.title}"** hả? Đây là một sự kiện đặc biệt đó! Bạn thử tìm kiếm hoặc chọn danh mục **"${categoryInfo[ticket.category]?.label || "Vé"}"** để săn vé nghen! ✨`,
          tickets: [],
          time: new Date(),
        }
      ]);
    }
  }

  function renderText(text) {
    // Convert **bold** and *italic* markdown
    return text
      .split("\n")
      .map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          if (part.startsWith("*") && part.endsWith("*"))
            return <em key={j}>{part.slice(1, -1)}</em>;
          return part;
        });
        return (
          <span key={i}>
            {parts}
            {i < text.split("\n").length - 1 && <br />}
          </span>
        );
      });
  }

  const categoryInfo = TICKET_CATEGORIES.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});

  return (
    <>
      {/* Floating Button */}
      <button
        id="ai-chatbot-toggle"
        className={`ai-chatbot-fab ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Mở trợ lý AI GoTix"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6"  y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9"  cy="10" r="1" fill="currentColor" />
            <circle cx="12" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
          </svg>
        )}
        {!isOpen && <span className="ai-fab-label">Tìm vé AI</span>}
        {!isOpen && <span className="ai-fab-ping" />}
      </button>

      {/* Chat Window */}
      <div className={`ai-chatbot-window ${isOpen ? "visible" : ""}`} id="ai-chatbot-window">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8"  r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span className="ai-status-dot" />
          </div>
          <div className="ai-chat-header-info">
            <span className="ai-chat-name">GoTix AI</span>
            <span className="ai-chat-status">Trực tuyến · Tìm vé thông minh</span>
          </div>
          <button className="ai-chat-close" onClick={() => setIsOpen(false)} aria-label="Đóng">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-msg-wrapper ${msg.role}`}>
              {msg.role === "ai" && (
                <div className="ai-msg-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
              )}
              <div className="ai-msg-content">
                {msg.emotionAnalysis && (
                  <div className="ai-emotion-dashboard">
                    <div className="ai-emotion-header">📊 PHÂN TÍCH TÂM TRẠNG (GOTIX AI)</div>
                    <div className="ai-emotion-grid">
                      <div className="ai-emotion-item">
                        <span className="ai-emotion-label">Tâm trạng chính:</span>
                        <span className="ai-emotion-value emotion">{msg.emotionAnalysis.mainEmotion}</span>
                      </div>
                      <div className="ai-emotion-item">
                        <span className="ai-emotion-label">Năng lượng:</span>
                        <span className={`ai-emotion-value energy ${msg.emotionAnalysis.energyLevel.toLowerCase()}`}>
                          {msg.emotionAnalysis.energyLevel}
                        </span>
                      </div>
                      <div className="ai-emotion-item">
                        <span className="ai-emotion-label">Vibe đề xuất:</span>
                        <span className="ai-emotion-value vibe">{msg.emotionAnalysis.recommendedVibe}</span>
                      </div>
                      <div className="ai-emotion-item">
                        <span className="ai-emotion-label">Độ tin cậy:</span>
                        <span className="ai-emotion-value confidence">{msg.emotionAnalysis.confidenceScore}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`ai-msg-bubble ${msg.role}`}>
                  {renderText(msg.text)}
                </div>

                {/* Ticket Cards */}
                {msg.tickets?.length > 0 && (
                  <div className="ai-ticket-results">
                    {msg.tickets.map((ticket) => {
                      const cat = categoryInfo[ticket.category];
                      const image = ticket.images?.[0] || ticket.ticketImage;
                      const price = ticket.resalePrice ?? ticket.passPrice ?? 0;
                      return (
                        <button
                          key={ticket.id || ticket.title}
                          className="ai-ticket-card"
                          onClick={() => handleTicketClick(ticket)}
                        >
                          <div className="ai-ticket-img">
                            {image ? (
                              <img src={image} alt={ticket.title} />
                            ) : (
                              <div className="ai-ticket-img-placeholder">
                                <span>{cat?.icon || "🎟️"}</span>
                              </div>
                            )}
                            <span className="ai-ticket-cat-badge">{cat?.icon} {cat?.label}</span>
                          </div>
                          <div className="ai-ticket-info">
                            <p className="ai-ticket-title">{ticket.title}</p>
                            <p className="ai-ticket-loc">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                              </svg>
                              {ticket.location}
                            </p>
                            {ticket.suggestedTime && (
                              <p className="ai-ticket-suggested-time">🕒 {ticket.suggestedTime}</p>
                            )}
                            {ticket.matchReason && (
                              <p className="ai-ticket-match-reason" style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0', lineHeight: '1.4' }}>
                                ✨ {ticket.matchReason}
                              </p>
                            )}
                            {ticket.moodTags?.length > 0 && (
                              <div className="ai-ticket-mood-tags">
                                {ticket.moodTags.map(tag => (
                                  <span key={tag} className="ai-mood-tag">{tag}</span>
                                ))}
                              </div>
                            )}
                            {!ticket.suggestedTime && <p className="ai-ticket-price">{formatPrice(price)}</p>}
                          </div>
                          <div className="ai-ticket-arrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      className="ai-view-all-btn"
                      onClick={() => {
                        navigate("/tickets");
                        setIsOpen(false);
                      }}
                    >
                      Xem tất cả vé →
                    </button>
                  </div>
                )}

                {/* CTA */}
                {msg.cta && (
                  <button
                    className="ai-cta-btn"
                    onClick={() => {
                      navigate(msg.cta.path);
                      setIsOpen(false);
                    }}
                  >
                    {msg.cta.text}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="ai-msg-wrapper ai">
              <div className="ai-msg-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <div className="ai-typing-bubble">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length <= 1 && (
          <div className="ai-suggestions">
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                className="ai-suggestion-chip"
                onClick={() => handleSend(s.text)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="ai-chat-input-wrap">
          <input
            ref={inputRef}
            id="ai-chatbot-input"
            type="text"
            className="ai-chat-input"
            placeholder="Hỏi AI tìm vé... (vd: tìm vé xe đi HCM)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
          />
          <button
            className="ai-chat-send"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            aria-label="Gửi"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && <div className="ai-chatbot-backdrop" onClick={() => setIsOpen(false)} />}
    </>
  );
}

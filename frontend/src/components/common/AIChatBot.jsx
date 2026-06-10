import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTickets } from "../../context/TicketContext";
import { TICKET_CATEGORIES } from "../../data/mockData";
import "./AIChatBot.css";

// ── AI Brain: knowledge base + intent engine ─────────────────────────────────

const CATEGORY_KEYWORDS = {
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
};

const LOCATION_KEYWORDS = {
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

function formatDateStr(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function detectDateFilter(text) {
  const prepared = prepareText(text);
  
  const getLocalDateStr = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayOfWeekDateStr = (targetDay) => {
    const today = new Date();
    const currentDay = today.getDay();
    let distance = targetDay - currentDay;
    if (distance < 0) {
      distance += 7;
    }
    return getLocalDateStr(distance);
  };

  // Today
  if ([" hôm nay ", " hom nay ", " nay "].some(kw => prepared.includes(kw))) {
    return {
      type: "today",
      label: "Hôm nay",
      dates: [getLocalDateStr(0)]
    };
  }

  // Tomorrow
  if ([" ngày mai ", " ngay mai ", " mai "].some(kw => prepared.includes(kw))) {
    return {
      type: "tomorrow",
      label: "Ngày mai",
      dates: [getLocalDateStr(1)]
    };
  }

  // The day after tomorrow
  if ([" ngày kia ", " ngay kia ", " kia "].some(kw => prepared.includes(kw))) {
    return {
      type: "day_after_tomorrow",
      label: "Ngày kia",
      dates: [getLocalDateStr(2)]
    };
  }

  // Weekend
  if ([" cuối tuần ", " cuoi tuan ", " cuối tuần này ", " cuoi tuan nay "].some(kw => prepared.includes(kw))) {
    const today = new Date();
    const currentDay = today.getDay();
    
    // Sat
    const satOffset = 6 - currentDay;
    const satStr = getLocalDateStr(satOffset);
    // Sun
    const sunOffset = currentDay === 0 ? 0 : 7 - currentDay;
    const sunStr = getLocalDateStr(sunOffset);

    return {
      type: "weekend",
      label: "Cuối tuần này",
      dates: [satStr, sunStr]
    };
  }

  // Days of the week
  const dayMappings = [
    { label: "thứ Hai", day: 1, keywords: [" thứ 2 ", " thu 2 ", " thứ hai ", " thu hai "] },
    { label: "thứ Ba", day: 2, keywords: [" thứ 3 ", " thu 3 ", " thứ ba ", " thu ba "] },
    { label: "thứ Tư", day: 3, keywords: [" thứ 4 ", " thu 4 ", " thứ tư ", " thu tu "] },
    { label: "thứ Năm", day: 4, keywords: [" thứ 5 ", " thu 5 ", " thứ năm ", " thu nam "] },
    { label: "thứ Sáu", day: 5, keywords: [" thứ 6 ", " thu 6 ", " thứ sáu ", " thu sau "] },
    { label: "thứ Bảy", day: 6, keywords: [" thứ 7 ", " thu 7 ", " thứ bảy ", " thu bay "] },
    { label: "chủ Nhật", day: 0, keywords: [" chủ nhật ", " chu nhat ", " cn "] }
  ];

  for (const mapping of dayMappings) {
    if (mapping.keywords.some(kw => prepared.includes(kw))) {
      return {
        type: "day_of_week",
        label: mapping.label,
        dates: [getDayOfWeekDateStr(mapping.day)]
      };
    }
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

  const dateKeywords = [
    "ngày mai", "ngay mai", "mai",
    "hôm nay", "hom nay", "nay",
    "ngày kia", "ngay kia", "kia",
    "cuối tuần", "cuoi tuan", "cuối tuần này", "cuoi tuan nay",
    "thứ hai", "thu hai", "thứ 2", "thu 2",
    "thứ ba", "thu ba", "thứ 3", "thu 3",
    "thứ tư", "thu tu", "thứ 4", "thu 4",
    "thứ năm", "thu nam", "thứ 5", "thu 5",
    "thứ sáu", "thu sau", "thứ 6", "thu 6",
    "thứ bảy", "thu bay", "thứ 7", "thu 7",
    "chủ nhật", "chu nhat", "cn"
  ];
  const sortedDateKeywords = [...dateKeywords].sort((a, b) => b.length - a.length);
  for (const kw of sortedDateKeywords) {
    const target = ` ${kw.trim()} `;
    while (q.includes(target)) {
      q = q.replace(target, " ");
    }
  }
  
  return q.replace(/\s+/g, ' ').trim();
}

function searchTickets(tickets, category, location, query, datesFilter) {
  let results = tickets.filter(
    (t) => t.status === "approved" || t.verifyStatus === "verified" || t.status === "available"
  );

  // Focus only on movie tickets in Đà Nẵng
  results = results.filter((t) => t.category === "movie");
  results = results.filter(
    (t) =>
      t.location?.toLowerCase().includes("đà nẵng") ||
      t.location?.toLowerCase().includes("da nang") ||
      t.city?.toLowerCase().includes("đà nẵng") ||
      t.city?.toLowerCase().includes("da nang")
  );

  // Filter by date if specified
  if (datesFilter && datesFilter.length > 0) {
    results = results.filter((t) => {
      // t.date format is YYYY-MM-DD
      return datesFilter.some((dStr) => t.date === dStr);
    });
  }

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
    responseIntro: "If hôm nay bạn hơi buồn và muốn trốn thế giới một xíu, rạp phim yên tĩnh sẽ giúp xoa dịu tâm hồn á. Chuyện gì rồi cũng sẽ qua thui nha! 🤍",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Suất Chiếu Đặc Biệt: Anime Dáng Hình Thanh Âm (Silent Voice)",
        category: "movie",
        location: "Lotte Cinema Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi chiều (14:30 - 16:30)",
        description: "Bộ phim anime cảm động và đầy ý nghĩa, giúp làm dịu đi những nỗi buồn thầm kín.",
        moodTags: ["Healing", "Emotional", "Anime"],
      },
      {
        title: "Đêm Chiếu Phim Indie: Chữa Lành Tâm Hồn",
        category: "movie",
        location: "Metiz Cinema Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi tối (19:30 - 21:30)",
        description: "Không gian rạp chiếu phim ngoài trời nhẹ nhàng, lắng đọng đầy cảm xúc.",
        moodTags: ["Quiet Vibe", "Indie Film", "Solo Activity"],
      }
    ]
  },
  stressed: {
    label: "Stressed (Căng thẳng)",
    energy: "low",
    vibe: "Dopamine & Laughing",
    confidence: 0.85,
    keywords: ["stress", "căng thẳng", "áp lực", "lo lắng", "căng", "deadlines", "deadline", "mệt mỏi", "điên đầu", "đau đầu", "lo au", "cang thang", "ap luc", "met moi", "dau dau"],
    responseIntro: "Áp lực deadline hay cuộc sống đang làm bạn nghẹt thở đúng hông? Để GoTix gợi ý cho bạn một suất chiếu phim hài cười thả ga xả stress nghen! 🍃",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Suất Chiếu Bom Tấn Hài Hước: Deadpool & Wolverine 2",
        category: "movie",
        location: "CGV Vincom Plaza Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi tối (20:00 - 22:00)",
        description: "Liều thuốc dopamine cực mạnh giúp bạn cười quên hết áp lực.",
        moodTags: ["Funny", "High Dopamine", "Anti-stress"],
      },
      {
        title: "Vé Phim Hài Gia Đình: Kung Fu Panda 5",
        category: "movie",
        location: "Lotte Cinema Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi chiều (15:00 - 17:00)",
        description: "Chú gấu trúc đáng yêu và những tràng cười sảng khoái cho ngày mệt mỏi.",
        moodTags: ["Comedy", "Relaxing", "Family Film"],
      }
    ]
  },
  burned_out: {
    label: "Burned Out (Kiệt quệ)",
    energy: "low",
    vibe: "Nature recharge & Cozy",
    confidence: 0.85,
    keywords: ["kiệt sức", "kiet suc", "kiệt quệ", "kiet que", "oải", "hết pin", "het pin", "hết năng lượng", "het nang luong", "burnout", "burned out", "mệt rã rời", "met ra roi"],
    responseIntro: "Hộp pin năng lượng của bạn đang nhấp nháy đỏ rùi kìa. Hãy cất tạm công việc đi và tự thưởng cho mình một bộ phim hoạt hình Ghibli ấm áp để sạc lại năng lượng nghen! 🔋⚡",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Suất Chiếu Kỷ Niệm Ghibli: My Neighbour Totoro",
        category: "movie",
        location: "BHD Star Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Cuối tuần (10:00 - 12:00)",
        description: "Quay về tuổi thơ bình yên cùng Totoro để nạp lại năng lượng.",
        moodTags: ["Nostalgia", "Cozy", "Recharge"],
      },
      {
        title: "Phim Hoạt Hình Chữa Lành: Soul (Pixar)",
        category: "movie",
        location: "CGV Vincom Plaza Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi tối (18:30 - 20:30)",
        description: "Câu chuyện sâu lắng giúp ta trân trọng những điều bình dị nhất trong cuộc sống.",
        moodTags: ["Pixar", "Inspirational", "Calm Vibe"],
      }
    ]
  },
  excited: {
    label: "Excited (Phấn khích)",
    energy: "high",
    vibe: "High-energy & Festival",
    confidence: 0.9,
    keywords: ["phấn khích", "hào hứng", "vui quá", "excited", "cháy", "quẩy", "xõa", "sung", "high", "nhiệt", "phan khich", "hao hung", "vui qua", "chay", "quay", "xoa", "nhiet"],
    responseIntro: "Tần số năng lượng cực cao nha! ⚡ Rất thích hợp để bạn ra rạp xem các bộ phim bom tấn hành động kịch tính với âm thanh cực khủng nè!",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Bom Tấn Hành Động Siêu Cấp: Avengers: Secret Wars",
        category: "movie",
        location: "CGV Vincom Plaza Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi tối (19:30 - 22:30)",
        description: "Trải nghiệm mãn nhãn trên màn hình IMAX khổng lồ, âm thanh bùng nổ.",
        moodTags: ["Action", "IMAX", "High Energy"],
      },
      {
        title: "Vé Phim Khoa Học Viễn Tưởng: Dune 3",
        category: "movie",
        location: "Lotte Cinema Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi tối (20:00 - 22:45)",
        description: "Hiệu ứng chuyển động ghế 4DX chân thực như đang ở giữa sa mạc Arrakis.",
        moodTags: ["Sci-Fi", "4DX Experience", "Thrilling"],
      }
    ]
  },
  romantic: {
    label: "Romantic (Lãng mạn)",
    energy: "medium",
    vibe: "Cozy date & Sweet moments",
    confidence: 0.9,
    keywords: ["hẹn hò", "hen ho", "lãng mạn", "lang man", "date", "dating", "người yêu", "nguoi yeu", "ny", "crush", "gấu", "gau", "sweet", "ngọt ngào", "ngot ngao"],
    responseIntro: "Mùi hương tình yêu ngập tràn rùi nhen! 🌹 Hãy dành thời gian tạo bất ngờ cho nửa kia bằng một buổi xem phim ghế đôi Sweetbox lãng mạn nhé!",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Vé Cặp Ghế Đôi Sweetbox Phim Tình Cảm: Past Lives 2",
        category: "movie",
        location: "CGV Vincom Plaza Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi tối (20:30 - 22:30)",
        description: "Ghế đôi riêng tư ấm cúng, hoàn hảo cho buổi hẹn hò lãng mạn ngọt ngào.",
        moodTags: ["Romantic", "Couples", "Sweetbox"],
      },
      {
        title: "Phim Lãng Mạn Kinh Điển: La La Land Re-release",
        category: "movie",
        location: "Galaxy Cinema Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Hoàng hôn (17:30 - 19:30)",
        description: "Hòa mình vào thế giới nhạc kịch mộng mơ và tình yêu đôi lứa.",
        moodTags: ["Musical", "Classic Love", "Date Night"],
      }
    ]
  },
  lonely: {
    label: "Lonely (Cô đơn)",
    energy: "medium",
    vibe: "Warm connection & Social",
    confidence: 0.85,
    keywords: ["cô đơn", "co don", "một mình", "mot minh", "lonely", "trống vắng", "trong vang", "không có ai", "khong co ai", "lẻ loi", "le loi"],
    responseIntro: "Đôi lúc một mình cũng ổn, nhưng nếu muốn tìm chút kết nối ấm áp, xem một bộ phim ý nghĩa tại rạp chiếu phim ấm cúng sẽ rất tuyệt đó! 🍿✨",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Suất Chiếu Giao Lưu CLB Điện Ảnh: Phim Cổ Điển",
        category: "movie",
        location: "BHD Star Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Sáng thứ Bảy (09:00 - 11:30)",
        description: "Xem phim và giao lưu trò chuyện cùng những mọt phim có cùng đam mê.",
        moodTags: ["Social Connection", "Classic Film", "Meetup"],
      },
      {
        title: "Phim hoạt hình Pixar ấm áp: Inside Out 3",
        category: "movie",
        location: "Lotte Cinema Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi chiều (14:00 - 16:00)",
        description: "Gặp lại các cảm xúc quen thuộc và cảm nhận sự thấu hiểu ấm áp từ bộ phim.",
        moodTags: ["Warmth", "Pixar", "Comforting"],
      }
    ]
  },
  happy: {
    label: "Happy (Vui vẻ)",
    energy: "medium",
    vibe: "Joyful sharing & Creatives",
    confidence: 0.8,
    keywords: ["vui", "hạnh phúc", "happy", "yêu đời", "tuyệt vời", "tốt lành", "thuận lợi", "vui ve", "hanh phuc", "yeu doi", "tuyet voi", "tot lanh", "thuan loi"],
    responseIntro: "Một ngày ngập tràn niềm vui luôn nè! ☀️ Hãy tiếp tục lan tỏa niềm vui này bằng việc xem một bộ phim ca nhạc vui tươi hoặc phim hài cùng bạn bè nhé!",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Phim Ca Nhạc Vui Tươi: Encanto 2",
        category: "movie",
        location: "BHD Star Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi chiều (15:30 - 17:30)",
        description: "Giai điệu rộn rã sắc màu phép thuật sẽ nhân đôi niềm vui của bạn.",
        moodTags: ["Joyful", "Musical", "Feel-good"],
      }
    ]
  },
  bored: {
    label: "Bored (Nhàm chán)",
    energy: "medium",
    vibe: "Novelty & Active discovery",
    confidence: 0.8,
    keywords: ["chán", "chan", "bored", "tẻ nhạt", "te nhat", "rảnh quá", "ranh qua", "không biết làm gì", "khong biet lam gi", "vô vị", "vo vi"],
    responseIntro: "Mood đang bị chững lại xíu đúng hông? Để phá tan sự nhàm chán này, thử thách bản thân với một bộ phim trinh thám hack não hoặc phim kinh dị giật gân nghen! 🎬🚀",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Phim Trinh Thám Ly Kỳ Kịch Tính: Knives Out 3",
        category: "movie",
        location: "Galaxy Cinema Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi tối (19:00 - 21:15)",
        description: "Những pha suy luận đỉnh cao bẻ lái cực gắt phá tan sự tẻ nhạt.",
        moodTags: ["Mystery", "Mind-bending", "Suspense"],
      },
      {
        title: "Suất Chiếu Đêm Phim Kinh Dị Siêu Nhiên",
        category: "movie",
        location: "BHD Star Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Suất khuya (22:30 - 00:30)",
        description: "Rùng rợn và hồi hộp tột cùng, đẩy dopamine lên mức cao nhất.",
        moodTags: ["Horror", "Late Night", "Adrenaline"],
      }
    ]
  },
  social: {
    label: "Social (Thèm kết nối)",
    energy: "high",
    vibe: "Active social & Networking",
    confidence: 0.85,
    keywords: ["giao lưu", "giao luu", "kết bạn", "ket ban", "social", "nhiều người", "nhieu nguoi", "tụ tập", "tu tap", "bè bạn", "be ban", "hội nhóm", "hoi nhom", "gặp gỡ", "gap go"],
    responseIntro: "Đang tràn đầy năng lượng hướng ngoại đúng hông? Rủ ngay cạ cứng đi xem phim suất chiếu đặc biệt của FC hoặc tham gia buổi chiếu thảo luận phim nhé! 🥳🔥",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Suất Chiếu Đặc Biệt Đồng Hành Cùng Fandom Marvel",
        category: "movie",
        location: "CGV Vincom Plaza Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Tối thứ Sáu (19:30 - 22:30)",
        description: "Hòa cùng không khí hò reo cuồng nhiệt từ hàng trăm fan Marvel thực thụ.",
        moodTags: ["Group Fun", "Fandom", "Loud & Hype"],
      }
    ]
  },
  energetic: {
    label: "Energetic (Tràn năng lượng)",
    energy: "high",
    vibe: "Action & High vibe sports",
    confidence: 0.85,
    keywords: ["năng lượng", "nang luong", "khỏe", "khoe", "sung sức", "sung suc", "energetic", "hoạt động", "hoat dong", "vận động", "van dong", "thể thao", "the thao"],
    responseIntro: "Năng lượng đang đạt đỉnh! Rất thích hợp để đi xem các bộ phim hành động bom tấn đua xe nghẹt thở hay phim phiêu lưu giả tưởng siêu hùng tráng nè! ⚡",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Phim Hành Động Nghẹt Thở 4DX: Fast & Furious 11",
        category: "movie",
        location: "CGV Vincom Plaza Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi tối (20:15 - 22:30)",
        description: "Các pha rượt đuổi tốc độ nghẹt thở kết hợp ghế rung lắc 4DX cực bốc.",
        moodTags: ["Action", "Speed", "4DX Action"],
      }
    ]
  },
  need_healing: {
    label: "Need Healing (Cần chữa lành)",
    energy: "low",
    vibe: "Peaceful calm & Self-care",
    confidence: 0.9,
    keywords: ["healing", "chữa lành", "chua lanh", "bình yên", "binh yen", "nhẹ nhàng", "nhe nhang", "recharge", "thư giãn", "thu gian", "chill", "trầm", "tram"],
    responseIntro: "Lắng nghe đứa trẻ bên trong bạn đang thì thầm cần vỗ về. Hãy cùng GoTix tìm một rạp phim yên tĩnh, xem một tác phẩm nhẹ nhàng mộc mạc nhé. 🕊️🌸",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Suất Chiếu Phim Chữa Lành: My Neighbour Totoro",
        category: "movie",
        location: "Lotte Cinema Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Sáng Chủ Nhật (09:30 - 11:30)",
        description: "Không gian trong trẻo, nhẹ nhàng mang lại cảm giác bình yên sâu lắng.",
        moodTags: ["Quiet space", "Healing Film", "Comfort"],
      }
    ]
  },
  overthinking: {
    label: "Overthinking (Suy nghĩ nhiều)",
    energy: "low",
    vibe: "Mindful presence & Relax",
    confidence: 0.8,
    keywords: ["suy nghĩ nhiều", "suy nghi nhieu", "overthink", "overthinking", "lo âu", "lo au", "nghĩ ngợi", "nghi ngoi", "rối bời", "roi boi", "mất ngủ", "mat ngu"],
    responseIntro: "Đầu óc đang chạy quá tải với 1001 suy nghĩ hả bạn ơi? Hãy tắt bớt 'tab suy nghĩ' bằng cách tập trung vào một bộ phim giả tưởng cân não cực kỳ lôi cuốn nghen! 🧠✨",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Phim Tâm Lý Chiều Sâu Hack Não: Inception Re-release",
        category: "movie",
        location: "BHD Star Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi chiều (14:00 - 16:30)",
        description: "Kịch bản xuất sắc giúp bạn hoàn toàn cuốn vào cốt truyện và quên đi âu lo.",
        moodTags: ["Mind-blown", "Intense focus", "Sci-Fi"],
      }
    ]
  },
  relaxed: {
    label: "Relaxed (Thư thái)",
    energy: "low",
    vibe: "Gentle flow & Easy going",
    confidence: 0.85,
    keywords: ["relax", "thư thái", "thu thai", "thư giãn", "thu gian", "nhẹ nhõm", "nhe nhom", "thong thả", "thong tha", "chill chill"],
    responseIntro: "Tâm trạng thoải mái và thảnh thơi quá nè! 🍹 Thích hợp cho những hoạt động nhẹ nhàng như xem một bộ phim lãng mạn nhẹ nhàng trên ghế lười ngoài trời.",
    categories: ["movie"],
    mockRecommendations: [
      {
        title: "Suất Chiếu Phim Indie Ngoài Trời Trên Sân Thượng",
        category: "movie",
        location: "Metiz Cinema Đà Nẵng",
        passPrice: 60000,
        suggestedTime: "Buổi tối (19:30 - 22:00)",
        description: "Nằm ghế lười, tận hưởng làn gió mát và bộ phim nhẹ nhàng.",
        moodTags: ["Outdoor Cinema", "Breeze", "Chill Out"],
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
  
  // Filter to movie category and Đà Nẵng location
  realResults = realResults.filter(
    (t) =>
      t.category === "movie" &&
      (t.location?.toLowerCase().includes("đà nẵng") ||
        t.location?.toLowerCase().includes("da nang") ||
        t.city?.toLowerCase().includes("đà nẵng") ||
        t.city?.toLowerCase().includes("da nang"))
  );
  
  // Format real tickets
  const formattedReal = realResults.map(t => {
    let matchReason = "";
    if (emotionKey === "sad") {
      matchReason = "Những thước phim mộc mạc và câu chữ sâu lắng sẽ xoa dịu nỗi buồn trong bạn.";
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
      text: "Hôm nay mood của bạn thế nào nè? Đang chill chill nhẹ nhàng cần chữa lành (recharge), đang cô đơn muốn xem phim kết nối bạn bè, hay đang căng thẳng cần phim hài xả stress? Nói mình nghe để mình chọn trải nghiệm hợp nhất nha! 💖✨",
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
      text: "Hôm nay mood của bạn thế nào nè? Đang chill chill nhẹ nhàng cần chữa lành (recharge), đang cô đơn muốn xem phim kết nối bạn bè, hay đang căng thẳng cần phim hài xả stress? Nói mình nghe để mình chọn trải nghiệm hợp nhất nha! 💖✨",
      tickets: [],
    };
  }

  // 3. Regular Greetings
  if (intent === "greeting") {
    return {
      text: "Yo! 👋 Mình là **GoTix AI** – người bạn đồng hành bắt vibe xem phim của bạn! 🎬✨\n\nHôm nay mood của bạn thế nào nè? Đang chill chill thư thái, mệt mỏi cần chữa lành (recharge), hay đang tràn đầy dopamine muốn xem phim bom tấn? Nói cho mình biết hoặc chọn thử các gợi ý bên dưới nha! 👇",
      tickets: [],
    };
  }

  // 4. Regular Help
  if (intent === "help") {
    return {
      text: "Cần hướng dẫn hả cạ cứng? Rất đơn giản nha:\n• Nói cho mình biết tâm trạng của bạn (ví dụ: *\"Hôm nay stress quá\"*, *\"Cuối tuần muốn xem phim lãng mạn\"*).\n• Hoặc tìm vé phim trực tiếp theo cú pháp: *\"Vé xem phim CGV tại Đà Nẵng\"*.\n\nSau khi tìm được vé, bạn có thể **bấm thẳng vào hình** để xem chi tiết suất diễn và mua nha! 🚀",
      tickets: [],
    };
  }

  // 5. About
  if (intent === "about") {
    return {
      text: "**GoTix** chính là thiên đường mua bán vé xem phim thứ cấp uy tín hàng đầu tại Đà Nẵng! 🏆\n\n• Vé được **xác minh thủ công** nên an tâm 100% không sợ fake vé.\n• Giữ tiền trong ví đảm bảo cho tới khi giao dịch hoàn tất.\n• Giao lưu mua bán siêu tốc. Bạn muốn xem phim gì hay đi rạp nào kể mình nghe nha!",
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
      text: "Mức giá giao dịch vé xem phim trên GoTix vô cùng mềm, chỉ loanh quanh **60k** tùy thuộc vào loại ghế (Standard/VIP/Sweetbox) và rạp chiếu tại Đà Nẵng (CGV, Lotte, BHD...).\n\nPhí giao dịch nền tảng siêu hạt dẻ chỉ **5%** nha. Bạn đang có ngân sách khoảng bao nhiêu thế?",
      tickets: [],
    };
  }

  // 8. Search intent, category, location, or date filter detected
  const dateFilter = detectDateFilter(userText);
  if (intent === "search_ticket" || category || location || dateFilter) {
    const query = extractSearchQuery(userText);
    const dateList = dateFilter ? dateFilter.dates : null;
    const results = searchTickets(tickets, category, location, query, dateList);

    if (results.length === 0) {
      const searchTip = query ? ` với từ khóa "${query}"` : "";
      const dateText = dateFilter ? ` chiếu vào ${dateFilter.label.toLowerCase()} (${dateFilter.dates.map(formatDateStr).join(" & ")})` : "";
      const locText = location ? ` tại ${location}` : "";
      return {
        text: `Hiện tại mình chưa tìm thấy vé xem phim nào${dateText}${locText}${searchTip} phù hợp ở Đà Nẵng. 😔\n\nLưu ý: GoTix hiện tại chỉ tập trung hỗ trợ vé xem phim tại khu vực Đà Nẵng.\n\nBạn thử:\n• Thay đổi ngày chiếu hoặc rạp phim khác tại Đà Nẵng\n• Đổi từ khóa tìm kiếm phim khác\n• Xem toàn bộ vé tại trang **Danh sách vé**`,
        tickets: [],
        cta: { text: "Xem tất cả vé →", path: "/tickets" },
      };
    }

    const dateText = dateFilter ? ` chiếu vào ${dateFilter.label.toLowerCase()} (${dateFilter.dates.map(formatDateStr).join(" & ")})` : "";
    const locText = location ? ` tại ${location}` : "";
    const responseText = `🎬 Mình tìm thấy **${results.length} vé xem phim**${dateText}${locText} cực hot tại Đà Nẵng nè! Ghế đẹp, giá pass siêu hời. Bạn bấm vào hình vé bên dưới để xem chi tiết suất chiếu và đặt mua nhé! 👇`;

    return {
      text: responseText,
      tickets: results,
      emotionAnalysis: {
        mainEmotion: dateFilter ? `Lọc theo ${dateFilter.label}` : "Active Search",
        energyLevel: "Medium",
        recommendedVibe: "Xem phim giải trí",
        confidenceScore: "100%",
      }
    };
  }

  // Fallback: try to search with keyword
  const keywordResults = searchTickets(tickets, null, null, userText);
  if (keywordResults.length > 0) {
    return {
      text: `Mình tìm thấy **${keywordResults.length} vé xem phim** có thể phù hợp với bạn! Bấm vào để xem chi tiết 👇`,
      tickets: keywordResults,
    };
  }

  return {
    text: "Mình chưa hiểu tâm trạng hoặc từ khóa của bạn lắm. 🤔\n\nThử kể cho mình nghe xem:\n• *\"Hôm nay buồn quá, muốn xem phim gì chữa lành\"*\n• *\"Mới đi làm về stress cực kỳ, có phim hài nào vui vui không\"*\n• *\"Cuối tuần này rủ crush đi xem phim gì lãng mạn ở CGV Đà Nẵng nhỉ?\"*",
    tickets: [],
  };
}



// ── Helper ────────────────────────────────────────────────────────────────────

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

const QUICK_SUGGESTIONS = [
  { label: "📅 Phim hôm nay?", text: "Hôm nay có phim gì tại Đà Nẵng không?" },
  { label: "🗓️ Phim cuối tuần", text: "Cuối tuần này có phim gì hot không?" },
  { label: "🍿 Cần chữa lành", text: "Mình đang mệt mỏi và cần chữa lành tâm hồn bằng phim ảnh" },
  { label: "🔥 Phim hành động", text: "Tìm phim hành động kịch tính" },
  { label: "🌹 Hẹn hò lãng mạn", text: "Kiếm buổi hẹn hò lãng mạn với người yêu" },
  { label: "🎬 Vé phim CGV hot", text: "Tìm vé CGV Đà Nẵng" },
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
            text: "Yo! 👋 Mình là **GoTix AI** – người bạn đồng hành bắt vibe xem phim của bạn! 🎬✨\n\nHôm nay mood của bạn thế nào nè? Đang chill chill thư thái, mệt mỏi cần chữa lành (recharge), hay đang tràn đầy dopamine muốn xem phim bom tấn? Nói cho mình biết hoặc chọn gợi ý bên dưới nha! 👇",
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
            placeholder="Hỏi AI tìm vé... (vd: tìm vé CGV Đà Nẵng)"
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

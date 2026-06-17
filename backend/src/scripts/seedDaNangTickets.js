const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gotix';

// Import Models
const User = require('../models/User');
const Ticket = require('../models/Ticket');

// Helper functions for dates
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const seedDaNangTickets = async () => {
  try {
    console.log('📡 Đang kết nối tới MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Kết nối thành công tới database.`);

    // 1. Lấy danh sách sellers
    let sellers = await User.find({ role: 'user' });
    
    if (sellers.length === 0) {
      console.log('👤 Không tìm thấy người dùng mẫu, tiến hành tạo mới...');
      const mockSellers = [
        {
          name: 'Trần Thị Mai',
          email: 'seller2@gotix.com',
          password: 'password123',
          phone: '0923456789',
          role: 'user',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          bio: 'Sinh viên hay đặt vé xem phim ở Đà Nẵng nhưng lịch học hay thay đổi. Giá pass rẻ hơn giá gốc.',
          location: 'Đà Nẵng',
          rating: 4.6,
          reviewCount: 14,
          verified: true,
          isActive: true,
          trustScore: 93
        },
        {
          name: 'Lê Hoàng Minh',
          email: 'seller3@gotix.com',
          password: 'password123',
          phone: '0934567890',
          role: 'user',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          bio: 'Thích xem phim cuối tuần tại Đà Nẵng. Hay nhượng lại vé khi bận đột xuất.',
          location: 'Đà Nẵng',
          rating: 4.7,
          reviewCount: 19,
          verified: true,
          isActive: true,
          trustScore: 96,
          isPro: true,
          proBadge: 'GoTix Pro'
        },
        {
          name: 'Phạm Quỳnh Anh',
          email: 'seller4@gotix.com',
          password: 'password123',
          phone: '0945678901',
          role: 'user',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
          bio: 'Mình thường đi xem phim cuối tuần tại Đà Nẵng, đôi khi bận cần pass lại vé.',
          location: 'Đà Nẵng',
          rating: 4.5,
          reviewCount: 10,
          verified: true,
          isActive: true,
          trustScore: 90
        },
        {
          name: 'Võ Thanh Tùng',
          email: 'seller5@gotix.com',
          password: 'password123',
          phone: '0956789012',
          role: 'user',
          avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
          bio: 'Làm về ngành giải trí tại Đà Nẵng, có nhiều vé xem phim giá tốt. Pass nhanh.',
          location: 'Đà Nẵng',
          rating: 4.3,
          reviewCount: 6,
          verified: false,
          isActive: true,
          trustScore: 78
        }
      ];

      for (const s of mockSellers) {
        const user = await User.create(s);
        sellers.push(user);
      }
      console.log(`✅ Đã tạo thành công ${sellers.length} người bán mẫu.`);
    } else {
      console.log(`👤 Tìm thấy ${sellers.length} người dùng hiện có trong database.`);
    }

    // Định nghĩa cụm rạp Đà Nẵng (Bổ sung BHD Star Đà Nẵng)
    const cinemas = [
      { name: 'CGV Vincom Plaza Đà Nẵng', address: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Sơn Trà, Đà Nẵng' },
      { name: 'CGV Vĩnh Trung Plaza', address: 'Vĩnh Trung Plaza, 255-257 Hùng Vương, Thanh Khê, Đà Nẵng' },
      { name: 'Lotte Cinema Đà Nẵng', address: 'Lotte Mart Đà Nẵng, 6 Nai Nam, Hải Châu, Đà Nẵng' },
      { name: 'BHD Star Đà Nẵng', address: 'Viện Bảo Tàng Đà Nẵng, 24 Trần Phú, Đà Nẵng' },
      { name: 'Metiz Cinema Đà Nẵng', address: 'Helio Center, Đường 2/9, Hải Châu, Đà Nẵng' },
      { name: 'Galaxy Cinema Đà Nẵng', address: 'Coop Mart Đà Nẵng, 478 Điện Biên Phủ, Thanh Khê, Đà Nẵng' },
      { name: 'Starlight Nguyễn Kim Đà Nẵng', address: 'Tầng 3-4 Siêu thị Nguyễn Kim, 46 Điện Biên Phủ, Thanh Khê, Đà Nẵng' },
      { name: 'Rio Cinema Đà Nẵng', address: '403 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng' }
    ];

    // Mẫu hình ảnh
    const imageMap = {
      action: '/private_uploads/ticket_avengers.png',
      horror: '/private_uploads/ticket_interstellar.png',
      anime: '/private_uploads/mock_ticket.png',
      drama: '/private_uploads/ticket_latmat.png',
      comedy: '/private_uploads/ticket_deadpool.png',
      scifi: '/private_uploads/ticket_avengers.png',
      general: '/private_uploads/mock_ticket.png'
    };

    // Danh sách phim đang chiếu (Now Showing)
    const nowShowingMovies = [
      { title: 'Ma Xó', type: 'horror' },
      { title: 'Lầu Chú Hoả', type: 'horror' },
      { title: 'Bầy Xác Sống', type: 'horror' },
      { title: 'Cô Bé Ponyo', type: 'anime' },
      { title: 'Doraemon Movie 45: Nobita Và Lâu Đài Dưới Đáy Biển', type: 'anime' },
      { title: 'Cơn Thịnh Nộ', type: 'action' },
      { title: 'Tên Cậu Là Gì?', type: 'anime' },
      { title: 'Yên Chi Khâu', type: 'drama' },
      { title: 'Siêu Quậy Marsupilami', type: 'comedy' },
      { title: 'Ốc Mượn Hồn', type: 'horror' },
      { title: 'Ngôi Đền Kỳ Quái 5', type: 'horror' },
      { title: 'Tây Du Ký Đại Náo', type: 'action' },
      { title: 'Mortal Kombat 2: Cuộc Chiến Sinh Tử', type: 'action' },
      { title: 'Michael', type: 'drama' },
      { title: 'Dưới Bóng Điện Hạ', type: 'drama' },
      { title: 'Thoát Khỏi Tận Thế', type: 'scifi' },
      { title: 'Backrooms: Thực Thể Quỷ Quyệt', type: 'horror' },
      { title: 'Obsession: Ám Ảnh', type: 'horror' },
      { title: 'Trạng Quỳnh Nhí: Truyền Thuyết Kim Ngưu', type: 'anime' }
    ];

    // Danh sách phim sắp chiếu (Upcoming)
    const upcomingMovies = [
      { title: 'Câu Chuyện Đồ Chơi 5 (Toy Story 5)', type: 'anime' },
      { title: 'Mesdames Thanh Sắc', type: 'drama' },
      { title: 'Deadpool & Wolverine 2', type: 'comedy' },
      { title: 'Avengers: Secret Wars', type: 'scifi' },
      { title: 'Inside Out 3', type: 'anime' },
      { title: 'Avatar 3: Fire and Ash', type: 'scifi' },
      { title: 'Lật Mặt 8: Vòng Tay Nhau', type: 'drama' },
      { title: 'Gintama The Movie 2026: Yoshiwara Trong Biển Lửa', type: 'anime' }
    ];

    const seatOptions = ['E05', 'E06', 'F08', 'F09', 'G10', 'G11', 'H12', 'H13', 'J04', 'J05', 'K15', 'SB01', 'SB02'];
    const timeOptions = ['10:15', '13:00', '14:30', '16:45', '18:15', '19:30', '20:45', '21:15', '22:30', '23:15'];
    
    const descriptions = [
      'Do thay đổi lịch làm việc đột xuất vào cuối tuần nên mình cần nhượng lại cặp vé xem phim này. Vé ngồi hàng đẹp rạp trung tâm rạp, xem rất thoải mái.',
      'Mua vé cho gia đình đi xem nhưng bé nhà mình đột ngột bị ốm nên không đi được. Pass lại giá hạt dẻ cho bạn nào cần.',
      'Mua nhầm suất chiếu do đặt nhầm ngày trên app. Cần nhượng lại gấp chịu lỗ 30% để gỡ gạc lại ít tiền. Cảm ơn admin duyệt bài.',
      'Được bạn tặng vé xem phim nhưng mình đã xem phim này rồi nên muốn nhượng lại. Vé chính hãng, giao dịch nhanh qua QR code.',
      'Lịch học thêm đột xuất bị trùng giờ chiếu phim. Mình muốn nhượng lại vé cho ai muốn đi xem tối nay. Có thể giao dịch trực tiếp nếu tin tưởng.',
      'Nhóm mình bận đột xuất nên thừa ra mấy vé. Pass lại giá rẻ hơn vé mua tại quầy. Rạp âm thanh cực đỉnh, phòng chiếu rộng rãi.',
      'Vé xem phim VIP, ghế Sweetbox đôi siêu rộng rãi và riêng tư dành cho các cặp đôi. Cần pass lại do có việc gia đình đột xuất.'
    ];

    const titles = [
      '[Pass nhanh] Vé xem phim {movie} tại {cinema}',
      '[Pass gấp] Cặp vé xem {movie} - {cinema} ghế đôi',
      '[Nhượng lại] {qty} vé {movie} rạp {cinema} giá rẻ',
      '[Thừa vé] Nhượng lại vé {movie} - {cinema}',
      'Vé phim {movie} suất {time} rạp {cinema} cần pass gấp',
      'Pass vé {movie} {cinema} giá cực sinh viên'
    ];

    const ticketsData = [];

    // Tạo tổng cộng 38 vé
    for (let i = 0; i < 38; i++) {
      // Xác định phim đang chiếu hay sắp chiếu
      const isUpcoming = i >= 30; // 30 phim đang chiếu, 8 phim sắp chiếu
      const movie = isUpcoming 
        ? upcomingMovies[i - 30] 
        : nowShowingMovies[i % nowShowingMovies.length];

      // Chọn ngẫu nhiên rạp
      const cinema = cinemas[i % cinemas.length];

      // Chọn ngẫu nhiên seller
      const seller = sellers[i % sellers.length];

      // Xác định số lượng vé
      const qty = (i % 3) + 1; // 1, 2, hoặc 3 vé

      // Ghế ngồi ngẫu nhiên
      const seats = [];
      const startSeatIdx = i % seatOptions.length;
      for (let j = 0; j < qty; j++) {
        seats.push(seatOptions[(startSeatIdx + j) % seatOptions.length]);
      }

      // Thời gian chiếu ngẫu nhiên
      const showTime = timeOptions[i % timeOptions.length];

      // Ngày chiếu ngẫu nhiên
      // Nếu là phim đang chiếu: từ ngày mai đến 6 ngày sau
      // Nếu là phim sắp chiếu: từ 15 ngày đến 25 ngày sau
      const dateOffset = isUpcoming ? 15 + (i % 10) : 1 + (i % 7);
      const showDate = daysFromNow(dateOffset);

      // Giá cả (Giá nhượng lại từ 50k - 100k, giá gốc cao hơn)
      const resalePrice = 50000 + (i % 6) * 10000; // 50k, 60k, 70k, 80k, 90k, 100k
      const originalPrice = resalePrice + 20000 + (i % 3) * 10000; // Original price always higher (70k - 140k)

      // Chọn mẫu tiêu đề và mô tả
      const titleTpl = titles[i % titles.length];
      const title = titleTpl
        .replace('{movie}', movie.title)
        .replace('{cinema}', cinema.name.split(' Đà Nẵng')[0])
        .replace('{qty}', qty)
        .replace('{time}', showTime);

      const description = descriptions[i % descriptions.length].replace('{cinema}', cinema.name);

      // Trạng thái: 30 vé available, 5 vé sold, 3 vé reserved
      let status = 'available';
      if (i >= 30 && i < 35) {
        status = 'sold';
      } else if (i >= 35) {
        status = 'reserved';
      }

      // Xác thực: 35 vé verified, 2 approved, 1 pending
      let verifyStatus = 'verified';
      if (i === 36) {
        verifyStatus = 'approved';
      } else if (i === 37) {
        verifyStatus = 'pending';
      }

      // Loại hình ảnh dựa trên thể loại phim
      const ticketImage = imageMap[movie.type] || imageMap.general;

      ticketsData.push({
        title,
        category: 'movie',
        description,
        location: `${cinema.name}, Đà Nẵng`,
        city: 'Đà Nẵng',
        eventDate: showDate,
        eventTime: showTime,
        originalPrice,
        resalePrice,
        quantity: qty,
        status,
        verifyStatus,
        adminNote: verifyStatus === 'verified' ? 'Vé hợp lệ' : '',
        ownerId: seller._id,
        ticketImage,
        qrImage: '/private_uploads/mock_qr.png',
        details: {
          movieTitle: movie.title,
          cinemaName: cinema.name,
          cinemaAddress: cinema.address,
          room: `Rạp ${1 + (i % 5)}` + (i % 7 === 0 ? ' (IMAX)' : i % 8 === 0 ? ' (Dolby Atmos)' : ''),
          seats,
          showDate,
          showTime
        },
        views: 10 + (i * 12) % 350
      });
    }

    console.log(`🧹 Đang xóa các vé cũ của khu vực Đà Nẵng để tránh trùng lặp dữ liệu...`);
    const deleteResult = await Ticket.deleteMany({ city: 'Đà Nẵng' });
    console.log(`🗑️ Đã xóa ${deleteResult.deletedCount} vé cũ tại Đà Nẵng.`);

    console.log(`💾 Đang nạp 38 vé mới vào database...`);
    const createdTickets = await Ticket.insertMany(ticketsData);
    console.log(`🎉 Seeding thành công! Đã tạo ${createdTickets.length} vé xem phim tại khu vực Đà Nẵng.`);

    // Ngắt kết nối mongoose
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối database.');
  } catch (err) {
    console.error('❌ Lỗi Seeding:', err.message);
    process.exit(1);
  }
};

seedDaNangTickets();

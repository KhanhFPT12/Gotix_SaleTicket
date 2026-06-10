const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gotix';

// Import Models
const User           = require('../models/User');
const Ticket         = require('../models/Ticket');
const Transaction    = require('../models/Transaction');
const Review         = require('../models/Review');
const Chat           = require('../models/Chat');
const Notification   = require('../models/Notification');
const Favorite       = require('../models/Favorite');
const TopUp          = require('../models/TopUp');
const Withdrawal     = require('../models/Withdrawal');
const ProSubscription= require('../models/ProSubscription');
const Report         = require('../models/Report');
const AuditLog       = require('../models/AuditLog');

// ── Helper ─────────────────────────────────────────────────────────────────
const daysAgo  = (n) => new Date(Date.now() - n * 86400000);
const daysLater= (n) => new Date(Date.now() + n * 86400000);

const seedData = async () => {
  try {
    console.log('📡 Kết nối MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Đã kết nối: ${MONGO_URI}\n`);

    // ── 1. Clear All ──────────────────────────────────────────────────────
    console.log('🗑️  Xóa dữ liệu cũ...');
    await Promise.all([
      User.deleteMany({}), Ticket.deleteMany({}), Transaction.deleteMany({}),
      Review.deleteMany({}), Chat.deleteMany({}), Notification.deleteMany({}),
      Favorite.deleteMany({}), TopUp.deleteMany({}), Withdrawal.deleteMany({}),
      ProSubscription.deleteMany({}), Report.deleteMany({}), AuditLog.deleteMany({}),
    ]);
    console.log('✅ Đã xóa xong.\n');

    // ── 2. Users ──────────────────────────────────────────────────────────
    console.log('👤 Seeding Users...');

    const admin = await User.create({
      name: 'Admin GoTix', email: 'admin@gotix.com', password: 'adminpassword123',
      phone: '0901234567', role: 'admin', verified: true, isActive: true, trustScore: 100,
    });

    // Sellers chuyên vé phim
    const seller1 = await User.create({
      name: 'Nguyễn Văn Hùng',    email: 'seller1@gotix.com', password: 'password123',
      phone: '0912345678',         role: 'user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      bio: 'Mình hay mua vé CGV xem cùng bạn bè, lịch hay thay đổi nên thường nhượng lại. Vé chính hãng 100%.',
      location: 'Quận 7, TP. Hồ Chí Minh',
      rating: 4.9, reviewCount: 28, verified: true, isActive: true,
      availableBalance: 1200000, pendingBalance: 360000, totalRevenue: 8640000,
      trustScore: 99, isPro: true, proPlan: '3_months',
      proStartDate: daysAgo(20), proEndDate: daysLater(70), proBadge: 'GoTix Pro Seller',
    });

    const seller2 = await User.create({
      name: 'Trần Thị Mai',        email: 'seller2@gotix.com', password: 'password123',
      phone: '0923456789',         role: 'user',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      bio: 'Sinh viên hay đặt vé xem phim nhưng lịch học hay thay đổi. Giá pass rẻ hơn giá gốc.',
      location: 'Đà Nẵng',
      rating: 4.6, reviewCount: 14, verified: true, isActive: true,
      availableBalance: 540000, pendingBalance: 180000, totalRevenue: 2160000,
      trustScore: 93, isPro: false,
    });

    const seller3 = await User.create({
      name: 'Lê Hoàng Minh',       email: 'seller3@gotix.com', password: 'password123',
      phone: '0934567890',         role: 'user',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      bio: 'Thích xem phim cuối tuần. Hay nhượng lại vé khi bận đột xuất.',
      location: 'Đà Nẵng',
      rating: 4.7, reviewCount: 19, verified: true, isActive: true,
      availableBalance: 860000, pendingBalance: 240000, totalRevenue: 5760000,
      trustScore: 96, isPro: true, proPlan: '1_month',
      proStartDate: daysAgo(10), proEndDate: daysLater(20), proBadge: 'GoTix Pro',
    });

    const seller4 = await User.create({
      name: 'Phạm Quỳnh Anh',      email: 'seller4@gotix.com', password: 'password123',
      phone: '0945678901',         role: 'user',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      bio: 'Mình thường đi xem phim cuối tuần tại Đà Nẵng, đôi khi bận cần pass lại vé.',
      location: 'Đà Nẵng',
      rating: 4.5, reviewCount: 10, verified: true, isActive: true,
      availableBalance: 320000, pendingBalance: 0, totalRevenue: 1680000,
      trustScore: 90, isPro: false,
    });

    const seller5 = await User.create({
      name: 'Võ Thanh Tùng',       email: 'seller5@gotix.com', password: 'password123',
      phone: '0956789012',         role: 'user',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
      bio: 'Làm về ngành giải trí, có nhiều vé xem phim giá tốt. Pass nhanh.',
      location: 'Đà Nẵng',
      rating: 4.3, reviewCount: 6, verified: false, isActive: true,
      availableBalance: 150000, pendingBalance: 200000, totalRevenue: 1200000,
      trustScore: 78, isPro: false,
    });

    // Buyers
    const buyer1 = await User.create({
      name: 'Hoàng Anh Tuấn',  email: 'buyer1@gotix.com', password: 'password123',
      phone: '0967890123',      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      bio: 'Mê phim hành động và sci-fi. Thường xem phim cuối tuần tại CGV.',
      location: 'Bình Thạnh, TP. Hồ Chí Minh',
      verified: true, isActive: true, availableBalance: 800000, trustScore: 95,
    });

    const buyer2 = await User.create({
      name: 'Vũ Phương Thảo',  email: 'buyer2@gotix.com', password: 'password123',
      phone: '0978901234',      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
      bio: 'Mê phim Hàn và romance. Hay xem phim ở Lotte Cinema.',
      location: 'Đống Đa, Hà Nội',
      verified: true, isActive: true, availableBalance: 600000, trustScore: 92,
    });

    const buyer3 = await User.create({
      name: 'Đỗ Minh Khoa',    email: 'buyer3@gotix.com', password: 'password123',
      phone: '0989012345',      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      bio: 'Ghiền phim Marvel và DC. Luôn xem suất chiếu đặc biệt.',
      location: 'Thanh Xuân, Hà Nội',
      verified: true, isActive: true, availableBalance: 1500000, trustScore: 97,
    });

    const buyer4 = await User.create({
      name: 'Nguyễn Hà Linh',  email: 'buyer4@gotix.com', password: 'password123',
      phone: '0990123456',      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      bio: 'Mê phim hoạt hình Pixar và Disney. Hay rủ gia đình đi xem cuối tuần.',
      location: 'Quận 1, TP. Hồ Chí Minh',
      verified: true, isActive: true, availableBalance: 2000000, trustScore: 98,
    });

    console.log(`✅ Đã tạo ${await User.countDocuments()} Users.\n`);

    // ── 3. Movie Tickets ───────────────────────────────────────────────────
    console.log('🎬 Seeding Movie Tickets...');

    const movieImages = {
      latmat8:   'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
      avengers:  'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=600&q=80',
      kungfu:    'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80',
      insideout: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      mimosa:    'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=600&q=80',
      deadpool:  'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=600&q=80',
      interstellar:'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
      horror:    'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=600&q=80',
      anime:     'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
      romance:   'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
      cartoon:   'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=600&q=80',
      cinema:    'https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=600&q=80',
    };

    const otherImages = {
      concert1: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
      concert2: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80',
      concert3: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=600&q=80',
      event1:   'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
      event2:   'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80',
      sport1:   'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
      sport2:   'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
      workshop1:'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80',
      workshop2:'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80',
      bus1:     'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
      bus2:     'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
      train1:   'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80',
    };

    function qr(code) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GOTIX-${code}-${Date.now()}`;
    }

    const tickets = [];

    // ── ĐÀ NẴNG ────────────────────────────────────────────────────────────

    // T01 - Lật Mặt 8 tại CGV Vincom Plaza Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Lật Mặt 8: Vòng Tay Nhau - CGV Vincom Plaza Đà Nẵng',
      category: 'movie',
      description: 'Nhượng lại 2 vé xem phim Lật Mặt 8 suất chiếu cuối tuần do bận việc gia đình đột xuất. Hàng ghế G giữa rạp, tầm nhìn đẹp nhất. Phòng chiếu IMAX âm thanh sống động. Vé điện tử gửi qua Zalo/email ngay sau khi thanh toán.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-07',
      eventTime: '19:30',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 2,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller2._id,
      ticketImage: movieImages.latmat8,
      qrImage: qr('MV001'),
      details: {
        movieTitle: 'Lật Mặt 8: Vòng Tay Nhau',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp 2 (IMAX)',
        seats: ['G07', 'G08'],
        showDate: '2026-06-07',
        showTime: '19:30',
      },
      views: 142,
    }));

    // T02 - Avengers Secret Wars tại CGV Vincom Plaza Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Avengers: Secret Wars - CGV Vincom Plaza Đà Nẵng (Ghế Đôi Sweetbox)',
      category: 'movie',
      description: 'Pass lại cặp vé ghế đôi Sweetbox xem Avengers: Secret Wars suất chiều tối thứ Bảy. Ghế đôi siêu thoải mái, có gác chân và chỗ kê ly nước. Vé điện tử gửi ngay qua Zalo sau khi xác nhận giao dịch trên GoTix.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-14',
      eventTime: '20:00',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 1,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller1._id,
      ticketImage: movieImages.avengers,
      qrImage: qr('MV002'),
      details: {
        movieTitle: 'Avengers: Secret Wars',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp 1 (4DX)',
        seats: ['SB01'],
        showDate: '2026-06-14',
        showTime: '20:00',
      },
      views: 315,
    }));

    // T03 - Kung Fu Panda 5 tại Lotte Cinema Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Kung Fu Panda 5 - Lotte Cinema Đà Nẵng (Hàng D - Trung Tâm)',
      category: 'movie',
      description: 'Cần nhượng lại 3 vé xem Kung Fu Panda 5 suất 14h chiều Chủ Nhật. Lý do: con bé bị ốm không đi được. Hàng D trung tâm phòng chiếu, tầm nhìn đẹp. Phù hợp gia đình có trẻ nhỏ.',
      location: 'Lotte Cinema Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-08',
      eventTime: '14:00',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 3,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller3._id,
      ticketImage: movieImages.kungfu,
      qrImage: qr('MV003'),
      details: {
        movieTitle: 'Kung Fu Panda 5',
        cinemaName: 'Lotte Cinema Đà Nẵng',
        cinemaAddress: 'Lotte Mart Đà Nẵng, 6 Nai Nam, Đà Nẵng',
        room: 'Rạp 4',
        seats: ['D05', 'D06', 'D07'],
        showDate: '2026-06-08',
        showTime: '14:00',
      },
      views: 89,
    }));

    // T04 - Inside Out 3 tại BHD Star Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Inside Out 3 - BHD Star Đà Nẵng (Phòng Premium)',
      category: 'movie',
      description: 'Nhượng lại 2 vé xem Inside Out 3 phòng Premium tại BHD Star Đà Nẵng. Suất buổi tối 19:15, ghế hạng E rất rộng và thoải mái. Không gian xem phim sang trọng. Vé chính hãng còn nguyên.',
      location: 'BHD Star Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-10',
      eventTime: '19:15',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 2,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller1._id,
      ticketImage: movieImages.insideout,
      qrImage: qr('MV004'),
      details: {
        movieTitle: 'Inside Out 3',
        cinemaName: 'BHD Star Đà Nẵng',
        cinemaAddress: 'Viện Bảo Tàng Đà Nẵng, 24 Trần Phú, Đà Nẵng',
        room: 'Phòng Premium 2',
        seats: ['E10', 'E11'],
        showDate: '2026-06-10',
        showTime: '19:15',
      },
      views: 198,
    }));

    // T05 - Mimosa (phim Việt) tại Galaxy Cinema Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Phim Mimosa (Phim Việt) - Galaxy Cinema Đà Nẵng',
      category: 'movie',
      description: 'Pass lại 1 vé xem phim Mimosa – bộ phim tình cảm Việt Nam đang hot. Hàng F giữa rạp, view rất đẹp. Galaxy Cinema Đà Nẵng là rạp nhỏ ấm cúng, âm thanh rất hay. Bán rẻ hơn vì bận không đi được.',
      location: 'Galaxy Cinema Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-06',
      eventTime: '21:00',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 1,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller3._id,
      ticketImage: movieImages.mimosa,
      qrImage: qr('MV005'),
      details: {
        movieTitle: 'Mimosa',
        cinemaName: 'Galaxy Cinema Đà Nẵng',
        cinemaAddress: 'Galaxy Cinema Đà Nẵng, 259 Trần Phú, Đà Nẵng',
        room: 'Rạp 3',
        seats: ['F08'],
        showDate: '2026-06-06',
        showTime: '21:00',
      },
      views: 67,
    }));

    // T06 - Deadpool & Wolverine 2 tại CGV Vincom Plaza Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Deadpool & Wolverine 2 - CGV Vincom Plaza Đà Nẵng (4DX Premium)',
      category: 'movie',
      description: 'Nhượng lại 1 vé xem Deadpool & Wolverine 2 ở rạp 4DX CGV Vincom Plaza Đà Nẵng. Ghế hàng G, 4DX rung lắc cực đã. Vé mình mua nhầm ngày, bận không đổi được.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-21',
      eventTime: '15:45',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 1,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller1._id,
      ticketImage: movieImages.deadpool,
      qrImage: qr('MV006'),
      details: {
        movieTitle: 'Deadpool & Wolverine 2',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp 5 (4DX Premium)',
        seats: ['G09'],
        showDate: '2026-06-21',
        showTime: '15:45',
      },
      views: 241,
    }));

    // T07 - Interstellar 10th Anniversary tại CGV Vincom Plaza Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Interstellar 10th Anniversary Re-release - CGV Vincom Plaza Đà Nẵng',
      category: 'movie',
      description: 'Cần pass lại 2 vé xem Interstellar phiên bản kỷ niệm 10 năm trên màn hình IMAX khổng lồ. Đây là cơ hội hiếm để xem lại kiệt tác của Christopher Nolan. Hàng I, vị trí lý tưởng.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-15',
      eventTime: '18:30',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 2,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller2._id,
      ticketImage: movieImages.interstellar,
      qrImage: qr('MV007'),
      details: {
        movieTitle: 'Interstellar (10th Anniversary IMAX)',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp IMAX',
        seats: ['I08', 'I09'],
        showDate: '2026-06-15',
        showTime: '18:30',
      },
      views: 203,
    }));

    // T08 - Horror Movie - Ác Quỷ Ma Sơ 3 tại Lotte Cinema Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Ác Quỷ Ma Sơ 3: The Conjuring - Lotte Cinema Đà Nẵng (Suất Khuya)',
      category: 'movie',
      description: 'Pass lại 2 vé xem Ác Quỷ Ma Sơ 3 suất khuya 23:00 thứ Sáu – xem phim kinh dị lúc khuya mới đã! Rạp Lotte Đà Nẵng có âm thanh Dolby Atmos cực hay. Ghế cuối phòng, cảm giác ma quỷ sẽ càng rõ hơn 😈',
      location: 'Lotte Cinema Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-13',
      eventTime: '23:00',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 2,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller4._id,
      ticketImage: movieImages.horror,
      qrImage: qr('MV008'),
      details: {
        movieTitle: 'Ác Quỷ Ma Sơ 3: The Conjuring',
        cinemaName: 'Lotte Cinema Đà Nẵng',
        cinemaAddress: 'Lotte Mart Đà Nẵng, 6 Nai Nam, Đà Nẵng',
        room: 'Rạp 7 (Dolby Atmos)',
        seats: ['K12', 'K13'],
        showDate: '2026-06-13',
        showTime: '23:00',
      },
      views: 176,
    }));

    // T09 - Anime: Demon Slayer Infinity Castle tại CGV Vincom Plaza Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Demon Slayer: Infinity Castle Movie - CGV Vincom Plaza Đà Nẵng',
      category: 'movie',
      description: 'Bán lại 1 vé xem Demon Slayer: Infinity Castle Movie – bộ phim anime được mong chờ nhất 2026! Suất chiếu sáng sớm thứ Bảy, còn đủ để đi ăn sáng trước. Hàng H trung tâm, tầm nhìn hoàn hảo. Vé điện tử gửi qua QR code ngay.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-28',
      eventTime: '09:30',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 1,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller4._id,
      ticketImage: movieImages.anime,
      qrImage: qr('MV009'),
      details: {
        movieTitle: 'Demon Slayer: Infinity Castle Movie',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp 3',
        seats: ['H07'],
        showDate: '2026-06-28',
        showTime: '09:30',
      },
      views: 389,
    }));

    // T10 - Phim lãng mạn Hàn - Past Lives 2 tại Lotte Cinema Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Past Lives 2 (Phim Hàn) - Lotte Cinema Đà Nẵng',
      category: 'movie',
      description: 'Nhượng lại 2 vé xem Past Lives 2 – phim tình cảm Hàn Quốc đang gây sốt. Suất chiều tối Chủ Nhật lãng mạn, ghế đôi hàng F. Rạp sạch đẹp, điều hoà mát. Mình mua vé hẹn hò nhưng bị hủy nên cần pass gấp.',
      location: 'Lotte Cinema Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-22',
      eventTime: '20:30',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 2,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller2._id,
      ticketImage: movieImages.romance,
      qrImage: qr('MV010'),
      details: {
        movieTitle: 'Past Lives 2',
        cinemaName: 'Lotte Cinema Đà Nẵng',
        cinemaAddress: 'Lotte Mart Đà Nẵng, 6 Nai Nam, Đà Nẵng',
        room: 'Rạp 5',
        seats: ['F09', 'F10'],
        showDate: '2026-06-22',
        showTime: '20:30',
      },
      views: 124,
    }));

    // ── ĐÀ NẴNG ───────────────────────────────────────────────────────────

    // T11 - Encanto 2 tại CGV Vincom Plaza Đà Nẵng (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Encanto 2 (Disney) - CGV Vincom Plaza Đà Nẵng',
      category: 'movie',
      description: 'Nhượng lại 2 vé xem Encanto 2 của Disney tại CGV Đà Nẵng. Phim hoạt hình cho cả gia đình. Suất chiếu 15:00 chiều Thứ Bảy rất thuận tiện. Ghế hàng D giữa rạp. Mình ở Đà Nẵng nên có thể gặp trực tiếp để giao vé nếu bạn cần.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-06-20',
      eventTime: '15:00',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 2,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller5._id,
      ticketImage: movieImages.cartoon,
      qrImage: qr('MV011'),
      details: {
        movieTitle: 'Encanto 2',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp 2',
        seats: ['D06', 'D07'],
        showDate: '2026-06-20',
        showTime: '15:00',
      },
      views: 53,
    }));

    // T12 - Phim chiếu rạp đặc biệt - Suất Chiếu Đêm Khuya (available, verified)
    tickets.push(await Ticket.create({
      title: 'Vé Đặc Biệt: The Dark Knight (Re-release 4K) - CGV Vincom Plaza Đà Nẵng',
      category: 'movie',
      description: 'Cực hiếm! CGV tổ chức chiếu lại The Dark Knight bản 4K nhân dịp kỷ niệm 18 năm ra mắt. Suất đêm 22:30 thứ Sáu, không khí rạp đêm rất đặc biệt. Ghế VIP hàng J, siêu thoải mái. Vé rất hót, pass nhanh giá gốc luôn.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-07-04',
      eventTime: '22:30',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 1,
      status: 'available',
      verifyStatus: 'verified',
      ownerId: seller3._id,
      ticketImage: movieImages.cinema,
      qrImage: qr('MV012'),
      details: {
        movieTitle: 'The Dark Knight (4K Re-release)',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp VIP 1',
        seats: ['J08'],
        showDate: '2026-07-04',
        showTime: '22:30',
      },
      views: 456,
    }));

    // ── Tickets đã bán (SOLD) ───────────────────────────────────────────────

    // T13 - Đã bán - Spider-Man tại CGV Đà Nẵng
    const ticketSold1 = await Ticket.create({
      title: 'Vé Spider-Man: Brand New Day - CGV Vincom Plaza Đà Nẵng',
      category: 'movie',
      description: 'Đã bán - vé Spider-Man Brand New Day suất VIP tối thứ Sáu.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-05-23',
      eventTime: '19:45',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 2,
      status: 'sold',
      verifyStatus: 'verified',
      ownerId: seller1._id,
      ticketImage: movieImages.avengers,
      qrImage: qr('MV013'),
      details: {
        movieTitle: 'Spider-Man: Brand New Day',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp 2 (ScreenX)',
        seats: ['H05', 'H06'],
        showDate: '2026-05-23',
        showTime: '19:45',
      },
      views: 312,
    });
    tickets.push(ticketSold1);

    // T14 - Đã bán - Lật Mặt 7 tại CGV Đà Nẵng
    const ticketSold2 = await Ticket.create({
      title: 'Vé Lật Mặt 7: Một Điều Ước - CGV Vincom Plaza Đà Nẵng (Đã Bán)',
      category: 'movie',
      description: 'Đã bán.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-05-18',
      eventTime: '14:00',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 1,
      status: 'sold',
      verifyStatus: 'verified',
      ownerId: seller2._id,
      ticketImage: movieImages.latmat8,
      qrImage: qr('MV014'),
      details: {
        movieTitle: 'Lật Mặt 7: Một Điều Ước',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp 1',
        seats: ['F10'],
        showDate: '2026-05-18',
        showTime: '14:00',
      },
      views: 185,
    });
    tickets.push(ticketSold2);

    // T15 - Đang chờ duyệt
    tickets.push(await Ticket.create({
      title: 'Vé Avatar 3: Fire and Ash - CGV Vincom Plaza Đà Nẵng (Đang Chờ Duyệt)',
      category: 'movie',
      description: 'Nhượng lại 2 vé Avatar 3: Fire and Ash 3D suất chiều tối. Vé chính hãng mua tại quầy CGV, chưa qua sử dụng. Đang chờ admin kiểm duyệt.',
      location: 'CGV Vincom Plaza Đà Nẵng, Đà Nẵng',
      city: 'Đà Nẵng',
      eventDate: '2026-07-12',
      eventTime: '17:00',
      originalPrice: 80000,
      resalePrice: 60000,
      quantity: 2,
      status: 'available',
      verifyStatus: 'pending',
      ownerId: seller5._id,
      ticketImage: movieImages.interstellar,
      qrImage: qr('MV015'),
      details: {
        movieTitle: 'Avatar 3: Fire and Ash',
        cinemaName: 'CGV Vincom Plaza Đà Nẵng',
        cinemaAddress: 'Vincom Plaza Đà Nẵng, 910A Ngô Quyền, Đà Nẵng',
        room: 'Rạp 1 (3D)',
        seats: ['H10', 'H11'],
        showDate: '2026-07-12',
        showTime: '17:00',
      },
      views: 28,
    }));


    console.log(`🎬 Đã tạo ${tickets.length} Movie Tickets.`);



    console.log(`🎟️  Tổng số Tickets trong database: ${await Ticket.countDocuments()}\n`);

    // ── 4. Transactions ─────────────────────────────────────────────────
    console.log('💰 Seeding Transactions...');

    const tx1 = await Transaction.create({
      buyerId: buyer3._id, sellerId: seller1._id, ticketId: ticketSold1._id,
      quantity: 2, totalPrice: 90000, paymentMethod: 'momo',
      paymentStatus: 'paid', transactionStatus: 'completed',
      platformFee: 4500, sellerAmount: 85500, sellerCredited: true,
      createdAt: daysAgo(5),
    });

    const tx2 = await Transaction.create({
      buyerId: buyer2._id, sellerId: seller2._id, ticketId: ticketSold2._id,
      quantity: 1, totalPrice: 40000, paymentMethod: 'bank_transfer',
      paymentStatus: 'paid', transactionStatus: 'completed',
      platformFee: 2000, sellerAmount: 38000, sellerCredited: true,
      createdAt: daysAgo(9),
    });

    const tx3 = await Transaction.create({
      buyerId: buyer1._id, sellerId: seller2._id, ticketId: tickets[0]._id, // T01
      quantity: 2, totalPrice: 90000, paymentMethod: 'momo',
      paymentStatus: 'pending', transactionStatus: 'pending',
      platformFee: 4500, sellerAmount: 85500, sellerCredited: false,
      createdAt: new Date(),
    });

    const tx4 = await Transaction.create({
      buyerId: buyer4._id, sellerId: seller1._id, ticketId: tickets[1]._id, // T02
      quantity: 1, totalPrice: 50000, paymentMethod: 'vnpay',
      paymentStatus: 'paid', transactionStatus: 'completed',
      platformFee: 2500, sellerAmount: 47500, sellerCredited: true,
      createdAt: daysAgo(3),
    });

    const tx5 = await Transaction.create({
      buyerId: buyer2._id, sellerId: seller4._id, ticketId: tickets[8]._id, // T09 Demon Slayer
      quantity: 1, totalPrice: 45000, paymentMethod: 'momo',
      paymentStatus: 'pending', transactionStatus: 'pending',
      platformFee: 2250, sellerAmount: 42750, sellerCredited: false,
      createdAt: new Date(),
    });

    const tx6 = await Transaction.create({
      buyerId: buyer3._id, sellerId: seller3._id, ticketId: tickets[5]._id, // T06 Deadpool 4DX
      quantity: 1, totalPrice: 50000, paymentMethod: 'bank_transfer',
      paymentStatus: 'paid', transactionStatus: 'disputed',
      platformFee: 2500, sellerAmount: 47500, sellerCredited: false,
      createdAt: daysAgo(1),
    });

    console.log(`✅ Đã tạo ${await Transaction.countDocuments()} Transactions.\n`);

    // ── 5. Reviews ──────────────────────────────────────────────────────
    console.log('⭐ Seeding Reviews...');

    await Review.create({
      buyerId: buyer3._id, sellerId: seller1._id,
      ticketId: ticketSold1._id, transactionId: tx1._id,
      rating: 5,
      comment: 'Vé Spider-Man ScreenX xịn lắm luôn! Seller Hùng giao vé nhanh qua Zalo, quét mã cổng CGV ok hết. 5 sao không đắn đo!',
    });

    await Review.create({
      buyerId: buyer2._id, sellerId: seller2._id,
      ticketId: ticketSold2._id, transactionId: tx2._id,
      rating: 5,
      comment: 'Mua vé Lật Mặt 7 của Mai, người bán rất nhiệt tình, vé điện tử gửi nhanh qua email. Vé hợp lệ, vào rạp suôn sẻ. Rất uy tín!',
    });

    await Review.create({
      buyerId: buyer4._id, sellerId: seller1._id,
      ticketId: tickets[1]._id, transactionId: tx4._id,
      rating: 4,
      comment: 'Vé Sweetbox Avengers đẹp lắm, ghế siêu thoải mái. Seller hơi chậm reply nhưng cuối cùng nhận được vé ok. Sẽ mua lại.',
    });

    console.log(`✅ Đã tạo ${await Review.countDocuments()} Reviews.\n`);

    // ── 6. Chats ────────────────────────────────────────────────────────
    console.log('💬 Seeding Chats...');

    // Chat T01: Buyer1 hỏi Seller2 về vé Lật Mặt 8
    await Chat.insertMany([
      { senderId: buyer1._id, receiverId: seller2._id, ticketId: tickets[0]._id,
        message: 'Chào bạn, vé Lật Mặt 8 hàng G07, G08 này còn không? Mình muốn mua cả 2 vé luôn.', isRead: true, readAt: new Date() },
      { senderId: seller2._id, receiverId: buyer1._id, ticketId: tickets[0]._id,
        message: 'Còn bạn ơi! Mình vừa up lên đây. Vé IMAX hàng G rất đẹp, tầm nhìn lý tưởng. Bạn đặt mua qua GoTix để an toàn nhé, mình sẽ confirm ngay.', isRead: true, readAt: new Date() },
      { senderId: buyer1._id, receiverId: seller2._id, ticketId: tickets[0]._id,
        message: 'Ok mình đặt rồi, đang chờ thanh toán. Vé điện tử gửi qua Zalo hay email bạn?', isRead: false },
      { senderId: seller2._id, receiverId: buyer1._id, ticketId: tickets[0]._id,
        message: 'Bạn để lại số Zalo khi đặt là mình gửi QR code qua đó nhé. Xem xong review giúp mình để tăng trust score với 😄', isRead: false },
    ]);

    // Chat T02: Buyer2 hỏi về vé Demon Slayer
    await Chat.insertMany([
      { senderId: buyer2._id, receiverId: seller4._id, ticketId: tickets[8]._id,
        message: 'Ơi vé Demon Slayer này còn 1 vé hay bạn bán được nhiều vé?', isRead: true, readAt: new Date() },
      { senderId: seller4._id, receiverId: buyer2._id, ticketId: tickets[8]._id,
        message: 'Còn đúng 1 vé thôi bạn ơi, hàng H07 trung tâm rạp. Phim Demon Slayer lần này được khen hay lắm, bạn mua nhanh kẻo hết!', isRead: true, readAt: new Date() },
      { senderId: buyer2._id, receiverId: seller4._id, ticketId: tickets[8]._id,
        message: 'Mình vừa đặt mua rồi! Mình là fan Demon Slayer lâu năm mà. Cảm ơn bạn nhé 🔥', isRead: false },
    ]);

    // Chat T03: Buyer3 khiếu nại vé Deadpool 4DX
    await Chat.insertMany([
      { senderId: buyer3._id, receiverId: seller3._id, ticketId: tickets[5]._id,
        message: 'Bạn ơi, vé Deadpool 4DX mình quét tại cổng CGV Landmark 81 bị báo "Vé đã sử dụng" rồi! Mình chưa dùng lần nào mà?', isRead: true, readAt: new Date() },
      { senderId: seller3._id, receiverId: buyer3._id, ticketId: tickets[5]._id,
        message: 'Ủa thật sự sao bạn? Mình vừa mua vé này hôm qua chưa dùng mà. Bạn thử liên hệ quầy CGV xem họ có xác nhận lại không?', isRead: true, readAt: new Date() },
      { senderId: buyer3._id, receiverId: seller3._id, ticketId: tickets[5]._id,
        message: 'Nhân viên CGV xác nhận là vé đã quét lúc 15:45. Mình vào lúc 16h nên bị từ chối. Đây là vé bị bán 2 lần rồi? Mình sẽ báo cáo GoTix!', isRead: true, readAt: new Date() },
      { senderId: seller3._id, receiverId: buyer3._id, ticketId: tickets[5]._id,
        message: 'Mình thực sự xin lỗi, mình không biết tại sao lại như vậy. Mình đồng ý hoàn tiền qua GoTix, bạn làm theo quy trình của nền tảng giúp mình nhé.', isRead: false },
    ]);

    console.log(`✅ Đã tạo ${await Chat.countDocuments()} Chat messages.\n`);

    // ── 7. Notifications ────────────────────────────────────────────────
    console.log('🔔 Seeding Notifications...');

    await Notification.insertMany([
      {
        receiverId: seller2._id, type: 'ticket_approved', isRead: true,
        title: 'Vé phim của bạn đã được duyệt ✅',
        message: 'Vé "Lật Mặt 8: Vòng Tay Nhau - CGV Vincom Center Bà Triệu" đã được kiểm duyệt và hiển thị công khai. Chúc bạn bán vé nhanh!',
        relatedId: tickets[0]._id.toString(),
      },
      {
        receiverId: seller1._id, type: 'ticket_sold', isRead: false,
        title: 'Vé phim đã bán được! 🎉',
        message: 'Vé "Spider-Man: Brand New Day - CGV Vincom Đồng Khởi" đã được mua bởi Đỗ Minh Khoa. 85,500đ đã vào số dư khả dụng của bạn.',
        relatedId: ticketSold1._id.toString(),
      },
      {
        receiverId: buyer3._id, type: 'transaction_paid', isRead: true,
        title: 'Thanh toán thành công 🎬',
        message: 'Giao dịch mua vé "Spider-Man: Brand New Day" đã được xác nhận. Kiểm tra mã QR trong mục Đơn hàng của tôi nhé!',
        relatedId: tx1._id.toString(),
      },
      {
        receiverId: buyer2._id, type: 'ticket_approved', isRead: false,
        title: 'Vé bạn đặt đang chờ thanh toán ⏳',
        message: 'Vé "Demon Slayer: Infinity Castle" đang chờ bạn thanh toán. Vui lòng hoàn tất trong 30 phút để giữ chỗ.',
        relatedId: tickets[8]._id.toString(),
      },
      {
        receiverId: seller3._id, type: 'report_submitted', isRead: false,
        title: 'Giao dịch bị khiếu nại ⚠️',
        message: 'Khách hàng Đỗ Minh Khoa báo cáo vé "Deadpool & Wolverine 2 - 4DX" không hợp lệ khi vào rạp. Admin đang xem xét. Vui lòng gửi bằng chứng trong 24h.',
        relatedId: tx6._id.toString(),
      },
      {
        receiverId: seller1._id, type: 'wallet_credited', isRead: true,
        title: 'Ví được cộng tiền 💰',
        message: 'GoTix đã giải phóng 47,500đ vào ví khả dụng của bạn sau khi giao dịch Inside Out 3 được xác nhận hoàn tất bởi người mua.',
        relatedId: tx4._id.toString(),
      },
      {
        receiverId: buyer1._id, type: 'chat_message', isRead: false,
        title: 'Trần Thị Mai vừa nhắn tin 💬',
        message: 'Bạn để lại số Zalo khi đặt là mình gửi QR code qua đó nhé. Xem xong review giúp mình để tăng trust score với 😄',
        relatedId: tickets[0]._id.toString(),
      },
      {
        receiverId: seller5._id, type: 'ticket_submitted', isRead: true,
        title: 'Vé đang chờ kiểm duyệt 🔍',
        message: 'Vé "Avatar 3: Fire and Ash" của bạn đã được gửi lên và đang trong hàng chờ kiểm duyệt. Thường mất 2-4 giờ trong giờ hành chính.',
        relatedId: tickets[14]._id.toString(),
      },
    ]);

    console.log(`✅ Đã tạo ${await Notification.countDocuments()} Notifications.\n`);

    // ── 8. Favorites ────────────────────────────────────────────────────
    console.log('❤️  Seeding Favorites...');

    await Favorite.insertMany([
      { userId: buyer1._id, ticketId: tickets[1]._id  }, // Buyer1 lưu Avengers Sweetbox
      { userId: buyer1._id, ticketId: tickets[5]._id  }, // Buyer1 lưu Deadpool 4DX
      { userId: buyer1._id, ticketId: tickets[11]._id }, // Buyer1 lưu Dark Knight re-release
      { userId: buyer2._id, ticketId: tickets[8]._id  }, // Buyer2 lưu Demon Slayer
      { userId: buyer2._id, ticketId: tickets[9]._id  }, // Buyer2 lưu Past Lives 2
      { userId: buyer3._id, ticketId: tickets[6]._id  }, // Buyer3 lưu Interstellar IMAX
      { userId: buyer3._id, ticketId: tickets[1]._id  }, // Buyer3 lưu Avengers
      { userId: buyer4._id, ticketId: tickets[2]._id  }, // Buyer4 lưu Kung Fu Panda
      { userId: buyer4._id, ticketId: tickets[3]._id  }, // Buyer4 lưu Inside Out 3
      { userId: buyer4._id, ticketId: tickets[10]._id }, // Buyer4 lưu Encanto 2
    ]);

    console.log(`✅ Đã tạo ${await Favorite.countDocuments()} Favorites.\n`);

    // ── 9. TopUps ───────────────────────────────────────────────────────
    console.log('💳 Seeding TopUps...');

    await TopUp.insertMany([
      {
        userId: seller1._id, amount: 1000000, transferCode: 'GOTIX-NAP-1M-HUNG',
        status: 'approved', adminNote: 'VCB Nguyen Van Hung 1,000,000đ ✓',
        processedAt: daysAgo(25), processedBy: admin._id,
      },
      {
        userId: seller3._id, amount: 500000, transferCode: 'GOTIX-NAP-500K-MINH',
        status: 'approved', adminNote: 'MB Bank Le Hoang Minh 500,000đ ✓',
        processedAt: daysAgo(12), processedBy: admin._id,
      },
      {
        userId: buyer1._id, amount: 800000, transferCode: 'GOTIX-NAP-800K-TUAN',
        status: 'approved', adminNote: 'Techcombank Hoang Anh Tuan 800,000đ ✓',
        processedAt: daysAgo(7), processedBy: admin._id,
      },
      {
        userId: buyer3._id, amount: 1500000, transferCode: 'GOTIX-NAP-15M-KHOA',
        status: 'approved', adminNote: 'BIDV Do Minh Khoa 1,500,000đ ✓',
        processedAt: daysAgo(10), processedBy: admin._id,
      },
      {
        userId: buyer4._id, amount: 2000000, transferCode: 'GOTIX-NAP-2M-LINH',
        status: 'pending',
      },
      {
        userId: seller5._id, amount: 300000, transferCode: 'GOTIX-NAP-300K-TUNG',
        status: 'rejected', adminNote: 'Không tìm thấy giao dịch khớp mã này.',
        processedAt: daysAgo(3), processedBy: admin._id,
      },
    ]);

    console.log(`✅ Đã tạo ${await TopUp.countDocuments()} TopUps.\n`);

    // ── 10. Withdrawals ─────────────────────────────────────────────────
    console.log('🏧 Seeding Withdrawals...');

    await Withdrawal.insertMany([
      {
        userId: seller1._id, amount: 2000000,
        bankName: 'Vietcombank (VCB)', bankAccount: '1014366799', bankAccountName: 'NGUYEN VAN HUNG',
        status: 'approved', adminNote: 'Đã chuyển thành công lúc 14:30 ngày 18/05.',
        processedAt: daysAgo(9), processedBy: admin._id,
      },
      {
        userId: seller3._id, amount: 800000,
        bankName: 'MB Bank', bankAccount: '0334567890', bankAccountName: 'LE HOANG MINH',
        status: 'approved', adminNote: 'Đã chuyển thành công.',
        processedAt: daysAgo(6), processedBy: admin._id,
      },
      {
        userId: seller2._id, amount: 400000,
        bankName: 'Techcombank (TCB)', bankAccount: '1903246781012', bankAccountName: 'TRAN THI MAI',
        status: 'pending',
      },
    ]);

    console.log(`✅ Đã tạo ${await Withdrawal.countDocuments()} Withdrawals.\n`);

    // ── 11. ProSubscriptions ────────────────────────────────────────────
    console.log('⭐ Seeding ProSubscriptions...');

    await ProSubscription.create({
      userId: seller1._id, plan: '3_months', price: 350000, durationInDays: 90,
      startDate: daysAgo(20), endDate: daysLater(70),
      paymentStatus: 'paid', status: 'active',
    });

    await ProSubscription.create({
      userId: seller3._id, plan: '1_month', price: 150000, durationInDays: 30,
      startDate: daysAgo(10), endDate: daysLater(20),
      paymentStatus: 'paid', status: 'active',
    });

    console.log(`✅ Đã tạo ${await ProSubscription.countDocuments()} ProSubscriptions.\n`);

    // ── 12. Reports ─────────────────────────────────────────────────────
    console.log('🚨 Seeding Reports...');

    await Report.create({
      reporterId: buyer3._id, ticketId: tickets[5]._id, transactionId: tx6._id,
      reason: 'invalid_qr',
      description: 'Vé Deadpool & Wolverine 2 - 4DX tại CGV Landmark 81: khi quét mã QR tại cổng lúc 16:00, hệ thống thông báo "Vé đã được sử dụng lúc 15:47". Tôi chưa hề vào rạp lần nào. Nghi vấn người bán đã bán vé 2 lần. Nhân viên CGV cũng xác nhận vé đã quét trước đó.',
      status: 'requesting_evidence',
      adminNote: 'Admin đã liên hệ CGV xác nhận vé quét lúc 15:47. Đang yêu cầu seller Lê Hoàng Minh cung cấp bằng chứng mua vé gốc trong 24h.',
    });

    console.log(`✅ Đã tạo ${await Report.countDocuments()} Reports.\n`);

    // ── 13. AuditLogs ───────────────────────────────────────────────────
    console.log('📋 Seeding AuditLogs...');

    await AuditLog.insertMany([
      {
        adminId: admin._id, action: 'VERIFY_TICKET', targetType: 'Ticket',
        targetId: tickets[0]._id.toString(),
        description: 'Duyệt vé "Lật Mặt 8 - CGV Vincom Bà Triệu" sau khi kiểm tra ảnh vé hợp lệ, khớp mã đặt chỗ trên hệ thống CGV.',
      },
      {
        adminId: admin._id, action: 'VERIFY_TICKET', targetType: 'Ticket',
        targetId: tickets[1]._id.toString(),
        description: 'Duyệt vé "Avengers: Secret Wars Sweetbox" - ảnh vé rõ ràng, mã booking khớp CGV Crescent.',
      },
      {
        adminId: admin._id, action: 'VERIFY_TICKET', targetType: 'Ticket',
        targetId: tickets[6]._id.toString(),
        description: 'Duyệt vé Interstellar 10th Anniversary IMAX - xác minh qua hệ thống CGV hợp lệ.',
      },
      {
        adminId: admin._id, action: 'APPROVE_WITHDRAWAL', targetType: 'Withdrawal',
        targetId: 'W-HUNG-001',
        description: 'Duyệt rút tiền 2,000,000đ cho seller Nguyễn Văn Hùng, tài khoản VCB 1014366799.',
      },
      {
        adminId: admin._id, action: 'APPROVE_TOPUP', targetType: 'TopUp',
        targetId: 'TU-TUAN-001',
        description: 'Xác nhận nạp tiền 800,000đ cho Hoàng Anh Tuấn từ Techcombank, mã giao dịch GOTIX-NAP-800K-TUAN.',
      },
      {
        adminId: admin._id, action: 'INVESTIGATE_REPORT', targetType: 'Report',
        targetId: tickets[5]._id.toString(),
        description: 'Mở điều tra vụ khiếu nại vé Deadpool & Wolverine 2 bị bán 2 lần. Đã liên hệ CGV Landmark 81 để lấy log quét vé.',
      },
    ]);

    console.log(`✅ Đã tạo ${await AuditLog.countDocuments()} AuditLogs.\n`);

    console.log('='.repeat(55));
    console.log('🎫  SEEDING HOÀN TẤT – DỮ LIỆU VÉ PHIM GOTIX');
    console.log('='.repeat(55));
    console.log(`👤  Users:            ${await User.countDocuments()}`);
    console.log(`🎟️   Vé phim (Movie):  ${await Ticket.countDocuments({ category: 'movie' })}`);
    console.log(`💰  Transactions:     ${await Transaction.countDocuments()}`);
    console.log(`⭐  Reviews:          ${await Review.countDocuments()}`);
    console.log(`💬  Chats:            ${await Chat.countDocuments()}`);
    console.log(`🔔  Notifications:    ${await Notification.countDocuments()}`);
    console.log(`❤️   Favorites:        ${await Favorite.countDocuments()}`);
    console.log(`💳  TopUps:           ${await TopUp.countDocuments()}`);
    console.log(`🏧  Withdrawals:      ${await Withdrawal.countDocuments()}`);
    console.log(`⭐  ProSubscriptions: ${await ProSubscription.countDocuments()}`);
    console.log(`🚨  Reports:          ${await Report.countDocuments()}`);
    console.log(`📋  AuditLogs:        ${await AuditLog.countDocuments()}`);
    console.log('='.repeat(55));
    console.log('\n📌 TÀI KHOẢN TEST:');
    console.log('  Admin  : admin@gotix.com       / adminpassword123');
    console.log('  Seller1: seller1@gotix.com     / password123  (Pro ⭐)');
    console.log('  Seller2: seller2@gotix.com     / password123');
    console.log('  Seller3: seller3@gotix.com     / password123  (Pro ⭐)');
    console.log('  Seller4: seller4@gotix.com     / password123');
    console.log('  Seller5: seller5@gotix.com     / password123');
    console.log('  Buyer1 : buyer1@gotix.com      / password123');
    console.log('  Buyer2 : buyer2@gotix.com      / password123');
    console.log('  Buyer3 : buyer3@gotix.com      / password123');
    console.log('  Buyer4 : buyer4@gotix.com      / password123');
    console.log('='.repeat(55));

  } catch (err) {
    console.error('❌ Lỗi seeding:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Đã ngắt kết nối MongoDB.');
    process.exit(0);
  }
};

seedData();

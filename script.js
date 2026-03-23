document.addEventListener("DOMContentLoaded", () => {
  // === Các biến cho Dropdown ===
  const customSelect = document.querySelector(".custom-select");
  const selected = customSelect.querySelector(".selected");
  const optionsContainer = customSelect.querySelector(".options");
  const optionsList = customSelect.querySelectorAll(".options div");

  // === Các biến cho Tìm kiếm & Lọc ===
  const searchInput = document.getElementById("searchInput");
  const allCards = document.querySelectorAll(".card-container .card");
  
  // Biến lưu trữ trạng thái
  let currentFilter = "all";
  let currentSearchTerm = "";

  /**
   * TẠO BỘ ĐỆM TÊN DANH MỤC (MỚI)
   * Tạo một Map (giống từ điển) để tra cứu nhanh tên danh mục từ data-value
   * Ví dụ: "truonghoc" -> "Trường học"
   */
  const categoryNameMap = new Map();
  optionsList.forEach(option => {
    // Bỏ qua "Tất cả"
    if (option.dataset.value !== "all") {
      categoryNameMap.set(option.dataset.value, option.textContent);
    }
  });

  /**
   * Hàm chuẩn hóa văn bản Tiếng Việt để tìm kiếm
   */
  function normalizeText(text) {
    return text.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .replace(/đ/g, "d");
  }

  /**
   * Hàm lọc chính (ĐÃ NÂNG CẤP ĐỂ HỖ TRỢ NHIỀU DATA-TYPE)
   */
  function filterCards() {
    const normalizedSearchTerm = normalizeText(currentSearchTerm);

    allCards.forEach(card => {
      // 1. Lấy tất cả dữ liệu text từ thẻ
      
      // === THAY ĐỔI 1: Lấy chuỗi và tách thành mảng ===
      const cardTypeString = card.dataset.type; // Ví dụ: "mohinhthanhnien muasam"
      const cardTypesArray = cardTypeString.split(' '); // Ví dụ: ["mohinhthanhnien", "muasam"]
      // === KẾT THÚC THAY ĐỔI 1 ===

      const cardTitle = card.querySelector(".card-text h3").textContent;
      const cardAddress = card.querySelector(".card-text p").textContent;
      
      const cardKeywords = card.dataset.keywords || "";

      // === THAY ĐỔI 2: Lấy TẤT CẢ tên danh mục cho việc tìm kiếm ===
      // Lặp qua mảng ["mohinhthanhnien", "muasam"]
      // và lấy tên tương ứng ("Mô hình thanh niên", "Mua Sắm")
      const categoryNames = cardTypesArray
        .map(type => categoryNameMap.get(type) || "") // Tìm tên cho mỗi type
        .join(" "); // Nối chúng lại, ví dụ: "Mô hình thanh niên Mua Sắm"
      // === KẾT THÚC THAY ĐỔI 2 ===

      // Gộp tất cả lại thành một chuỗi để tìm kiếm
      const searchableText = cardTitle + " " + cardAddress + " " + cardKeywords + " " + categoryNames;
      const normalizedCardText = normalizeText(searchableText);

      // 2. Kiểm tra điều kiện lọc
      // === THAY ĐỔI 3: Kiểm tra lọc bằng .includes() ===
      // Thay vì so sánh bằng (===), ta kiểm tra xem mảng có CHỨA 
      // giá trị đang lọc hay không.
      const filterMatch = (currentFilter === "all") || cardTypesArray.includes(currentFilter);
      // === KẾT THÚC THAY ĐỔI 3 ===

      const searchMatch = normalizedCardText.includes(normalizedSearchTerm);

      // 3. Ẩn/Hiện thẻ
      if (filterMatch && searchMatch) {
        card.style.display = "flex"; // hoặc "block" tùy theo CSS của bạn
      } else {
        card.style.display = "none";
      }
    });
  }

  // === Gắn sự kiện (Event Listeners) ===

  // 1. Sự kiện cho Dropdown
  selected.addEventListener("click", () => {
    customSelect.classList.toggle("active");
  });

  // 2. Sự kiện khi chọn một mục trong Dropdown
  optionsList.forEach(option => {
    option.addEventListener("click", () => {
      selected.textContent = option.textContent;
      customSelect.classList.remove("active");
      
      currentFilter = option.dataset.value;
      filterCards(); 
    });
  });

  // 3. Sự kiện khi gõ vào ô tìm kiếm
  searchInput.addEventListener("input", () => {
    currentSearchTerm = searchInput.value;
    filterCards();
  });

  // 4. Đóng dropdown khi click ra ngoài
  document.addEventListener("click", e => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove("active");
    }
  });

  // ======================================
  // === (MỚI) Logic cho Âm nhạc địa phương ===
  // ======================================
  
  const audioToggleBtn = document.getElementById("audioToggleBtn"); 
  // (MỚI) Container chứa danh sách
  const songListContainer = document.getElementById("songListContainer"); 
  // (MỚI) Tất cả các bài hát trong danh sách
  const songItems = document.querySelectorAll(".song-item"); 
  
  // (CŨ) Wrapper, Player, Nút đóng
  const playerWrapper = document.getElementById("playerWrapper");
  const localPlayer = document.getElementById("localAudioPlayer");
  const audioCloseBtn = document.getElementById("audioCloseBtn");
  
  // (MỚI) Thẻ <p> hiển thị tên bài đang phát
  const currentPlayerTitle = document.getElementById("currentPlayerTitle");

  // Chỉ chạy code nếu tìm thấy TẤT CẢ các thành phần
  if (audioToggleBtn && songListContainer && songItems.length > 0 && playerWrapper && localPlayer && audioCloseBtn && currentPlayerTitle) {
    
    // 1. (MỚI) Sự kiện khi BẤM VÀO H2 (Nút xổ danh sách)
    audioToggleBtn.addEventListener("click", () => {
      // Thêm/xóa class 'active' (để CSS xoay mũi tên)
      audioToggleBtn.classList.toggle("active");
      
      // Hiển thị hoặc ẩn danh sách nhạc
      if (songListContainer.style.display === "block") {
        songListContainer.style.display = "none";
      } else {
        songListContainer.style.display = "block";
      }
    });

    // 2. (MỚI) Sự kiện khi BẤM VÀO MỘT BÀI HÁT trong danh sách
    songItems.forEach(item => {
      item.addEventListener("click", () => {
        // Lấy thông tin bài hát từ data-attributes
        const songSrc = item.dataset.src;
        const songTitle = item.dataset.title;

        // 1. Cập nhật trình phát nhạc
        localPlayer.src = songSrc; // Đặt nguồn nhạc mới
        currentPlayerTitle.textContent = songTitle; // Đặt tên bài hát

        // 2. Hiển thị player
        // Player và nút X sẽ cùng lúc hiển thị (đúng yêu cầu của bạn)
        playerWrapper.style.display = "block";

        // 3. Ẩn danh sách nhạc đi (để gọn)
        songListContainer.style.display = "none";
        audioToggleBtn.classList.remove("active"); // Xoay mũi tên về
        
        // 4. Phát nhạc
        localPlayer.load(); // Tải file nhạc mới
        localPlayer.play(); // Phát nhạc
      });
    });

    // 3. (GIỮ NGUYÊN) Sự kiện khi BẤM NÚT ĐÓNG (X)
    audioCloseBtn.addEventListener("click", () => {
      // 1. Ẩn trình phát nhạc
      playerWrapper.style.display = "none";

      // 2. Dừng nhạc và tua về đầu
      localPlayer.pause();
      localPlayer.currentTime = 0;
      localPlayer.src = ""; 

      // 3. (MỚI) Hiển thị lại danh sách bài hát
      songListContainer.style.display = "block";

      // 4. (MỚI) Đảm bảo mũi tên ở trạng thái "mở" (trỏ xuống)
      audioToggleBtn.classList.add("active");
    });

  }

  // Chạy bộ lọc một lần khi tải trang
  filterCards();
});

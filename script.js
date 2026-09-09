/**
 * TÊN DỰ ÁN: BẢN ĐỒ SỐ ĐẶC KHU CÔ TÔ
 * FILE: script.js
 * MÔ TẢ: Xử lý logic giao diện, lọc bản đồ, phân trang, đa ngôn ngữ và trình phát nhạc.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ======================================================
    // 1. CẤU HÌNH & BIẾN TRẠNG THÁI (STATE & CONFIG)
    // ======================================================
    const AppState = {
        currentFilter: "all",
        currentSearchTerm: "",
        currentPage: 1,
        itemsPerPage: 8,
        currentLang: 'vi'
    };

    // Các phần tử DOM chính
    const DOM = {
        allCards: document.querySelectorAll(".card-container .card"),
        searchInput: document.getElementById("searchInput"),
        suggestionsBox: document.getElementById("suggestionsBox"),
        customSelect: document.querySelector(".custom-select"),
        selectedFilter: document.querySelector(".custom-select .selected"),
        optionsList: document.querySelectorAll(".custom-select .options div"),
        paginationContainer: document.getElementById("paginationContainer"),
        btnVi: document.getElementById("btn-vi"),
        btnEn: document.getElementById("btn-en")
    };

    // Bản đồ danh mục (Dùng để tìm kiếm text theo tên danh mục)
    const categoryNameMap = new Map();

    // Lấy danh sách tên địa điểm không trùng lặp cho Gợi ý tìm kiếm
    const uniqueSuggestions = [...new Set(
        Array.from(DOM.allCards).map(card => card.querySelector(".card-text h3").textContent.trim())
    )];


    // ======================================================
    // 2. DỮ LIỆU ĐA NGÔN NGỮ (I18N DICTIONARY)
    // ======================================================
    const i18n = {
        vi: {
            namelogo: "ĐẶC KHU CÔ TÔ",
            nametagP: "CÔNG TRÌNH THANH NIÊN SỐ ĐẶC KHU CÔ TÔ",
            nametagH1: "Bản đồ số đặc khu Cô Tô",
            searchPlaceholder: "Tìm theo tên/địa chỉ...",
            filterAll: "Tất cả",
            filterHanhChinh: "Hành chính",
            filterYTe: "Y tế",
            filterDuLich: "Du lịch",
            filterTamLinh: "Tâm linh",
            filterDichVu: "Bãi tắm",
            filterTruongHoc: "Trường học",
            footerIntro: "Giới thiệu đặc khu Cô Tô",
            footerMusic: "Âm nhạc địa phương",
            copyright: "Bản quyền © 2025 | Đoàn Thanh niên Cộng sản Hồ Chí Minh đặc khu Cô Tô",
            openMap: "Mở Google Maps"
        },
        en: {
            namelogo: "CO TO SPECIAL ZONE",
            nametagP: "YOUTH DIGITAL PROJECT OF CO TO SPECIAL ZONE",
            nametagH1: "Digital Map of Co To Special Zone",
            searchPlaceholder: "Search by name/address...",
            filterAll: "All",
            filterHanhChinh: "Administration",
            filterYTe: "Healthcare",
            filterDuLich: "Tourism",
            filterTamLinh: "Spiritual",
            filterDichVu: "Beaches",
            filterTruongHoc: "Schools",
            footerIntro: "About Co To Special Zone",
            footerMusic: "Local Music",
            copyright: "Copyright © 2025 | Ho Chi Minh Communist Youth Union of Co To Special Zone",
            openMap: "Open Google Maps"
        }
    };


    // ======================================================
    // 3. CÁC HÀM TIỆN ÍCH (UTILITIES)
    // ======================================================
    const Utils = {
        // Chuẩn hóa text tiếng Việt (bỏ dấu, viết thường) để dễ tìm kiếm
        normalizeText: (text) => {
            return text.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d");
        },
        
        // Cập nhật bộ đệm tên danh mục (Dùng khi đổi ngôn ngữ)
        updateCategoryMap: () => {
            const mapping = {
                "hanhchinh": "filterHanhChinh", "yte": "filterYTe", "dulich": "filterDuLich",
                "tamlinh": "filterTamLinh", "dichvu": "filterDichVu", "truonghoc": "filterTruongHoc"
            };
            DOM.optionsList.forEach(option => {
                if (option.dataset.value !== "all") {
                    categoryNameMap.set(option.dataset.value, i18n[AppState.currentLang][mapping[option.dataset.value]]);
                }
            });
        }
    };


    // ======================================================
    // 4. MODULE QUẢN LÝ TÌM KIẾM & LỌC & GỢI Ý
    // ======================================================
    const FilterManager = {
        init: () => {
            Utils.updateCategoryMap(); // Khởi tạo map danh mục

            // Bắt sự kiện nhập ô tìm kiếm
            DOM.searchInput.addEventListener("input", (e) => {
                AppState.currentSearchTerm = e.target.value;
                AppState.currentPage = 1;
                FilterManager.filterCards();
                FilterManager.showSuggestions(AppState.currentSearchTerm);
            });

            // Bắt sự kiện chọn Dropdown
            DOM.selectedFilter.addEventListener("click", () => {
                DOM.customSelect.classList.toggle("active");
            });

            DOM.optionsList.forEach(option => {
                option.addEventListener("click", () => {
                    DOM.selectedFilter.textContent = option.textContent;
                    DOM.customSelect.classList.remove("active");
                    AppState.currentFilter = option.dataset.value;
                    AppState.currentPage = 1;
                    FilterManager.filterCards();
                });
            });

            // Đóng Dropdown / Suggestions khi click ra ngoài
            document.addEventListener("click", (e) => {
                if (!DOM.customSelect.contains(e.target)) {
                    DOM.customSelect.classList.remove("active");
                }
                if (!DOM.searchInput.contains(e.target) && DOM.suggestionsBox && !DOM.suggestionsBox.contains(e.target)) {
                    DOM.suggestionsBox.style.display = "none";
                }
            });
        },

        filterCards: () => {
            const normalizedSearchTerm = Utils.normalizeText(AppState.currentSearchTerm);
            let matchedCards = [];

            DOM.allCards.forEach(card => {
                const cardTypesArray = card.dataset.type.split(' ');
                const cardTitle = card.querySelector(".card-text h3").textContent;
                const cardAddress = card.querySelector(".card-text p").textContent;
                const cardKeywords = card.dataset.keywords || "";
                
                const categoryNames = cardTypesArray.map(type => categoryNameMap.get(type) || "").join(" ");
                const searchableText = `${cardTitle} ${cardAddress} ${cardKeywords} ${categoryNames}`;
                
                const filterMatch = (AppState.currentFilter === "all") || cardTypesArray.includes(AppState.currentFilter);
                const searchMatch = Utils.normalizeText(searchableText).includes(normalizedSearchTerm);

                if (filterMatch && searchMatch) {
                    matchedCards.push(card);
                }
                card.style.display = "none"; // Tạm ẩn tất cả
            });

            PaginationManager.render(matchedCards);
        },

        showSuggestions: (term) => {
            DOM.suggestionsBox.innerHTML = "";
            if (!term.trim()) {
                DOM.suggestionsBox.style.display = "none";
                return;
            }
            
            const normalizedTerm = Utils.normalizeText(term);
            const matches = uniqueSuggestions.filter(item => Utils.normalizeText(item).includes(normalizedTerm));

            if (matches.length > 0) {
                matches.forEach(match => {
                    const div = document.createElement("div");
                    div.classList.add("suggestion-item");
                    div.textContent = match;
                    
                    div.addEventListener("click", () => {
                        DOM.searchInput.value = match;
                        AppState.currentSearchTerm = match;
                        AppState.currentPage = 1;
                        FilterManager.filterCards();
                        DOM.suggestionsBox.style.display = "none";
                    });
                    
                    DOM.suggestionsBox.appendChild(div);
                });
                DOM.suggestionsBox.style.display = "block";
            } else {
                DOM.suggestionsBox.style.display = "none";
            }
        }
    };


    // ======================================================
    // 5. MODULE PHÂN TRANG (PAGINATION)
    // ======================================================
    const PaginationManager = {
        render: (matchedCards) => {
            PaginationManager.displayPage(matchedCards);
            PaginationManager.setupButtons(matchedCards);
        },

        displayPage: (matchedCards) => {
            matchedCards.forEach(card => card.style.display = "none");
            const startIndex = (AppState.currentPage - 1) * AppState.itemsPerPage;
            const endIndex = startIndex + AppState.itemsPerPage;
            
            const paginatedItems = matchedCards.slice(startIndex, endIndex);
            paginatedItems.forEach(card => card.style.display = "flex");
        },

        setupButtons: (matchedCards) => {
            DOM.paginationContainer.innerHTML = "";
            const pageCount = Math.ceil(matchedCards.length / AppState.itemsPerPage);
            
            if (pageCount <= 1) return;
            
            for (let i = 1; i <= pageCount; i++) {
                const btn = document.createElement("button");
                btn.classList.add("page-btn");
                btn.innerText = i;
                
                if (AppState.currentPage === i) btn.classList.add("active");
                
                btn.addEventListener("click", () => {
                    AppState.currentPage = i;
                    PaginationManager.displayPage(matchedCards);
                    
                    const currentActive = DOM.paginationContainer.querySelector('.active');
                    if(currentActive) currentActive.classList.remove('active');
                    btn.classList.add('active');
                    
                    // Cuộn lên đầu danh sách
                    document.querySelector('.search-bar').scrollIntoView({ behavior: 'smooth' });
                });
                
                DOM.paginationContainer.appendChild(btn);
            }
        }
    };


    // ======================================================
    // 6. MODULE NGÔN NGỮ (I18N MANAGER)
    // ======================================================
    const LanguageManager = {
        init: () => {
            // Lưu lại địa chỉ gốc tiếng Việt của tất cả các thẻ bản đồ ngay khi web vừa tải xong
            DOM.allCards.forEach(card => {
                const addrEl = card.querySelector(".card-text p");
                if (addrEl && !addrEl.hasAttribute('data-vi-text')) {
                    addrEl.setAttribute('data-vi-text', addrEl.textContent);
                }
            });

            if (DOM.btnVi) DOM.btnVi.addEventListener('click', () => LanguageManager.switchLang('vi'));
            if (DOM.btnEn) DOM.btnEn.addEventListener('click', () => LanguageManager.switchLang('en'));
        },

        switchLang: (lang) => {
            if (AppState.currentLang === lang) return; 
            
            AppState.currentLang = lang;
            LanguageManager.updateDOM(lang);
            LanguageManager.updateButtonsUI(lang);
            
            Utils.updateCategoryMap();
            FilterManager.filterCards();
        },

        updateDOM: (lang) => {
            // (Bổ sung thêm bản dịch mới vào biến cục bộ này cho gọn)
            const t = {
                ...i18n[lang],
                youthUnion: lang === 'vi' ? "Đoàn TNCS Hồ Chí Minh đặc khu Cô Tô" : "Ho Chi Minh Communist Youth Union of Co To Special Zone"
            };
            
            // Header & Search
            document.getElementById('namelogo').textContent = t.namelogo;
            document.querySelector('#nametag p').textContent = t.nametagP;
            document.querySelector('#nametag h1').textContent = t.nametagH1;
            document.querySelector('#textlogof h3').textContent = t.namelogo;
            DOM.searchInput.placeholder = t.searchPlaceholder;
            
            // Dịch dòng Đoàn TNCS ở Footer
            const footerUnion = document.querySelector('#logofooter p');
            if (footerUnion) footerUnion.textContent = t.youthUnion;

            // Dropdown
            DOM.optionsList[0].textContent = t.filterAll; 
            DOM.optionsList[1].textContent = t.filterHanhChinh; 
            DOM.optionsList[2].textContent = t.filterYTe; 
            DOM.optionsList[3].textContent = t.filterDuLich; 
            DOM.optionsList[4].textContent = t.filterTamLinh; 
            DOM.optionsList[5].textContent = t.filterDichVu; 
            DOM.optionsList[6].textContent = t.filterTruongHoc; 

            const mapping = {
                "all": "filterAll", "hanhchinh": "filterHanhChinh", "yte": "filterYTe",
                "dulich": "filterDuLich", "tamlinh": "filterTamLinh", "dichvu": "filterDichVu", "truonghoc": "filterTruongHoc"
            };
            const currentSelectedVal = AppState.currentFilter || "all";
            DOM.selectedFilter.textContent = t[mapping[currentSelectedVal]];

            // Footer (Giới thiệu, Âm nhạc, Bản quyền)
            const h2Elements = document.querySelectorAll('#ThongtinF h2');
            if(h2Elements.length >= 2) {
                h2Elements[0].textContent = t.footerIntro;
                h2Elements[1].textContent = t.footerMusic;
            }
            document.getElementById('last').textContent = t.copyright;

            // Nút Maps
            document.querySelectorAll('.map-btn').forEach(btn => btn.textContent = t.openMap);

            // ============================================
            // DỊCH TỰ ĐỘNG ĐỊA CHỈ (Thôn, Khu phố, TP, Đặc khu)
            // ============================================
            DOM.allCards.forEach(card => {
                const addrEl = card.querySelector(".card-text p");
                if (addrEl) {
                    let address = addrEl.getAttribute('data-vi-text');
                    
                    if (lang === 'en') {
                        // Replace các cụm từ (có phân biệt hoa/thường để dịch chuẩn)
                        address = address
                            .replace(/Thôn /g, "Village ")
                            .replace(/Khu phố /g, "Quarter ")
                            .replace(/đặc khu Cô Tô/gi, "Co To Special Zone")
                            .replace(/TP Quảng Ninh/gi, "Quang Ninh City");
                    }
                    
                    addrEl.textContent = address;
                }
            });
        },

        updateButtonsUI: (lang) => {
            if (lang === 'vi') {
                DOM.btnVi.classList.add('active');
                DOM.btnEn.classList.remove('active');
            } else {
                DOM.btnEn.classList.add('active');
                DOM.btnVi.classList.remove('active');
            }
        }
    };


    // ======================================================
    // 7. MODULE TRÌNH PHÁT NHẠC (AUDIO PLAYER)
    // ======================================================
    const AudioManager = {
        init: () => {
            const audioToggleBtn = document.getElementById("audioToggleBtn"); 
            const songListContainer = document.getElementById("songListContainer"); 
            const songItems = document.querySelectorAll(".song-item"); 
            const playerWrapper = document.getElementById("playerWrapper");
            const localPlayer = document.getElementById("localAudioPlayer");
            const audioCloseBtn = document.getElementById("audioCloseBtn");
            const currentPlayerTitle = document.getElementById("currentPlayerTitle");

            if (!audioToggleBtn || songItems.length === 0 || !localPlayer) return;

            // Xổ danh sách nhạc
            audioToggleBtn.addEventListener("click", () => {
                audioToggleBtn.classList.toggle("active");
                songListContainer.style.display = (songListContainer.style.display === "block") ? "none" : "block";
            });

            // Chọn bài hát để phát
            songItems.forEach(item => {
                item.addEventListener("click", () => {
                    localPlayer.src = item.dataset.src;
                    currentPlayerTitle.textContent = item.dataset.title;
                    
                    playerWrapper.style.display = "block";
                    songListContainer.style.display = "none";
                    audioToggleBtn.classList.remove("active");
                    
                    localPlayer.load();
                    localPlayer.play();
                });
            });

            // Nút đóng trình phát
            audioCloseBtn.addEventListener("click", () => {
                playerWrapper.style.display = "none";
                localPlayer.pause();
                localPlayer.currentTime = 0;
                localPlayer.src = ""; 
                
                songListContainer.style.display = "block";
                audioToggleBtn.classList.add("active");
            });
        }
    };


    // ======================================================
    // 8. KHỞI TẠO ỨNG DỤNG (APP INIT)
    // ======================================================
    const App = {
        init: () => {
            FilterManager.init();
            LanguageManager.init();
            AudioManager.init();
            
            // Chạy bộ lọc lần đầu để render danh sách thẻ
            FilterManager.filterCards();
        }
    };

    // Chạy ứng dụng
    App.init();
});

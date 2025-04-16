/**
 * Application Configuration
 * Store all environment variables and configuration settings here
 */

export const CONFIG = {
    // API Keys
    API_KEYS: {
        GEMINI: 'AIzaSyA4eKIk-lV7xZXjmor5g-MfobIGACnGOqo', // Replace with your Gemini API key
    },
    
    // API Endpoints
    API_ENDPOINTS: {
        GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    },
    
    // AI Model settings
    AI_SETTINGS: {
        // Gemini model configuration
        GEMINI: {
            temperature: 0.2,
            topK: 1,
            topP: 1,
            maxOutputTokens: 10,
        },
        // Categories for expense classification
        EXPENSE_CATEGORIES: [
            "Ăn uống", 
            "Đi lại", 
            "Giải trí", 
            "Mua sắm", 
            "Tiện ích",
            "Giáo dục",
            "Y tế",
            "Giao lưu"
        ],
        // Keyword rules for fallback categorization
        CATEGORY_RULES: {
            "Ăn uống": ["ăn", "cafe", "cà phê", "trà", "đồ uống", "nhà hàng", "cơm", "bún", "phở", "quán", "bia", "ẩm thực", "buffet"],
            "Đi lại": ["xe", "taxi", "grab", "di chuyển", "đi lại", "xăng", "bus", "tàu", "vé tàu", "vé xe", "phí gửi xe", "đỗ xe", "bến xe", "máy bay", "sân bay", "đặt xe", "đi chung"],
            "Giải trí": ["giải trí", "phim", "xem phim", "rạp", "game", "du lịch", "chơi", "tiệc", "sinh nhật", "karaoke", "nhạc", "biển", "hồ bơi", "công viên", "vui chơi", "nghỉ dưỡng", "giải tỏa", "trò chơi", "tour"],
            "Mua sắm": ["mua", "sắm", "quần áo", "giày dép", "thời trang", "điện thoại", "laptop", "đồ điện tử", "trang phục", "túi xách", "trang sức", "phụ kiện", "mỹ phẩm"],
            "Tiện ích": ["điện", "nước", "gas", "internet", "điện thoại", "hóa đơn", "thuê nhà", "sửa chữa", "wifi", "đăng ký", "phí", "thuê", "bảo hiểm", "khám bệnh", "thuốc"]
        }
    },
    
    // Cache settings
    CACHE: {
        // Maximum number of items to process in one batch
        MAX_BATCH_SIZE: 10,
        // Enable/disable persistent cache
        ENABLE_PERSISTENT_CACHE: true,
        // LocalStorage key for category cache
        CATEGORY_CACHE_KEY: 'cafethu6_category_cache',
        // Maximum age for cache entries in days
        CACHE_MAX_AGE_DAYS: 30
    }
}; 
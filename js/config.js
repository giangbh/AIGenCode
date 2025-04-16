/**
 * Application Configuration
 * Store all environment variables and configuration settings here
 */

export const CONFIG = {
    // API Keys
    API_KEYS: {
        GEMINI: 'XXX', // Replace with your Gemini API key
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
            "Khác"
        ]
    },
    
    // Cache settings
    CACHE: {
        // Maximum number of items to process in one batch
        MAX_BATCH_SIZE: 10,
    }
}; 
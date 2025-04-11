/**
 * Authentication Utility for CafeThu6
 * Handles authentication and session management
 */

import { supabase } from './supabase.js';
import { showMessage } from './helpers.js';

// Fixed password for all users
const FIXED_PASSWORD = 'Cafe';

/**
 * Check if user is currently logged in
 * @returns {boolean} True if user is logged in
 */
export function isLoggedIn() {
    return !!getLoggedInUser();
}

/**
 * Get the currently logged in user
 * @returns {string|null} Username of logged in user or null if not logged in
 */
export function getLoggedInUser() {
    return localStorage.getItem('cafethu6_current_user');
}

/**
 * Get the role of currently logged in user
 * @returns {string|null} Role of logged in user or null if not logged in
 */
export function getUserRole() {
    return localStorage.getItem('cafethu6_user_role');
}

/**
 * Check if current user is an admin
 * @returns {boolean} True if user is logged in and has admin role
 */
export function isAdmin() {
    return getUserRole() === 'admin';
}

/**
 * Attempt to login with the given credentials
 * @param {string} username Username (must match a member name)
 * @param {string} password Password (should match fixed password)
 * @returns {Promise<{success: boolean, message: string}>} Login result
 */
export async function login(username, password) {
    try {
        // Validate username
        if (!username || typeof username !== 'string' || username.trim() === '') {
            return { success: false, message: 'Vui lòng nhập tên đăng nhập' };
        }
        
        // Validate password
        if (!password || password !== FIXED_PASSWORD) {
            return { success: false, message: 'Mật khẩu không đúng' };
        }
        
        // Check if username exists in members and get role
        const { data: members, error } = await supabase
            .from('members')
            .select('name, role')
            .eq('name', username);
            
        if (error) {
            console.error('Lỗi khi kiểm tra thành viên:', error);
            return { success: false, message: 'Lỗi kết nối đến cơ sở dữ liệu' };
        }
        
        if (!members || members.length === 0) {
            return { success: false, message: 'Tên đăng nhập không tồn tại' };
        }
        
        // Set logged in user and role
        localStorage.setItem('cafethu6_current_user', username);
        localStorage.setItem('cafethu6_user_role', members[0].role || 'member');
        
        return { success: true, message: `Đăng nhập thành công với tên ${username}` };
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        return { success: false, message: 'Lỗi không xác định khi đăng nhập' };
    }
}

/**
 * Logout the current user
 * @returns {boolean} True if logout successful
 */
export function logout() {
    localStorage.removeItem('cafethu6_current_user');
    localStorage.removeItem('cafethu6_user_role');
    return true;
}

/**
 * Initialize the login UI and functionality
 */
export function initAuth() {
    const loginModal = document.getElementById('login-modal-backdrop');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const loginButton = document.getElementById('login-button');
    const currentUserDisplay = document.getElementById('current-user-display');
    const logoutButton = document.getElementById('logout-button');
    
    // If user is already logged in, update UI
    if (isLoggedIn()) {
        updateAuthUI();
    } else {
        // Show login modal if not logged in
        loginModal.classList.remove('hidden');
    }
    
    // Login form submission
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Clear previous errors
        loginError.textContent = '';
        loginError.classList.add('hidden');
        
        // Set button to loading state
        loginButton.disabled = true;
        loginButton.innerHTML = '<i data-lucide="loader" class="animate-spin w-4 h-4 mr-1"></i> Đang đăng nhập...';
        
        // Attempt login
        const result = await login(usernameInput.value, passwordInput.value);
        
        // Reset button state
        loginButton.disabled = false;
        loginButton.innerHTML = '<i data-lucide="log-in" class="w-4 h-4 mr-1"></i> Đăng nhập';
        
        if (result.success) {
            // Hide modal
            loginModal.classList.add('hidden');
            
            // Update UI
            updateAuthUI();
            
            // Show success message
            showMessage(result.message, 'success');
            
            // Refresh icons
            lucide.createIcons();
        } else {
            // Show error
            loginError.textContent = result.message;
            loginError.classList.remove('hidden');
        }
    });
    
    // Logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            logout();
            updateAuthUI();
            
            // Show login modal
            loginModal.classList.remove('hidden');
            
            // Show logout message
            showMessage('Đã đăng xuất thành công', 'info');
        });
    }
    
    // Initialize Lucide icons
    lucide.createIcons();
}

/**
 * Update the UI based on authentication state
 */
export function updateAuthUI() {
    const currentUser = getLoggedInUser();
    const currentUserDisplay = document.getElementById('current-user-display');
    const loginModal = document.getElementById('login-modal-backdrop');
    const clearAllDataBtn = document.getElementById('clear-all-data-btn');
    
    if (currentUser) {
        // User is logged in, update display
        if (currentUserDisplay) {
            currentUserDisplay.textContent = currentUser;
            currentUserDisplay.parentElement.classList.remove('hidden');
        }
        
        // Update all current-user-name elements with the username
        document.querySelectorAll('.current-user-name').forEach(el => {
            el.textContent = currentUser;
        });
        
        // Show all user indicators
        document.querySelectorAll('.current-user-indicator').forEach(el => {
            el.classList.remove('hidden');
        });
        
        // Only show Clear All Data button if user is admin
        if (clearAllDataBtn) {
            if (isAdmin()) {
                clearAllDataBtn.classList.remove('hidden');
            } else {
                clearAllDataBtn.classList.add('hidden');
            }
        }
        
        // Hide login modal
        if (loginModal) {
            loginModal.classList.add('hidden');
        }
        
        // Show welcome message if this is a new login (not page refresh)
        const isNewLogin = !localStorage.getItem('cafethu6_login_shown');
        if (isNewLogin) {
            showMessage(`Chào mừng ${currentUser} đã đăng nhập vào hệ thống`, 'success');
            localStorage.setItem('cafethu6_login_shown', 'true');
            
            // Clear the flag after 5 seconds to allow showing again on next login
            setTimeout(() => {
                localStorage.removeItem('cafethu6_login_shown');
            }, 5000);
        }
    } else {
        // User is not logged in
        if (currentUserDisplay) {
            currentUserDisplay.parentElement.classList.add('hidden');
        }
        
        // Hide all user indicators
        document.querySelectorAll('.current-user-indicator').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Hide Clear All Data button
        if (clearAllDataBtn) {
            clearAllDataBtn.classList.add('hidden');
        }
        
        // Show login modal
        if (loginModal) {
            loginModal.classList.remove('hidden');
        }
        
        // Clear login shown flag
        localStorage.removeItem('cafethu6_login_shown');
    }
} 
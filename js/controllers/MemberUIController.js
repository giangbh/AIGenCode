/**
 * MemberUIController
 * Handles UI operations related to member management
 */

import { UIController } from './UIController.js';
import { showMessage } from '../utils/helpers.js';
import { isAdmin } from '../utils/auth.js';

export class MemberUIController extends UIController {
    /**
     * Create a new MemberUIController
     * @param {App} app - The main application instance
     */
    constructor(app) {
        super(app);
        
        // DOM Elements
        this.membersList = document.getElementById('members-list');
        this.addMemberBtn = document.getElementById('add-member-btn');
        
        // Initialize UI
        this.initUI();
    }
    
    /**
     * Initialize member UI
     */
    initUI() {
        // Add event listeners for add member button
        if (this.addMemberBtn) {
            this.addMemberBtn.addEventListener('click', () => this.handleAddMemberModalOpen());
        }
    }
    
    /**
     * Render members list
     */
    renderMembers() {
        if (!this.membersList) return;
        
        const members = this.app.memberManager.getAllMembers();
        const bankAccounts = this.app.memberManager.getAllBankAccounts();
        
        this.membersList.innerHTML = '';
        
        // Show no members message if there are no members
        const noMembersMessage = document.getElementById('no-members-message');
        if (members.length === 0) {
            if (noMembersMessage) {
                noMembersMessage.classList.remove('hidden');
                this.membersList.appendChild(noMembersMessage);
            }
            return;
        } else if (noMembersMessage) {
            noMembersMessage.classList.add('hidden');
        }
        
        members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between mb-3';
            
            const memberInfo = document.createElement('div');
            memberInfo.className = 'flex-1';
            
            const name = document.createElement('h4');
            name.className = 'text-lg font-medium text-gray-800';
            name.textContent = member;
            
            const account = document.createElement('p');
            account.className = 'text-sm text-gray-600';
            account.textContent = `Số tài khoản: ${bankAccounts[member] || 'Chưa có'}`;
            
            memberInfo.appendChild(name);
            memberInfo.appendChild(account);
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'flex space-x-2';
            
            const editButton = document.createElement('button');
            editButton.className = 'bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center';
            editButton.innerHTML = '<i data-lucide="edit" class="w-4 h-4 mr-1"></i>Sửa';
            editButton.addEventListener('click', () => this.handleEditMemberModalOpen(member));
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center';
            deleteButton.innerHTML = '<i data-lucide="trash" class="w-4 h-4 mr-1"></i>Xóa';
            deleteButton.addEventListener('click', () => this.handleDeleteMember(member));
            
            buttonsContainer.appendChild(editButton);
            
            // Only show delete button if user is admin
            if (isAdmin()) {
                buttonsContainer.appendChild(deleteButton);
            }
            
            memberDiv.appendChild(memberInfo);
            memberDiv.appendChild(buttonsContainer);
            
            this.membersList.appendChild(memberDiv);
        });
        
        // Initialize Lucide icons for the newly created buttons
        lucide.createIcons();
    }
    
    /**
     * Create a modal element
     * @param {string} title - Modal title
     * @param {string} content - Modal content HTML
     * @returns {HTMLElement} The modal element
     */
    createModal(title, content) {
        // Create modal backdrop
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4';
        
        // Modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'px-6 py-4 border-b border-gray-200';
        
        const modalTitle = document.createElement('h3');
        modalTitle.className = 'text-lg font-semibold text-gray-800';
        modalTitle.textContent = title;
        
        modalHeader.appendChild(modalTitle);
        
        // Modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'px-6 py-4';
        modalBody.innerHTML = content;
        
        // Modal footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'px-6 py-4 border-t border-gray-200 flex justify-end space-x-2';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md';
        cancelButton.textContent = 'Hủy';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modalBackdrop);
        });
        
        const confirmButton = document.createElement('button');
        confirmButton.className = 'px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md';
        confirmButton.textContent = 'Xác nhận';
        confirmButton.id = 'modal-confirm-button';
        
        modalFooter.appendChild(cancelButton);
        modalFooter.appendChild(confirmButton);
        
        // Assemble modal
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(modalBody);
        modalContainer.appendChild(modalFooter);
        modalBackdrop.appendChild(modalContainer);
        
        return modalBackdrop;
    }
    
    /**
     * Handle opening the add member modal
     */
    handleAddMemberModalOpen() {
        const modalContent = `
            <div class="space-y-4">
                <div>
                    <label for="new-member-name" class="block text-sm font-medium text-gray-700 mb-1">Tên thành viên:</label>
                    <input type="text" id="new-member-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                    <label for="new-member-account" class="block text-sm font-medium text-gray-700 mb-1">Số tài khoản (không bắt buộc):</label>
                    <input type="text" id="new-member-account" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
            </div>
        `;
        
        const modal = this.createModal('Thêm thành viên mới', modalContent);
        document.body.appendChild(modal);
        
        // Focus on the name input
        setTimeout(() => {
            document.getElementById('new-member-name').focus();
        }, 100);
        
        // Handle confirm button
        const confirmButton = document.getElementById('modal-confirm-button');
        confirmButton.addEventListener('click', async () => {
            const name = document.getElementById('new-member-name').value.trim();
            const account = document.getElementById('new-member-account').value.trim();
            
            if (!name) {
                showMessage('Vui lòng nhập tên thành viên', 'error');
                return;
            }
            
            // Validate account number if provided
            if (account && !/^\d+$/.test(account)) {
                showMessage('Số tài khoản chỉ được chứa chữ số', 'error');
                return;
            }
            
            // Show loading state
            confirmButton.disabled = true;
            confirmButton.textContent = 'Đang xử lý...';
            
            try {
                const success = await this.app.memberManager.addMember(name, account);
                
                if (success) {
                    document.body.removeChild(modal);
                    
                    // Update UI
                    this.renderMembers();
                    
                    // Update member lists in other UI controllers
                    if (this.app.expenseUI) {
                        this.app.expenseUI.populateMembers();
                    }
                    
                    if (this.app.fundUI) {
                        this.app.fundUI.populateDepositMemberSelect();
                    }
                    
                    showMessage(`Đã thêm thành viên mới: ${name}`);
                } else {
                    showMessage(`Thành viên ${name} đã tồn tại hoặc không hợp lệ`, 'error');
                    confirmButton.disabled = false;
                    confirmButton.textContent = 'Xác nhận';
                }
            } catch (error) {
                console.error('Lỗi khi thêm thành viên:', error);
                showMessage('Đã xảy ra lỗi khi thêm thành viên', 'error');
                confirmButton.disabled = false;
                confirmButton.textContent = 'Xác nhận';
            }
        });
    }
    
    /**
     * Handle opening the edit member modal
     * @param {string} member - The member to edit
     */
    handleEditMemberModalOpen(member) {
        const currentAccount = this.app.memberManager.getMemberBankAccount(member);
        
        const modalContent = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên thành viên:</label>
                    <input type="text" id="edit-member-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-100" value="${member}" disabled>
                </div>
                <div>
                    <label for="edit-member-account" class="block text-sm font-medium text-gray-700 mb-1">Số tài khoản:</label>
                    <input type="text" id="edit-member-account" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" value="${currentAccount || ''}">
                </div>
            </div>
        `;
        
        const modal = this.createModal(`Chỉnh sửa thành viên: ${member}`, modalContent);
        document.body.appendChild(modal);
        
        // Focus on the account input
        setTimeout(() => {
            document.getElementById('edit-member-account').focus();
        }, 100);
        
        // Handle confirm button
        const confirmButton = document.getElementById('modal-confirm-button');
        confirmButton.addEventListener('click', async () => {
            const account = document.getElementById('edit-member-account').value.trim();
            
            // Validate account number
            if (!/^\d+$/.test(account)) {
                showMessage('Số tài khoản chỉ được chứa chữ số', 'error');
                return;
            }
            
            // Show loading state
            confirmButton.disabled = true;
            confirmButton.textContent = 'Đang xử lý...';
            
            try {
                const success = await this.app.memberManager.updateMemberAccount(member, account);
                
                if (success) {
                    document.body.removeChild(modal);
                    this.renderMembers();
                    showMessage(`Đã cập nhật số tài khoản cho ${member}`);
                } else {
                    showMessage(`Không thể cập nhật tài khoản cho ${member}`, 'error');
                    confirmButton.disabled = false;
                    confirmButton.textContent = 'Xác nhận';
                }
            } catch (error) {
                console.error('Lỗi khi cập nhật tài khoản:', error);
                showMessage('Đã xảy ra lỗi khi cập nhật tài khoản', 'error');
                confirmButton.disabled = false;
                confirmButton.textContent = 'Xác nhận';
            }
        });
    }
    
    /**
     * Handle deleting a member
     * @param {string} member - The member to delete
     */
    async handleDeleteMember(member) {
        const confirmed = confirm(`Bạn có chắc chắn muốn xóa thành viên ${member}? Thao tác này không thể hoàn tác.`);
        
        if (confirmed) {
            try {
                const success = await this.app.memberManager.removeMember(member);
                
                if (success) {
                    // Update UI
                    this.renderMembers();
                    
                    // Update member lists in other UI controllers
                    if (this.app.expenseUI) {
                        this.app.expenseUI.populateMembers();
                    }
                    
                    if (this.app.fundUI) {
                        this.app.fundUI.populateDepositMemberSelect();
                    }
                    
                    showMessage(`Đã xóa thành viên: ${member}`);
                } else {
                    showMessage(`Không thể xóa thành viên ${member}`, 'error');
                }
            } catch (error) {
                console.error('Lỗi khi xóa thành viên:', error);
                showMessage('Đã xảy ra lỗi khi xóa thành viên', 'error');
            }
        }
    }
} 
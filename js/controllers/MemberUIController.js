/**
 * MemberUIController
 * Handles UI operations related to member management
 */

import { UIController } from './UIController.js';
import { showMessage } from '../utils/helpers.js';

export class MemberUIController extends UIController {
    /**
     * Create a new MemberUIController
     * @param {App} app - The main application instance
     */
    constructor(app) {
        super(app);
        
        // DOM Elements
        this.membersList = document.getElementById('members-list');
        
        // Initialize UI
        this.initUI();
    }
    
    /**
     * Initialize member UI
     */
    initUI() {
        // Add event listeners, if any
    }
    
    /**
     * Render members list
     */
    renderMembers() {
        if (!this.membersList) return;
        
        const members = this.app.memberManager.getAllMembers();
        const bankAccounts = this.app.memberManager.getAllBankAccounts();
        
        this.membersList.innerHTML = '';
        
        members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between';
            
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
            
            const editButton = document.createElement('button');
            editButton.className = 'bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center';
            editButton.innerHTML = '<i data-lucide="edit" class="w-4 h-4 mr-1"></i>Sửa';
            editButton.addEventListener('click', () => this.handleEditMember(member));
            
            memberDiv.appendChild(memberInfo);
            memberDiv.appendChild(editButton);
            
            this.membersList.appendChild(memberDiv);
        });
        
        // Initialize Lucide icons for the newly created buttons
        lucide.createIcons();
    }
    
    /**
     * Handle editing a member's bank account
     * @param {string} member - The member to edit
     */
    handleEditMember(member) {
        const currentAccount = this.app.memberManager.getMemberBankAccount(member);
        const newAccount = prompt(`Nhập số tài khoản mới cho ${member}:`, currentAccount || '');
        
        if (newAccount !== null) {
            if (newAccount.trim() === '') {
                showMessage('Số tài khoản không được để trống', 'error');
                return;
            }
            
            if (!/^\d+$/.test(newAccount)) {
                showMessage('Số tài khoản chỉ được chứa chữ số', 'error');
                return;
            }
            
            this.app.memberManager.updateMemberAccount(member, newAccount);
            this.renderMembers();
            showMessage(`Đã cập nhật số tài khoản cho ${member}`);
        }
    }
    
    /**
     * Handle adding a new member (for future implementation)
     */
    handleAddMember() {
        const name = prompt('Nhập tên thành viên mới:');
        if (!name || name.trim() === '') {
            showMessage('Tên thành viên không được để trống', 'error');
            return;
        }
        
        const accountNumber = prompt(`Nhập số tài khoản cho ${name}:`, '');
        
        // Validate account number if provided
        if (accountNumber && !/^\d+$/.test(accountNumber)) {
            showMessage('Số tài khoản chỉ được chứa chữ số', 'error');
            return;
        }
        
        const success = this.app.memberManager.addMember(name.trim(), accountNumber);
        
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
            
            showMessage(`Đã thêm thành viên mới: ${name}`);
        } else {
            showMessage(`Thành viên ${name} đã tồn tại hoặc không hợp lệ`, 'error');
        }
    }
} 
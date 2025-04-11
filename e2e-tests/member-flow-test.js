/**
 * End-to-End tests for member management flow
 */

import * as helper from './test-helpers.js';

describe('Member Management Flow', () => {
    beforeEach(async () => {
        // Reset application data before each test
        await helper.resetAppData();
        
        // Make sure we're on the members tab
        helper.switchToTab('members');
    });
    
    it('should display the default members', async () => {
        // Verify the default members are shown
        const membersList = helper.getAppDocument().querySelectorAll('#members-list .member-item');
        
        // The default members are: Giang, Quân, Toàn, Quang, Trung, Nhật
        expect(membersList.length).to.equal(6);
        
        // Check specific members
        const memberNames = Array.from(membersList).map(item => 
            item.querySelector('.member-name').textContent.trim()
        );
        
        expect(memberNames).to.include('Giang');
        expect(memberNames).to.include('Quân');
        expect(memberNames).to.include('Toàn');
        expect(memberNames).to.include('Quang');
        expect(memberNames).to.include('Trung');
        expect(memberNames).to.include('Nhật');
    });
    
    it('should add a new member', async () => {
        // Fill out the new member form
        helper.fillInput('#new-member-name', 'Hùng');
        helper.fillInput('#new-member-account', '1234567890');
        
        // Submit the form
        helper.submitForm('#add-member-form');
        
        // Wait for member to be added
        await helper.waitFor(() => {
            const membersList = helper.getAppDocument().querySelectorAll('#members-list .member-item');
            return membersList.length === 7; // 6 default + 1 new
        });
        
        // Verify the new member is shown
        const membersList = helper.getAppDocument().querySelectorAll('#members-list .member-item');
        const memberNames = Array.from(membersList).map(item => 
            item.querySelector('.member-name').textContent.trim()
        );
        
        expect(memberNames).to.include('Hùng');
        
        // Verify the new member's bank account
        const hungMember = Array.from(membersList).find(item => 
            item.querySelector('.member-name').textContent.trim() === 'Hùng'
        );
        
        expect(hungMember.querySelector('.member-account').textContent).to.include('1234567890');
    });
    
    it('should edit a member\'s bank account', async () => {
        // Find Giang's member item
        const memberItems = helper.getAppDocument().querySelectorAll('#members-list .member-item');
        const giangItem = Array.from(memberItems).find(item => 
            item.querySelector('.member-name').textContent.trim() === 'Giang'
        );
        
        // Get original account number
        const originalAccount = giangItem.querySelector('.member-account').textContent.trim();
        
        // Click the edit button for Giang
        giangItem.querySelector('.edit-member-btn').click();
        
        // Wait for edit form to appear
        await helper.waitForElement('#edit-member-form');
        
        // Change the account number
        helper.fillInput('#edit-member-account', '9999888877');
        
        // Submit the edit form
        helper.submitForm('#edit-member-form');
        
        // Wait for changes to apply
        await helper.waitFor(() => {
            const updatedGiangItem = Array.from(helper.getAppDocument().querySelectorAll('#members-list .member-item'))
                .find(item => item.querySelector('.member-name').textContent.trim() === 'Giang');
            
            const updatedAccount = updatedGiangItem.querySelector('.member-account').textContent.trim();
            return updatedAccount.includes('9999888877');
        });
        
        // Verify the account was updated
        const updatedGiangItem = Array.from(helper.getAppDocument().querySelectorAll('#members-list .member-item'))
            .find(item => item.querySelector('.member-name').textContent.trim() === 'Giang');
        
        const updatedAccount = updatedGiangItem.querySelector('.member-account').textContent.trim();
        expect(updatedAccount).to.include('9999888877');
    });
    
    it('should delete a member', async () => {
        // Count initial members
        const initialMemberCount = helper.getAppDocument().querySelectorAll('#members-list .member-item').length;
        expect(initialMemberCount).to.equal(6);
        
        // Find Nhật's member item
        const memberItems = helper.getAppDocument().querySelectorAll('#members-list .member-item');
        const nhatItem = Array.from(memberItems).find(item => 
            item.querySelector('.member-name').textContent.trim() === 'Nhật'
        );
        
        // Mock the confirm dialog to return true
        helper.getAppWindow().confirm = () => true;
        
        // Click the delete button
        nhatItem.querySelector('.delete-member-btn').click();
        
        // Wait for member to be removed
        await helper.waitFor(() => {
            const currentMemberCount = helper.getAppDocument().querySelectorAll('#members-list .member-item').length;
            return currentMemberCount === 5;
        });
        
        // Verify the member was removed
        const updatedMemberItems = helper.getAppDocument().querySelectorAll('#members-list .member-item');
        const memberNames = Array.from(updatedMemberItems).map(item => 
            item.querySelector('.member-name').textContent.trim()
        );
        
        expect(memberNames).not.to.include('Nhật');
        expect(updatedMemberItems.length).to.equal(5);
    });
    
    it('should validate member name when adding', async () => {
        // Try to add a member with an empty name
        helper.fillInput('#new-member-name', '');
        helper.fillInput('#new-member-account', '1234567890');
        
        // Submit the form
        helper.submitForm('#add-member-form');
        
        // Member count should still be 6
        const memberCount = helper.getAppDocument().querySelectorAll('#members-list .member-item').length;
        expect(memberCount).to.equal(6);
    });
    
    it('should prevent adding a duplicate member name', async () => {
        // Try to add a member with an existing name
        helper.fillInput('#new-member-name', 'Giang'); // already exists
        helper.fillInput('#new-member-account', '1234567890');
        
        // Submit the form
        helper.submitForm('#add-member-form');
        
        // Member count should still be 6
        const memberCount = helper.getAppDocument().querySelectorAll('#members-list .member-item').length;
        expect(memberCount).to.equal(6);
    });
    
    it('should update the member dropdown in other tabs', async () => {
        // Add a new member
        helper.fillInput('#new-member-name', 'Hoàng');
        helper.fillInput('#new-member-account', '5556667777');
        helper.submitForm('#add-member-form');
        
        // Wait for the member to be added
        await helper.waitFor(() => {
            const memberCount = helper.getAppDocument().querySelectorAll('#members-list .member-item').length;
            return memberCount === 7;
        });
        
        // Switch to expense tab
        helper.switchToTab('expenses');
        
        // Check that the new member appears in the payer dropdown
        const payerSelect = helper.getAppDocument().querySelector('#payer');
        const options = Array.from(payerSelect.querySelectorAll('option'));
        const optionValues = options.map(opt => opt.value);
        
        expect(optionValues).to.include('Hoàng');
        
        // Check that the member appears in participants list
        const participantsList = helper.getAppDocument().querySelector('#participants-list');
        const participantLabels = Array.from(participantsList.querySelectorAll('label'));
        const participantNames = participantLabels.map(label => label.textContent.trim());
        
        expect(participantNames).to.include('Hoàng');
    });
}); 
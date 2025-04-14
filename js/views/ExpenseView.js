class ExpenseView {
  constructor(controller) {
    this.controller = controller;
    this.expenseForm = document.getElementById('expense-form-container');
    this.expenseList = document.getElementById('expense-list');
    this.balanceSummary = document.getElementById('balance-summary');
    this.setupEventListeners();
  }

  renderExpenseForm() {
    const formTitle = this.editingExpenseId ? 'Sửa chi tiêu' : 'Thêm chi tiêu mới';
    
    // Lấy danh sách đề xuất từ ExpenseManager
    const suggestions = this.controller.expenseManager.getExpenseSuggestions();
    
    // Tạo HTML cho phần gợi ý
    let suggestionsHtml = '';
    if (suggestions.length > 0) {
      suggestionsHtml = `
        <div class="suggestions-container">
          <h4>Gợi ý từ lịch sử chi tiêu:</h4>
          <div class="suggestion-list">
            ${suggestions.map(suggestion => `
              <div class="suggestion-item" data-name="${suggestion.name}" data-amount="${suggestion.amount}">
                <div class="suggestion-name">${suggestion.name}</div>
                <div class="suggestion-amount">${this.formatCurrency(suggestion.amount)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // Form HTML
    const formHtml = `
      <div class="expense-form-container">
        <h3 id="form-title">${formTitle}</h3>
        
        ${suggestionsHtml}
        
        <form id="expense-form">
          <!-- Existing form fields -->
          <!-- ... -->
        </form>
      </div>
    `;
    
    this.expenseForm.innerHTML = formHtml;
    
    // Add event listeners to suggestion items
    const suggestionItems = this.expenseForm.querySelectorAll('.suggestion-item');
    suggestionItems.forEach(item => {
      item.addEventListener('click', () => {
        const name = item.getAttribute('data-name');
        const amount = item.getAttribute('data-amount');
        
        // Populate form fields with suggestion
        document.getElementById('expense-name').value = name;
        document.getElementById('expense-amount').value = amount;
        
        // Highlight the selected suggestion
        suggestionItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
    
    // Existing code to set up form
    // ...
  }
  
  // ... other existing methods ...
} 
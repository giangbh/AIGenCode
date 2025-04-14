/**
 * Supabase Client for CafeThu6
 * Handles connection and data operations with Supabase
 */

// Thay đổi các giá trị này bằng thông tin từ dự án Supabase của bạn
const SUPABASE_URL = 'https://nvcmmagmyowkuvqjrirf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y21tYWdteW93a3V2cWpyaXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMzgyNTgsImV4cCI6MjA1OTkxNDI1OH0.2ZuI36vMIB-vK76ZkwRJSDL3O7IpBkjUK-vPxv0PufA';

// Khởi tạo Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export supabase client for use in other modules
export { supabase };

/**
 * Lấy tất cả thành viên từ Supabase
 * @returns {Promise<Array>} Danh sách thành viên
 */
export async function getMembers() {
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Lỗi khi lấy danh sách thành viên:', error);
        return [];
    }
    
    return data;
}

/**
 * Thêm thành viên mới vào Supabase
 * @param {string} name Tên thành viên
 * @param {string} bankAccount Số tài khoản ngân hàng
 * @param {string} role Vai trò của thành viên (default: 'member')
 * @returns {Promise<Object>} Thành viên được thêm
 */
export async function addMember(name, bankAccount, role = 'member') {
    const { data, error } = await supabase
        .from('members')
        .insert([{ 
            name: name, 
            bank_account: bankAccount,
            role: role
        }])
        .select();
    
    if (error) {
        console.error('Lỗi khi thêm thành viên:', error);
        throw new Error(`Không thể thêm thành viên: ${error.message}`);
    }
    
    return data[0];
}

/**
 * Cập nhật thông tin thành viên
 * @param {string} name Tên thành viên
 * @param {string} bankAccount Số tài khoản ngân hàng mới
 * @returns {Promise<Object>} Thành viên đã cập nhật
 */
export async function updateMember(name, bankAccount) {
    const { data, error } = await supabase
        .from('members')
        .update({ bank_account: bankAccount })
        .eq('name', name)
        .select();
    
    if (error) {
        console.error('Lỗi khi cập nhật thành viên:', error);
        throw new Error(`Không thể cập nhật thành viên: ${error.message}`);
    }
    
    return data[0];
}

/**
 * Xóa thành viên
 * @param {string} name Tên thành viên
 * @returns {Promise<boolean>} Kết quả xóa
 */
export async function deleteMember(name) {
    const { error } = await supabase
        .from('members')
        .delete()
        .eq('name', name);
    
    if (error) {
        console.error('Lỗi khi xóa thành viên:', error);
        throw new Error(`Không thể xóa thành viên: ${error.message}`);
    }
    
    return true;
}

/**
 * Lấy tất cả chi tiêu từ Supabase
 * @returns {Promise<Array>} Danh sách chi tiêu
 */
export async function getExpenses() {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Lỗi khi lấy danh sách chi tiêu:', error);
        return [];
    }
    
    // Chuyển đổi dữ liệu từ định dạng DB sang định dạng ứng dụng
    return data.map(expense => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
        payer: expense.payer,
        participants: expense.participants,
        equalSplit: expense.equal_split,
        splits: expense.splits || {}
    }));
}

/**
 * Lấy chi tiêu với phân trang từ Supabase
 * @param {number} page - Số trang (bắt đầu từ 1)
 * @param {number} perPage - Số mục trên mỗi trang
 * @param {string} sortBy - Trường để sắp xếp theo
 * @param {boolean} descending - Có sắp xếp theo thứ tự giảm dần không
 * @returns {Promise<Object>} Kết quả phân trang
 */
export async function getPaginatedExpenses(page = 1, perPage = 5, sortBy = 'date', descending = true) {
    // Xác định trường sắp xếp
    let orderField = 'created_at';
    if (sortBy === 'date') orderField = 'date';
    else if (sortBy === 'amount') orderField = 'amount';
    else if (sortBy === 'name') orderField = 'name';
    
    // Tính toán từng mục bắt đầu và kết thúc
    const startIndex = (page - 1) * perPage;
    
    // Đầu tiên, lấy tổng số chi tiêu để tính tổng số trang
    const countResult = await supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true });
    
    if (countResult.error) {
        console.error('Lỗi khi đếm chi tiêu:', countResult.error);
        return { items: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0 } };
    }
    
    const totalItems = countResult.count;
    
    // Sau đó lấy dữ liệu cho trang hiện tại
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order(orderField, { ascending: !descending })
        .range(startIndex, startIndex + perPage - 1);
    
    if (error) {
        console.error('Lỗi khi lấy danh sách chi tiêu phân trang:', error);
        return { items: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0 } };
    }
    
    // Chuyển đổi dữ liệu từ định dạng DB sang định dạng ứng dụng
    const items = data.map(expense => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
        payer: expense.payer,
        participants: expense.participants,
        equalSplit: expense.equal_split,
        splits: expense.splits || {}
    }));
    
    // Tính toán chi tiết phân trang
    const totalPages = Math.ceil(totalItems / perPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const endIndex = Math.min(startIndex + items.length, totalItems);
    
    return {
        items,
        pagination: {
            currentPage,
            perPage,
            totalItems,
            totalPages,
            startIndex,
            endIndex
        }
    };
}

/**
 * Thêm chi tiêu mới
 * @param {Object} expense Dữ liệu chi tiêu
 * @returns {Promise<Object>} Chi tiêu được thêm
 */
export async function addExpense(expense) {
    const { data, error } = await supabase
        .from('expenses')
        .insert([{
            name: expense.name,
            amount: expense.amount,
            date: expense.date,
            payer: expense.payer,
            participants: expense.participants,
            equal_split: expense.equalSplit,
            splits: expense.equalSplit ? null : expense.splits
        }])
        .select();
    
    if (error) {
        console.error('Lỗi khi thêm chi tiêu:', error);
        throw new Error(`Không thể thêm chi tiêu: ${error.message}`);
    }
    
    // Chuyển đổi từ định dạng DB sang định dạng ứng dụng
    return {
        id: data[0].id,
        name: data[0].name,
        amount: data[0].amount,
        date: data[0].date,
        payer: data[0].payer,
        participants: data[0].participants,
        equalSplit: data[0].equal_split,
        splits: data[0].splits || {}
    };
}

/**
 * Cập nhật chi tiêu
 * @param {string} id ID của chi tiêu
 * @param {Object} expense Dữ liệu chi tiêu mới
 * @returns {Promise<Object>} Chi tiêu đã cập nhật
 */
export async function updateExpense(id, expense) {
    const { data, error } = await supabase
        .from('expenses')
        .update({
            name: expense.name,
            amount: expense.amount,
            date: expense.date,
            payer: expense.payer,
            participants: expense.participants,
            equal_split: expense.equalSplit,
            splits: expense.equalSplit ? null : expense.splits
        })
        .eq('id', id)
        .select();
    
    if (error) {
        console.error('Lỗi khi cập nhật chi tiêu:', error);
        throw new Error(`Không thể cập nhật chi tiêu: ${error.message}`);
    }
    
    // Chuyển đổi từ định dạng DB sang định dạng ứng dụng
    return {
        id: data[0].id,
        name: data[0].name,
        amount: data[0].amount,
        date: data[0].date,
        payer: data[0].payer,
        participants: data[0].participants,
        equalSplit: data[0].equal_split,
        splits: data[0].splits || {}
    };
}

/**
 * Xóa chi tiêu
 * @param {string} id ID của chi tiêu
 * @returns {Promise<boolean>} Kết quả xóa
 */
export async function deleteExpense(id) {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Lỗi khi xóa chi tiêu:', error);
        throw new Error(`Không thể xóa chi tiêu: ${error.message}`);
    }
    
    return true;
}

/**
 * Lấy tất cả giao dịch quỹ
 * @returns {Promise<Array>} Danh sách giao dịch
 */
export async function getFundTransactions() {
    const { data, error } = await supabase
        .from('fund_transactions')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Lỗi khi lấy danh sách giao dịch quỹ:', error);
        return [];
    }
    
    // Chuyển đổi dữ liệu từ định dạng DB sang định dạng ứng dụng
    return data.map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        member: transaction.member,
        note: transaction.note,
        expenseId: transaction.expense_id,
        expenseName: transaction.expense_name
    }));
}

/**
 * Thêm giao dịch nộp quỹ
 * @param {string} member Thành viên nộp quỹ
 * @param {number} amount Số tiền
 * @param {string} date Ngày nộp (YYYY-MM-DD)
 * @param {string} note Ghi chú
 * @returns {Promise<Object>} Giao dịch được thêm
 */
export async function addDeposit(member, amount, date, note = '') {
    const { data, error } = await supabase
        .from('fund_transactions')
        .insert([{
            type: 'deposit',
            amount: amount,
            date: date,
            member: member,
            note: note
        }])
        .select();
    
    if (error) {
        console.error('Lỗi khi thêm khoản nộp quỹ:', error);
        throw new Error(`Không thể thêm khoản nộp quỹ: ${error.message}`);
    }
    
    // Chuyển đổi từ định dạng DB sang định dạng ứng dụng
    return {
        id: data[0].id,
        type: data[0].type,
        amount: data[0].amount,
        date: data[0].date,
        member: data[0].member,
        note: data[0].note
    };
}

/**
 * Thêm giao dịch chi tiêu từ quỹ
 * @param {string} expenseId ID của chi tiêu
 * @param {string} expenseName Tên chi tiêu
 * @param {number} amount Số tiền
 * @param {string} date Ngày chi (YYYY-MM-DD)
 * @returns {Promise<Object>} Giao dịch được thêm
 */
export async function addExpenseTransaction(expenseId, expenseName, amount, date) {
    const { data, error } = await supabase
        .from('fund_transactions')
        .insert([{
            type: 'expense',
            amount: amount,
            date: date,
            expense_id: expenseId,
            expense_name: expenseName
        }])
        .select();
    
    if (error) {
        console.error('Lỗi khi thêm giao dịch chi tiêu:', error);
        throw new Error(`Không thể thêm giao dịch chi tiêu: ${error.message}`);
    }
    
    // Chuyển đổi từ định dạng DB sang định dạng ứng dụng
    return {
        id: data[0].id,
        type: data[0].type,
        amount: data[0].amount,
        date: data[0].date,
        expenseId: data[0].expense_id,
        expenseName: data[0].expense_name
    };
}

/**
 * Xóa giao dịch quỹ
 * @param {string} id ID của giao dịch
 * @returns {Promise<boolean>} Kết quả xóa
 */
export async function deleteFundTransaction(id) {
    const { error } = await supabase
        .from('fund_transactions')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Lỗi khi xóa giao dịch quỹ:', error);
        throw new Error(`Không thể xóa giao dịch quỹ: ${error.message}`);
    }
    
    return true;
}

/**
 * Xóa giao dịch quỹ liên quan đến chi tiêu
 * @param {string} expenseId ID của chi tiêu
 * @returns {Promise<boolean>} Kết quả xóa
 */
export async function deleteExpenseTransactions(expenseId) {
    const { error } = await supabase
        .from('fund_transactions')
        .delete()
        .eq('expense_id', expenseId);
    
    if (error) {
        console.error('Lỗi khi xóa giao dịch quỹ liên quan đến chi tiêu:', error);
        throw new Error(`Không thể xóa giao dịch quỹ liên quan: ${error.message}`);
    }
    
    return true;
}

/**
 * Khởi tạo dữ liệu mặc định khi ứng dụng chạy lần đầu
 * @param {Array} defaultMembers Danh sách thành viên mặc định
 * @param {Object} defaultBankAccounts Thông tin tài khoản ngân hàng mặc định
 */
export async function initializeDefaultData(defaultMembers, defaultBankAccounts) {
    // Kiểm tra xem đã có dữ liệu trong bảng members chưa
    const { count, error } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error('Lỗi khi kiểm tra dữ liệu ban đầu:', error);
        return;
    }
    
    // Nếu chưa có dữ liệu, thêm dữ liệu mặc định
    if (count === 0) {
        const members = defaultMembers.map(name => ({
            name: name,
            bank_account: defaultBankAccounts[name] || ''
        }));
        
        const { error: insertError } = await supabase
            .from('members')
            .insert(members);
        
        if (insertError) {
            console.error('Lỗi khi khởi tạo dữ liệu thành viên mặc định:', insertError);
        } else {
            console.log('Đã khởi tạo dữ liệu thành viên mặc định');
        }
    }
}

/**
 * Lấy số dư quỹ hiện tại từ bảng fund_balance
 * @returns {Promise<number>} Số dư quỹ hiện tại
 */
export async function getCurrentBalance() {
    const { data, error } = await supabase
        .from('fund_balance')
        .select('current_balance')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();
    
    if (error) {
        console.error('Lỗi khi lấy số dư quỹ:', error);
        
        // Nếu chưa có bảng hoặc dữ liệu, tính toán lại
        try {
            return await recalculateBalance();
        } catch (recalcError) {
            console.error('Lỗi khi tính lại số dư quỹ:', recalcError);
            return 0;
        }
    }
    
    return data.current_balance;
}

/**
 * Cập nhật số dư quỹ
 * @param {number} newBalance Số dư mới
 * @param {string} transactionId ID của giao dịch gần nhất
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export async function updateFundBalance(newBalance, transactionId) {
    // Kiểm tra xem đã có dữ liệu trong bảng fund_balance chưa
    const { count } = await supabase
        .from('fund_balance')
        .select('*', { count: 'exact', head: true });
    
    if (count === 0) {
        // Chưa có dữ liệu, thêm mới
        const { data, error } = await supabase
            .from('fund_balance')
            .insert({
                current_balance: newBalance,
                last_transaction_id: transactionId,
                last_updated: new Date().toISOString(),
                version: 1
            })
            .select();
        
        if (error) {
            console.error('Lỗi khi tạo số dư quỹ:', error);
            throw new Error(`Không thể tạo số dư quỹ: ${error.message}`);
        }
        
        return data[0];
    } else {
        // Lấy ID của record hiện tại
        const { data: balanceRecord, error: fetchError } = await supabase
            .from('fund_balance')
            .select('id, version')
            .limit(1)
            .single();
            
        if (fetchError) {
            console.error('Lỗi khi lấy ID record fund_balance:', fetchError);
            throw new Error(`Không thể lấy ID record fund_balance: ${fetchError.message}`);
        }
        
        // Tính toán phiên bản mới
        const newVersion = (balanceRecord.version || 0) + 1;
        
        // Đã có dữ liệu, cập nhật
        const { data, error } = await supabase
            .from('fund_balance')
            .update({
                current_balance: newBalance,
                last_transaction_id: transactionId,
                last_updated: new Date().toISOString(),
                version: newVersion
            })
            .eq('id', balanceRecord.id)
            .select();
        
        if (error) {
            console.error('Lỗi khi cập nhật số dư quỹ:', error);
            throw new Error(`Không thể cập nhật số dư quỹ: ${error.message}`);
        }
        
        return data[0];
    }
}

/**
 * Tính lại số dư quỹ từ tất cả giao dịch (chỉ dùng khi cần đồng bộ lại)
 * @returns {Promise<number>} Số dư quỹ đã tính lại
 */
export async function recalculateBalance() {
    // Sử dụng Supabase để tính tổng ngay trên database
    try {
        const { data, error } = await supabase.rpc('calculate_fund_balance');
        
        if (error) {
            console.error('Lỗi khi tính lại số dư quỹ (RPC):', error);
            
            // Nếu RPC lỗi, tính thủ công
            const { data: transactions, error: transactionError } = await supabase
                .from('fund_transactions')
                .select('type, amount');
                
            if (transactionError) {
                console.error('Lỗi khi lấy giao dịch:', transactionError);
                return 0;
            }
            
            const balance = transactions.reduce((sum, transaction) => {
                return sum + (transaction.type === 'deposit' ? transaction.amount : -transaction.amount);
            }, 0);
            
            // Cập nhật số dư vào bảng fund_balance
            await updateFundBalance(balance, null);
            
            return balance;
        }
        
        // Lấy ID của record hiện tại hoặc tạo mới nếu chưa có
        let balanceRecord;
        
        const { data: existingBalance, error: fetchError } = await supabase
            .from('fund_balance')
            .select('id')
            .limit(1)
            .maybeSingle();
            
        if (fetchError) {
            console.error('Lỗi khi kiểm tra fund_balance:', fetchError);
            // Tạo mới record nếu lỗi
            await updateFundBalance(data, null);
            return data;
        }
        
        if (!existingBalance) {
            // Chưa có record, tạo mới
            await updateFundBalance(data, null);
            return data;
        }
        
        // Cập nhật số dư vào bảng fund_balance với ID đúng
        await supabase
            .from('fund_balance')
            .update({
                current_balance: data,
                last_updated: new Date().toISOString()
            })
            .eq('id', existingBalance.id);
        
        return data;
    } catch (error) {
        console.error('Lỗi khi tính lại số dư quỹ:', error);
        return 0;
    }
}

/**
 * Lấy số dư hiện tại của một thành viên
 * @param {string} memberName Tên thành viên
 * @returns {Promise<number>} Số dư thành viên
 */
export async function getMemberBalance(memberName) {
    try {
        // Đầu tiên, kiểm tra trong bảng member_balances
        const { data, error } = await supabase
            .from('member_balances')
            .select('current_balance')
            .eq('member_name', memberName)
            .single();
        
        if (error || !data) {
            console.log(`Chưa có dữ liệu số dư cho thành viên ${memberName}, sẽ tính toán lại`);
            return calculateAndUpdateMemberBalance(memberName);
        }
        
        return data.current_balance;
    } catch (error) {
        console.error(`Lỗi khi lấy số dư cho ${memberName}:`, error);
        return 0;
    }
}

/**
 * Tính toán và cập nhật số dư của một thành viên
 * @param {string} memberName Tên thành viên
 * @returns {Promise<number>} Số dư mới
 */
export async function calculateAndUpdateMemberBalance(memberName) {
    try {
        // Sử dụng RPC để tính số dư từ server
        const { data, error } = await supabase.rpc('calculate_member_balance', {
            member_name: memberName
        });
        
        if (error) {
            console.error(`Lỗi khi tính số dư cho ${memberName} (RPC):`, error);
            
            // Nếu RPC lỗi, tính thủ công
            const { data: deposits, error: depositError } = await supabase
                .from('fund_transactions')
                .select('amount')
                .eq('type', 'deposit')
                .eq('member', memberName);
                
            if (depositError) {
                console.error('Lỗi khi lấy giao dịch nộp tiền:', depositError);
                return 0;
            }
            
            const balance = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
            
            // Cập nhật vào bảng member_balances
            await updateMemberBalance(memberName, balance, null);
            
            return balance;
        }
        
        // Cập nhật vào bảng member_balances
        await updateMemberBalance(memberName, data, null);
        
        return data;
    } catch (error) {
        console.error(`Lỗi khi tính số dư cho ${memberName}:`, error);
        return 0;
    }
}

/**
 * Cập nhật số dư của thành viên
 * @param {string} memberName Tên thành viên
 * @param {number} newBalance Số dư mới
 * @param {string} transactionId ID giao dịch gần nhất
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export async function updateMemberBalance(memberName, newBalance, transactionId) {
    // Convert newBalance to integer before saving to the database
    // as the member_balances table expects an INTEGER type
    const balanceAsInteger = Math.round(newBalance);

    const { data, error } = await supabase
        .from('member_balances')
        .upsert({
            member_name: memberName,
            current_balance: balanceAsInteger,
            last_transaction_id: transactionId,
            last_updated: new Date().toISOString()
        }, {
            onConflict: 'member_name'
        })
        .select();
    
    if (error) {
        console.error(`Lỗi khi cập nhật số dư của ${memberName}:`, error);
        throw error;
    }
    
    return data;
}

/**
 * Lấy danh sách các thành viên có số dư âm cần nhắc nhở
 * @returns {Promise<Array>} Danh sách thành viên cần nhắc nhở
 */
export async function getMembersNeedingNotification() {
    const { data, error } = await supabase
        .from('member_balances')
        .select('member_name, current_balance, notification_threshold, notified_at')
        .lt('current_balance', 0)
        .order('current_balance', { ascending: true });
    
    if (error) {
        console.error('Lỗi khi lấy danh sách thành viên cần nhắc nhở:', error);
        return [];
    }
    
    // Lọc thành viên có số dư dưới ngưỡng và chưa được nhắc nhở trong 7 ngày qua
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return data.filter(member => {
        return member.current_balance <= member.notification_threshold && 
               (!member.notified_at || new Date(member.notified_at) < sevenDaysAgo);
    }).map(member => ({
        member: member.member_name,
        balance: member.current_balance,
        threshold: member.notification_threshold || -50000
    }));
}

/**
 * Cập nhật ngưỡng thông báo cho thành viên
 * @param {string} memberName Tên thành viên
 * @param {number} threshold Ngưỡng thông báo mới
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export async function updateNotificationThreshold(memberName, threshold) {
    const { data, error } = await supabase
        .from('member_balances')
        .upsert({
            member_name: memberName,
            notification_threshold: threshold,
            last_updated: new Date().toISOString()
        }, {
            onConflict: 'member_name'
        })
        .select();
    
    if (error) {
        console.error(`Lỗi khi cập nhật ngưỡng thông báo cho ${memberName}:`, error);
        throw error;
    }
    
    return data;
}

/**
 * Đánh dấu đã thông báo cho thành viên
 * @param {string} memberName Tên thành viên
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export async function markMemberNotified(memberName) {
    const { data, error } = await supabase
        .from('member_balances')
        .update({ 
            notified_at: new Date().toISOString() 
        })
        .eq('member_name', memberName)
        .select();
    
    if (error) {
        console.error(`Lỗi khi cập nhật thời gian thông báo cho ${memberName}:`, error);
        throw error;
    }
    
    return data;
}

export default {
    getMembers,
    addMember,
    updateMember,
    deleteMember,
    getExpenses,
    getPaginatedExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getFundTransactions,
    addDeposit,
    addExpenseTransaction,
    deleteFundTransaction,
    deleteExpenseTransactions,
    initializeDefaultData,
    getCurrentBalance,
    updateFundBalance,
    recalculateBalance,
    getMemberBalance,
    calculateAndUpdateMemberBalance,
    updateMemberBalance,
    getMembersNeedingNotification,
    updateNotificationThreshold,
    markMemberNotified
}; 
/**
 * Supabase Client for CafeThu6
 * Handles connection and data operations with Supabase
 */

// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Thay đổi các giá trị này bằng thông tin từ dự án Supabase của bạn
const SUPABASE_URL = 'https://nvcmmagmyowkuvqjrirf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y21tYWdteW93a3V2cWpyaXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMzgyNTgsImV4cCI6MjA1OTkxNDI1OH0.2ZuI36vMIB-vK76ZkwRJSDL3O7IpBkjUK-vPxv0PufA';

// Khởi tạo Supabase client
let supabase;
try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
    console.error('Lỗi khi khởi tạo Supabase client:', error);
    throw new Error('Không thể khởi tạo kết nối Supabase. Vui lòng kiểm tra cấu hình.');
}

// Kiểm tra kết nối
export async function checkConnection() {
    try {
        const { data, error } = await supabase.from('members').select('count').single();
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Lỗi kiểm tra kết nối Supabase:', error);
        return false;
    }
}

/**
 * Lấy tất cả thành viên từ Supabase
 * @returns {Promise<Array>} Danh sách thành viên
 */
export async function getMembers() {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('name');
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Lỗi khi lấy danh sách thành viên:', error);
        throw new Error('Không thể lấy danh sách thành viên từ Supabase');
    }
}

/**
 * Thêm thành viên mới vào Supabase
 * @param {string} name Tên thành viên
 * @param {string} bankAccount Số tài khoản ngân hàng
 * @returns {Promise<Object>} Thành viên được thêm
 */
export async function addMember(name, bankAccount) {
    const { data, error } = await supabase
        .from('members')
        .insert([{ 
            name: name, 
            bank_account: bankAccount 
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
    
    console.log('Dữ liệu chi tiêu nhận từ Supabase:', data);
    
    // Chuyển đổi dữ liệu từ định dạng DB sang định dạng ứng dụng
    return data.map(expense => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
        time: expense.time || '00:00',
        payer: expense.payer,
        participants: expense.participants,
        equalSplit: expense.equal_split,
        splits: expense.splits || {},
        createdAt: expense.created_at
    }));
}

/**
 * Thêm chi tiêu mới
 * @param {Object} expense Dữ liệu chi tiêu
 * @returns {Promise<Object>} Chi tiêu được thêm
 */
export async function addExpense(expense) {
    console.log('Đang thêm chi tiêu với thời gian:', expense.time);
    
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
        time: expense.time || '00:00', // Sử dụng giá trị time từ request
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
        time: expense.time || '00:00', // Sử dụng giá trị time từ request
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
        .order('date', { ascending: false });
    
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
        expenseName: transaction.expense_name,
        expenseData: transaction.expense_data
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
 * @param {string} [expenseData] Dữ liệu chi tiết về chi tiêu (JSON string)
 * @returns {Promise<Object>} Giao dịch được thêm
 */
export async function addExpenseTransaction(expenseId, expenseName, amount, date, expenseData = null) {
    console.log('addExpenseTransaction với ID:', expenseId, typeof expenseId);
    
    // Kiểm tra xem ID có đúng định dạng UUID không
    function isUUID(str) {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return regex.test(str);
    }
    
    // Nếu ID không phải UUID và đang kết nối Supabase, dùng UUID mới
    let safeExpenseId = expenseId;
    if (!isUUID(expenseId)) {
        console.warn('ID không phải UUID:', expenseId);
        safeExpenseId = crypto.randomUUID ? crypto.randomUUID() : 
                         ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                         );
        console.log('Đã chuyển đổi ID thành UUID:', safeExpenseId);
    }
    
    const transactionData = {
        type: 'expense',
        amount: amount,
        date: date,
        expense_id: safeExpenseId,
        expense_name: expenseName
    };
    
    // Không thêm expense_data vào dữ liệu gửi đến Supabase vì cột này không tồn tại
    
    const { data, error } = await supabase
        .from('fund_transactions')
        .insert([transactionData])
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
        expenseId: safeExpenseId, // Trả về ID đã được chuyển đổi
        expenseName: data[0].expense_name,
        expenseData: expenseData // Sử dụng expenseData từ tham số
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
    console.log('deleteExpenseTransactions với ID:', expenseId);
    
    // Kiểm tra xem ID có đúng định dạng UUID không
    function isUUID(str) {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return regex.test(str);
    }
    
    // Nếu ID không phải UUID và đang kết nối Supabase, dùng UUID mới
    let safeExpenseId = expenseId;
    if (!isUUID(expenseId)) {
        console.warn('ID không phải UUID khi xóa giao dịch:', expenseId);
        // Trong trường hợp xóa, không thể dùng UUID mới vì không biết UUID cũ là gì
        // Thay vào đó, ta sẽ cố gắng truy vấn tất cả giao dịch và tìm theo tên
        const { data } = await supabase
            .from('fund_transactions')
            .select('*')
            .eq('expense_name', expenseId); // Dùng expenseId làm tên (trường hợp đặc biệt)
        
        if (data && data.length > 0) {
            // Nếu tìm thấy, xóa từng giao dịch theo ID
            for (const transaction of data) {
                await supabase
                    .from('fund_transactions')
                    .delete()
                    .eq('id', transaction.id);
            }
            return true;
        }
        
        // Nếu không tìm thấy, báo lỗi nhưng vẫn trả về true để tiếp tục
        console.warn('Không tìm thấy giao dịch để xóa với ID:', expenseId);
        return true;
    }
    
    // Trường hợp ID là UUID, xóa bình thường
    const { error } = await supabase
        .from('fund_transactions')
        .delete()
        .eq('expense_id', safeExpenseId);
    
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

export default {
    getMembers,
    addMember,
    updateMember,
    deleteMember,
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getFundTransactions,
    addDeposit,
    addExpenseTransaction,
    deleteFundTransaction,
    deleteExpenseTransactions,
    initializeDefaultData
}; 
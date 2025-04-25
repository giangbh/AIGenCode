/**
 * Database Migration Script for CafeThu6
 * This script will export all data from the current Supabase database
 * and import it into a new Supabase environment.
 * 
 * Usage:
 * 1. Set the source and destination Supabase credentials below
 * 2. Run the script: node db-migration.js
 */

// Source database credentials (current database)
const SOURCE_SUPABASE_URL = 'https://nvcmmagmyowkuvqjrirf.supabase.co';
const SOURCE_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y21tYWdteW93a3V2cWpyaXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMzgyNTgsImV4cCI6MjA1OTkxNDI1OH0.2ZuI36vMIB-vK76ZkwRJSDL3O7IpBkjUK-vPxv0PufA';

// Destination database credentials (new environment)
// REPLACE THESE VALUES with your new Supabase project credentials
const DEST_SUPABASE_URL = 'YOUR_NEW_SUPABASE_URL';
const DEST_SUPABASE_KEY = 'YOUR_NEW_SUPABASE_ANON_KEY';

// Import the Supabase JS client
// Note: This script should be run with Node.js, so you need to install the Supabase JS client first:
// npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');

// Initialize source and destination Supabase clients
const sourceSupabase = createClient(SOURCE_SUPABASE_URL, SOURCE_SUPABASE_KEY);
const destSupabase = createClient(DEST_SUPABASE_URL, DEST_SUPABASE_KEY);

/**
 * Main migration function
 */
async function migrateDatabase() {
  console.log('Starting database migration...');
  
  try {
    // 1. Migrate members
    console.log('Migrating members...');
    await migrateMembers();
    
    // 2. Migrate expenses
    console.log('Migrating expenses...');
    await migrateExpenses();
    
    // 3. Migrate fund transactions
    console.log('Migrating fund transactions...');
    await migrateFundTransactions();
    
    // 4. Migrate fund balance
    console.log('Migrating fund balance...');
    await migrateFundBalance();
    
    // 5. Migrate member balances
    console.log('Migrating member balances...');
    await migrateMemberBalances();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

/**
 * Migrate members table
 */
async function migrateMembers() {
  // Get all members from source
  const { data: members, error } = await sourceSupabase
    .from('members')
    .select('*');
    
  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`);
  }
  
  if (members.length === 0) {
    console.log('No members to migrate.');
    return;
  }
  
  console.log(`Found ${members.length} members to migrate.`);
  
  // Insert members into destination
  const { error: insertError } = await destSupabase
    .from('members')
    .insert(members);
    
  if (insertError) {
    throw new Error(`Failed to insert members: ${insertError.message}`);
  }
  
  console.log(`Successfully migrated ${members.length} members.`);
}

/**
 * Migrate expenses table
 */
async function migrateExpenses() {
  // Get all expenses from source
  const { data: expenses, error } = await sourceSupabase
    .from('expenses')
    .select('*');
    
  if (error) {
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }
  
  if (expenses.length === 0) {
    console.log('No expenses to migrate.');
    return;
  }
  
  console.log(`Found ${expenses.length} expenses to migrate.`);
  
  // Insert expenses into destination
  const { error: insertError } = await destSupabase
    .from('expenses')
    .insert(expenses);
    
  if (insertError) {
    throw new Error(`Failed to insert expenses: ${insertError.message}`);
  }
  
  console.log(`Successfully migrated ${expenses.length} expenses.`);
}

/**
 * Migrate fund_transactions table
 */
async function migrateFundTransactions() {
  // Get all fund transactions from source
  const { data: transactions, error } = await sourceSupabase
    .from('fund_transactions')
    .select('*');
    
  if (error) {
    throw new Error(`Failed to fetch fund transactions: ${error.message}`);
  }
  
  if (transactions.length === 0) {
    console.log('No fund transactions to migrate.');
    return;
  }
  
  console.log(`Found ${transactions.length} fund transactions to migrate.`);
  
  // Insert transactions into destination
  const { error: insertError } = await destSupabase
    .from('fund_transactions')
    .insert(transactions);
    
  if (insertError) {
    throw new Error(`Failed to insert fund transactions: ${insertError.message}`);
  }
  
  console.log(`Successfully migrated ${transactions.length} fund transactions.`);
}

/**
 * Migrate fund_balance table
 */
async function migrateFundBalance() {
  // Get fund balance from source
  const { data: fundBalance, error } = await sourceSupabase
    .from('fund_balance')
    .select('*');
    
  if (error) {
    throw new Error(`Failed to fetch fund balance: ${error.message}`);
  }
  
  if (fundBalance.length === 0) {
    console.log('No fund balance to migrate.');
    return;
  }
  
  console.log(`Found ${fundBalance.length} fund balance records to migrate.`);
  
  // Insert fund balance into destination
  const { error: insertError } = await destSupabase
    .from('fund_balance')
    .insert(fundBalance);
    
  if (insertError) {
    throw new Error(`Failed to insert fund balance: ${insertError.message}`);
  }
  
  console.log(`Successfully migrated ${fundBalance.length} fund balance records.`);
}

/**
 * Migrate member_balances table
 */
async function migrateMemberBalances() {
  // Get member balances from source
  const { data: memberBalances, error } = await sourceSupabase
    .from('member_balances')
    .select('*');
    
  if (error) {
    throw new Error(`Failed to fetch member balances: ${error.message}`);
  }
  
  if (memberBalances.length === 0) {
    console.log('No member balances to migrate.');
    return;
  }
  
  console.log(`Found ${memberBalances.length} member balance records to migrate.`);
  
  // Insert member balances into destination
  const { error: insertError } = await destSupabase
    .from('member_balances')
    .insert(memberBalances);
    
  if (insertError) {
    throw new Error(`Failed to insert member balances: ${insertError.message}`);
  }
  
  console.log(`Successfully migrated ${memberBalances.length} member balance records.`);
}

// Create a batch-wise version for larger datasets
async function migrateInBatches(tableName, batchSize = 100) {
  console.log(`Migrating ${tableName} in batches...`);
  
  // Get count of records
  const { count, error: countError } = await sourceSupabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    throw new Error(`Failed to count ${tableName}: ${countError.message}`);
  }
  
  console.log(`Total ${count} records to migrate in ${tableName}`);
  
  // Calculate number of batches
  const batches = Math.ceil(count / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const from = i * batchSize;
    const to = from + batchSize - 1;
    
    console.log(`Migrating batch ${i+1}/${batches} (${from}-${to})...`);
    
    // Get batch of records
    const { data, error } = await sourceSupabase
      .from(tableName)
      .select('*')
      .range(from, to);
      
    if (error) {
      throw new Error(`Failed to fetch batch from ${tableName}: ${error.message}`);
    }
    
    // Insert batch into destination
    if (data.length > 0) {
      const { error: insertError } = await destSupabase
        .from(tableName)
        .insert(data);
        
      if (insertError) {
        throw new Error(`Failed to insert batch into ${tableName}: ${insertError.message}`);
      }
      
      console.log(`Migrated ${data.length} records in batch ${i+1}`);
    }
  }
}

/**
 * Export the database to a JSON file as backup
 */
async function exportToJson() {
  const data = {};
  
  // Export members
  const { data: members, error: membersError } = await sourceSupabase
    .from('members')
    .select('*');
    
  if (membersError) {
    throw new Error(`Failed to export members: ${membersError.message}`);
  }
  
  data.members = members;
  
  // Export expenses
  const { data: expenses, error: expensesError } = await sourceSupabase
    .from('expenses')
    .select('*');
    
  if (expensesError) {
    throw new Error(`Failed to export expenses: ${expensesError.message}`);
  }
  
  data.expenses = expenses;
  
  // Export fund transactions
  const { data: transactions, error: transactionsError } = await sourceSupabase
    .from('fund_transactions')
    .select('*');
    
  if (transactionsError) {
    throw new Error(`Failed to export fund transactions: ${transactionsError.message}`);
  }
  
  data.fund_transactions = transactions;
  
  // Export fund balance
  const { data: fundBalance, error: fundBalanceError } = await sourceSupabase
    .from('fund_balance')
    .select('*');
    
  if (fundBalanceError) {
    throw new Error(`Failed to export fund balance: ${fundBalanceError.message}`);
  }
  
  data.fund_balance = fundBalance;
  
  // Export member balances
  const { data: memberBalances, error: memberBalancesError } = await sourceSupabase
    .from('member_balances')
    .select('*');
    
  if (memberBalancesError) {
    throw new Error(`Failed to export member balances: ${memberBalancesError.message}`);
  }
  
  data.member_balances = memberBalances;
  
  // Write to file
  const fs = require('fs');
  const filename = `cafethu6_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`Exported database to ${filename}`);
  
  return filename;
}

/**
 * Import data from a JSON file
 */
async function importFromJson(filename) {
  console.log(`Importing data from ${filename}...`);
  
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  
  // Import members
  if (data.members && data.members.length > 0) {
    console.log(`Importing ${data.members.length} members...`);
    const { error } = await destSupabase
      .from('members')
      .insert(data.members);
      
    if (error) {
      throw new Error(`Failed to import members: ${error.message}`);
    }
  }
  
  // Import expenses
  if (data.expenses && data.expenses.length > 0) {
    console.log(`Importing ${data.expenses.length} expenses...`);
    const { error } = await destSupabase
      .from('expenses')
      .insert(data.expenses);
      
    if (error) {
      throw new Error(`Failed to import expenses: ${error.message}`);
    }
  }
  
  // Import fund transactions
  if (data.fund_transactions && data.fund_transactions.length > 0) {
    console.log(`Importing ${data.fund_transactions.length} fund transactions...`);
    const { error } = await destSupabase
      .from('fund_transactions')
      .insert(data.fund_transactions);
      
    if (error) {
      throw new Error(`Failed to import fund transactions: ${error.message}`);
    }
  }
  
  // Import fund balance
  if (data.fund_balance && data.fund_balance.length > 0) {
    console.log(`Importing ${data.fund_balance.length} fund balance records...`);
    const { error } = await destSupabase
      .from('fund_balance')
      .insert(data.fund_balance);
      
    if (error) {
      throw new Error(`Failed to import fund balance: ${error.message}`);
    }
  }
  
  // Import member balances
  if (data.member_balances && data.member_balances.length > 0) {
    console.log(`Importing ${data.member_balances.length} member balance records...`);
    const { error } = await destSupabase
      .from('member_balances')
      .insert(data.member_balances);
      
    if (error) {
      throw new Error(`Failed to import member balances: ${error.message}`);
    }
  }
  
  console.log('Import completed successfully!');
}

// Execute the migration
if (require.main === module) {
  // Create a backup first
  exportToJson()
    .then(filename => {
      console.log(`Backup created: ${filename}`);
      
      // Ask for confirmation before proceeding with migration
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Backup created. Continue with migration? (y/n) ', answer => {
        readline.close();
        
        if (answer.toLowerCase() === 'y') {
          migrateDatabase()
            .then(() => console.log('Migration completed.'))
            .catch(err => console.error('Migration failed:', err.message));
        } else {
          console.log('Migration aborted. You can still import from the backup file.');
        }
      });
    })
    .catch(err => console.error('Backup failed:', err.message));
}

// Export functions for potential reuse
module.exports = {
  migrateDatabase,
  migrateFundBalance,
  migrateMemberBalances,
  migrateMembers,
  migrateExpenses,
  migrateFundTransactions,
  migrateInBatches,
  exportToJson,
  importFromJson
}; 
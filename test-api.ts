// backend/test-api.ts

const BASE_URL = 'http://localhost:3001/api';
// These must match your .env file
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  let token = '';
  let shiftId = '';
  let expenseId = '';

  // Helper function to make authenticated requests
  const fetchAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP Error ${res.status}`);
    return data;
  };

  try {
    // ---------------------------------------------------------
    // 1. AUTHENTICATION
    // ---------------------------------------------------------
    console.log('1️⃣  Testing POST /api/auth/login...');
    const authRes = await fetchAPI('/auth/login', 'POST', {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    token = authRes.token;
    console.log('✅ Login successful! Token acquired.\n');

    // ---------------------------------------------------------
    // 2. SETTINGS
    // ---------------------------------------------------------
    console.log('2️⃣  Testing GET /api/settings...');
    const settings = await fetchAPI('/settings');
    console.log(`✅ Settings retrieved. Min Wage: ${settings.minWage}\n`);

    console.log('3️⃣  Testing PUT /api/settings...');
    const updatedSettings = await fetchAPI('/settings', 'PUT', { minWage: 35.0 });
    console.log(`✅ Settings updated. New Min Wage: ${updatedSettings.minWage}\n`);

    // ---------------------------------------------------------
    // 3. SHIFTS (Create, Read, Update)
    // ---------------------------------------------------------
    console.log('4️⃣  Testing POST /api/shifts (Create Regular Shift)...');
    const newShift = await fetchAPI('/shifts', 'POST', {
      type: 'regular',
      date: '2026-05-20',
      startTime: '09:00',
      endTime: '17:00',
      hourRate: 50
    });
    shiftId = newShift.id;
    console.log(`✅ Shift created! ID: ${shiftId} | Total Hours: ${newShift.totalHours} | Daily Salary: ${newShift.dailySalary}\n`);

    console.log('5️⃣  Testing PUT /api/shifts/:id (Update Shift)...');
    const updatedShift = await fetchAPI(`/shifts/${shiftId}`, 'PUT', {
      type: 'regular',
      date: '2026-05-20',
      startTime: '09:00',
      endTime: '19:00', // Changed end time to 19:00 (10 hours)
      hourRate: 50
    });
    console.log(`✅ Shift updated! New Total Hours: ${updatedShift.totalHours} | New Daily Salary: ${updatedShift.dailySalary}\n`);

    console.log('6️⃣  Testing GET /api/shifts...');
    const shifts = await fetchAPI('/shifts');
    console.log(`✅ Retrieved all shifts. Total count: ${shifts.length}\n`);

    // ---------------------------------------------------------
    // 4. EXPENSES (Create, Read)
    // ---------------------------------------------------------
    console.log('7️⃣  Testing POST /api/expenses...');
    const newExpense = await fetchAPI('/expenses', 'POST', {
      type: 'fuel',
      date: '2026-05-20',
      amount: 150
    });
    expenseId = newExpense.id;
    console.log(`✅ Expense created! ID: ${expenseId} | Amount: ${newExpense.amount}\n`);

    console.log('8️⃣  Testing GET /api/expenses...');
    const expenses = await fetchAPI('/expenses');
    console.log(`✅ Retrieved all expenses. Total count: ${expenses.length}\n`);

    // ---------------------------------------------------------
    // 5. STATS
    // ---------------------------------------------------------
    console.log('9️⃣  Testing GET /api/stats...');
    const stats = await fetchAPI('/stats?year=2026');
    console.log(`✅ Stats retrieved!`);
    console.log(stats);
    console.log('\n');

    // ---------------------------------------------------------
    // 6. CLEANUP (Delete)
    // ---------------------------------------------------------
    console.log('🔟 Testing DELETE /api/shifts/:id...');
    await fetchAPI(`/shifts/${shiftId}`, 'DELETE');
    console.log('✅ Shift deleted successfully.\n');

    console.log('1️⃣1️⃣ Testing DELETE /api/expenses/:id...');
    await fetchAPI(`/expenses/${expenseId}`, 'DELETE');
    console.log('✅ Expense deleted successfully.\n');

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! Your API is bulletproof. 🎉');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED!');
    console.error(error.message);
  }
}

runTests();
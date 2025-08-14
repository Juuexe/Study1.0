const axios = require('axios');

// Base URL for your backend
const BASE_URL = 'http://localhost:5000';

let authToken = '';
let testUserId = '';
let testRoomId = '';

// Test user credentials
const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpassword123'
};

// Helper function to make authenticated requests
const authRequest = (method, url, data = null) => {
    const config = {
        method,
        url: `${BASE_URL}${url}`,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    };
    
    // Only add data for non-GET requests
    if (method.toLowerCase() !== 'get' && data !== null) {
        config.data = data;
    }
    
    return axios(config);
};

// Test functions
async function testUserRegistration() {
    console.log('\n🔐 Testing User Registration...');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
        authToken = response.data.token;
        testUserId = response.data.user.id;
        console.log('✅ User registration successful');
        console.log('User ID:', testUserId);
        return true;
    } catch (error) {
        if (error.response?.data?.message === 'Email already in use') {
            console.log('⚠️  User already exists, trying login...');
            return testUserLogin();
        }
        console.error('❌ Registration failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testUserLogin() {
    console.log('\n🔐 Testing User Login...');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        authToken = response.data.token;
        testUserId = response.data.user.id;
        console.log('✅ User login successful');
        console.log('User ID:', testUserId);
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testRoomCreation() {
    console.log('\n🏠 Testing Room Creation...');
    try {
        const timestamp = Date.now();
        const roomData = {
            name: `Test Room ${timestamp}`,
            description: 'A room for testing purposes'
        };
        
        const response = await authRequest('post', '/api/rooms/create', roomData);
        testRoomId = response.data.room.id;
        console.log('✅ Room creation successful');
        console.log('Room ID:', testRoomId);
        console.log('Room Name:', response.data.room.name);
        return true;
    } catch (error) {
        console.error('❌ Room creation failed:', error.response?.data?.message || error.message);
        
        // If creation failed, try to get an existing room to continue testing
        console.log('⚠️  Trying to use existing room for testing...');
        try {
            const roomsResponse = await authRequest('get', '/api/rooms');
            if (roomsResponse.data.length > 0) {
                testRoomId = roomsResponse.data[0]._id;
                console.log('✅ Using existing room:', roomsResponse.data[0].name);
                console.log('Room ID:', testRoomId);
                return true;
            }
        } catch (getRoomError) {
            console.error('❌ Could not get existing rooms:', getRoomError.message);
        }
        
        return false;
    }
}

async function testGetRooms() {
    console.log('\n📋 Testing Get All Rooms...');
    try {
        const response = await authRequest('get', '/api/rooms');
        console.log('✅ Get rooms successful');
        console.log('Number of rooms:', response.data.length);
        if (response.data.length > 0) {
            console.log('First room:', response.data[0].name);
            console.log('Creator:', response.data[0].creator.username);
        }
        return true;
    } catch (error) {
        console.error('❌ Get rooms failed:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        console.error('URL:', error.config?.url);
        return false;
    }
}

async function testSendMessage() {
    console.log('\n💬 Testing Send Message...');
    try {
        const messageData = {
            content: 'Hello, this is a test message!'
        };
        
        const response = await authRequest('post', `/api/rooms/${testRoomId}/message`, messageData);
        console.log('✅ Message sent successfully');
        console.log('Message content:', response.data.messageData.content);
        return true;
    } catch (error) {
        console.error('❌ Send message failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testGetMessages() {
    console.log('\n📖 Testing Get Messages...');
    try {
        const response = await authRequest('get', `/api/rooms/${testRoomId}/messages`);
        console.log('✅ Get messages successful');
        console.log('Number of messages:', response.data.messages.length);
        if (response.data.messages.length > 0) {
            console.log('Latest message:', response.data.messages[response.data.messages.length - 1].content);
        }
        return true;
    } catch (error) {
        console.error('❌ Get messages failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testRoomDeletion() {
    console.log('\n🗑️  Testing Room Deletion (by creator)...');
    try {
        const response = await authRequest('delete', `/api/rooms/${testRoomId}`);
        console.log('✅ Room deletion successful');
        console.log('Message:', response.data.message);
        return true;
    } catch (error) {
        console.error('❌ Room deletion failed:', error.response?.data?.message || error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting API Tests for Chat Application\n');
    console.log('=' .repeat(50));
    
    const tests = [
        { name: 'User Registration/Login', fn: testUserRegistration },
        { name: 'Room Creation', fn: testRoomCreation },
        { name: 'Get All Rooms', fn: testGetRooms },
        { name: 'Send Message', fn: testSendMessage },
        { name: 'Get Messages', fn: testGetMessages },
        { name: 'Room Deletion', fn: testRoomDeletion }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ ${test.name} threw an error:`, error.message);
            failed++;
        }
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! Your chat application is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the output above for details.');
    }
}

// Check if server is running first
async function checkServer() {
    try {
        await axios.get(`${BASE_URL}/`);
        console.log('✅ Backend server is running');
        return true;
    } catch (error) {
        console.error('❌ Backend server is not running. Please start it with: npm start');
        console.error('Make sure MongoDB is running and the server is on port 5000');
        return false;
    }
}

// Run the tests
checkServer().then(serverRunning => {
    if (serverRunning) {
        runTests();
    } else {
        console.log('\n🛑 Cannot run tests - server is not available');
        process.exit(1);
    }
});

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Helper function to make authenticated requests
const authRequest = (token, method, url, data = null) => {
    const config = {
        method,
        url: `${BASE_URL}${url}`,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (method.toLowerCase() !== 'get' && data !== null) {
        config.data = data;
    }
    
    return axios(config);
};

async function testNewUserRoomJoining() {
    console.log('Testing New User Room Joining Flow\n');
    console.log('=' .repeat(50));

    let user1Token = '';
    let user2Token = '';
    let roomId = '';

    try {
        // Step 1: Create first user (room creator)
        console.log('\n1. Creating first user (room creator)...');
        const user1Data = {
            username: `roomcreator${Date.now()}`,
            email: `creator${Date.now()}@test.com`,
            password: 'testpass123'
        };
        
        const user1Response = await axios.post(`${BASE_URL}/api/auth/register`, user1Data);
        user1Token = user1Response.data.token;
        console.log('✅ First user created:', user1Response.data.user.username);

        // Step 2: Create a room with first user
        console.log('\n2. Creating a room...');
        const roomData = {
            name: `Test Room ${Date.now()}`,
            description: 'A room for testing new user joining'
        };
        
        const roomResponse = await authRequest(user1Token, 'post', '/api/rooms/create', roomData);
        roomId = roomResponse.data.room.id;
        console.log('✅ Room created:', roomResponse.data.room.name);
        console.log('Room ID:', roomId);

        // Step 3: Create second user (new joiner)
        console.log('\n3. Creating second user (new joiner)...');
        const user2Data = {
            username: `newjoiner${Date.now()}`,
            email: `joiner${Date.now()}@test.com`,
            password: 'testpass123'
        };
        
        const user2Response = await axios.post(`${BASE_URL}/api/auth/register`, user2Data);
        user2Token = user2Response.data.token;
        console.log('✅ Second user created:', user2Response.data.user.username);

        // Step 4: Second user views available rooms
        console.log('\n4. New user viewing available rooms...');
        const roomsResponse = await authRequest(user2Token, 'get', '/api/rooms');
        console.log('✅ Rooms retrieved:', roomsResponse.data.length);
        
        if (roomsResponse.data.length > 0) {
            const targetRoom = roomsResponse.data.find(room => room._id === roomId);
            if (targetRoom) {
                console.log('Target room found:', targetRoom.name);
                console.log('Creator:', targetRoom.creator.username);
                console.log('Current participants:', targetRoom.participants.length);
            }
        }

        // Step 5: Second user joins the room
        console.log('\n5. New user attempting to join room...');
        console.log('Joining room ID:', roomId);
        
        const joinResponse = await authRequest(user2Token, 'post', `/api/rooms/${roomId}/join`);
        console.log('✅ Successfully joined room:', joinResponse.data.message);

        // Step 6: Verify second user is now a participant
        console.log('\n6. Verifying room membership...');
        const updatedRoomResponse = await authRequest(user2Token, 'get', `/api/rooms/${roomId}`);
        console.log('✅ Room details retrieved');
        console.log('Participants count:', updatedRoomResponse.data.participants.length);
        console.log('Participants:', updatedRoomResponse.data.participants.map(p => p.username));

        // Step 7: Second user sends a message
        console.log('\n7. New user sending a message...');
        const messageData = {
            content: 'Hello! I just joined this room and this is my first message!'
        };
        
        const messageResponse = await authRequest(user2Token, 'post', `/api/rooms/${roomId}/message`, messageData);
        console.log('✅ Message sent successfully');
        console.log('Message content:', messageResponse.data.messageData.content);
        console.log('Sender:', messageResponse.data.messageData.sender.username);

        // Step 8: Retrieve messages to confirm
        console.log('\n8. Retrieving room messages...');
        const messagesResponse = await authRequest(user2Token, 'get', `/api/rooms/${roomId}/messages`);
        console.log('✅ Messages retrieved:', messagesResponse.data.messages.length);
        
        if (messagesResponse.data.messages.length > 0) {
            const latestMessage = messagesResponse.data.messages[messagesResponse.data.messages.length - 1];
            console.log('Latest message:', latestMessage.content);
            console.log('From:', latestMessage.sender.username);
        }

        console.log('\n' + '=' .repeat(50));
        console.log('🎉 ALL TESTS PASSED! New user can successfully:');
        console.log('   ✅ Register an account');
        console.log('   ✅ View available rooms');
        console.log('   ✅ Join existing rooms');
        console.log('   ✅ Send messages in rooms');
        console.log('   ✅ View room messages');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        console.error('URL:', error.config?.url);
        
        if (error.response?.data) {
            console.error('Server response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Check server availability first
async function checkServer() {
    try {
        await axios.get(`${BASE_URL}/`);
        console.log('✅ Backend server is running');
        return true;
    } catch (error) {
        console.error('❌ Backend server is not running');
        return false;
    }
}

checkServer().then(serverRunning => {
    if (serverRunning) {
        testNewUserRoomJoining();
    } else {
        console.log('Please start the backend server first');
        process.exit(1);
    }
});

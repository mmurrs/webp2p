import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

// Store connected clients
const clients = new Map();

wss.on('connection', (ws) => {
    let userId = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Handle initial connection
            if (data.type === 'HELLO') {
                userId = data.publicKey;
                clients.set(userId, ws);
                console.log(`Client ${userId} connected`);
                return;
            }

            // Broadcast messages to all other clients
            if (data.type === 'CHAT') {
                const outgoingMessage = JSON.stringify({
                    type: 'CHAT',
                    content: data.content,
                    sender: userId,
                    timestamp: Date.now()
                });

                clients.forEach((client, id) => {
                    if (id !== userId && client.readyState === WebSocket.OPEN) {
                        client.send(outgoingMessage);
                    }
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        if (userId) {
            clients.delete(userId);
            console.log(`Client ${userId} disconnected`);
        }
    });
});

console.log('WebSocket server is running on port 8080');
import { Server } from 'socket.io';

let connections = {};
let messages = {};
let timeLine = {};

 const connectToSocket = (server) => {
  const io = new Server(server,
    {
      cors: {
        origin: 'https://meetly-mgtt.onrender.com',
        methods: ['GET', 'POST'],
        allowedHeaders: ['*'],
        
      }
    }
  );

  io.on('connection', (socket) => {

    console.log("user joined")

    socket.on('join-call', (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }
      if (!connections[path].includes(socket.id)) {
        connections[path].push(socket.id);
        timeLine[socket.id] = new Date();
        connections[path].forEach((userId) => {
          io.to(userId).emit('user-joined', socket.id, connections[path]);
        });
        if (messages[path]) {
          messages[path].forEach(message => {
            io.to(socket.id).emit('chat-message', message.data, message.sender, message.socketId);
          })
        }
      }
    });

    socket.on('signal', (toId, message) => {
      io.to(toId).emit('signal', socket.id, message);
    });

    socket.on('chat-message', (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections)
        .reduce((acc, [roomKey, roomUsers]) => {
          if (roomUsers.includes(socket.id)) {
            return [roomKey, true];
          }
          return acc;
        }, [null, false]);

      if (found) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender,
          data,
          date: new Date(),
          socketId: socket.id
        });




        connections[matchingRoom].forEach((id) => {
          io.to(id).emit('chat-message', data, sender, socket.id);
        });
      }
    });

    socket.on('disconnect', () => {
      for (const [key, users] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
        for (let i = 0; i < users.length; i++) {
          if (users[i] === socket.id) {
            connections[key].forEach((userId) => {
              io.to(userId).emit('user-left', socket.id);
            });

            const index = connections[key].indexOf(socket.id);
            connections[key].splice(index, 1);

            if (connections[key].length === 0) {
              delete connections[key];
              delete messages[key];
              delete timeLine[socket.id];
            }
          }
        }
      }
    });

  });
};


export default connectToSocket;


import dotenv from "dotenv";
dotenv.config();

import { WebSocketServer, WebSocket } from "ws";
import { verifyJWT, JWT_SECRET } from "@repo/common";

const PORT = Number(process.env.PORT) || 8080;

const wss = new WebSocketServer({
  port: PORT,
});

interface OnlineUser {
  userId: string;
  username: string;
  email: string;
  socket: WebSocket;
}

const onlineUsers = new Map<string, OnlineUser>();
const games  = new Map();

wss.on("connection", (socket: WebSocket) => {
  let authenticatedUserId: string | null = null;
  let currentGame = null

  socket.on("message", (event) => {
    try {
      const parseData = JSON.parse(event.toString());

      if (parseData.type === "connect") {
        const token = parseData.token;
        const decoded = verifyJWT(token, JWT_SECRET);

        if (!decoded || !decoded.userId) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Authentication failed. Invalid or expired token.",
            })
          );
          socket.close();
          return;
        }

        authenticatedUserId = decoded.userId;

        onlineUsers.set(authenticatedUserId, {
          userId: decoded.id,
          username: decoded.username,
          email: decoded.email,
          socket,
        });

        socket.send(
          JSON.stringify({
            type: "connected",
            message: "Successfully  and connected",
            user: {
              userId: decoded.userId,
              username: decoded.username,
              email: decoded.email,
            },
          })
        );

        console.log(`User connected: ${decoded.username} (${decoded.userId})`);
      }

      if(parseData.type === "start_game"){ 
        for(const [gameId, game ] of games.entries()){ 
            if(game.status === 'pending'){
                currentGame = game
                break;
            }else{ 
        const newGame =  { 
            admin : authenticatedUserId, 
            user : null,
            status : 'pending',
            questionAns : [] 
        }

        wss.clients.forEach((c) => { 
            if(socket === c ) return; 
            c.send(
                JSON.stringify({ 
                    type : 'game_req',
                    message : ' a new game started ', 
                    newGame,
                    userId : authenticatedUserId
                })
            )
        })
        
      }
        }
      }


    } catch (err) {
      console.error("Error processing websocket message:", err);
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }


    
  });

  socket.on("close", () => {
    if (authenticatedUserId) {
      onlineUsers.delete(authenticatedUserId);
      console.log(`User disconnected: ${authenticatedUserId}`);
    }
  });
});

console.log(`⚡ WebSocket Server running on ws://localhost:${PORT}`);
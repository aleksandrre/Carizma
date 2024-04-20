// Import necessary modules
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { User } from "./models/usersModel.js";
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import productRoutes from "./routes/productsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import bcrypt from "bcryptjs/dist/bcrypt.js";

const PORT = 3001;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/email", emailRoutes);
app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/cart", cartRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Handle private messages
  socket.on(
    "private_message",
    async ({ senderUserId, receiverId, message }) => {
      try {
        // Identify sender and check if it's an admin or a regular user
        const senderUser = await User.findById(senderUserId);
        console.log("1");

        // If the sender is an admin, save the message to the user
        if (senderUser.isAdmin) {
          const newChatMessage = await ChatMessage.create({
            sender: senderUserId,
            receiver: receiverId,
            message,
          });

          io.to(receiverId).emit("private_message", {
            sender: senderUserId,
            message,
            timestamp: newChatMessage.timestamp,
          });
        } else {
          // If the sender is a regular user, save the message to the admin
          const adminUser = await User.findOne({ isAdmin: true });
          const newChatMessage = await ChatMessage.create({
            sender: senderUserId,
            receiver: adminUser._id,
            message,
          });

          io.to(adminUser._id).emit("private_message", {
            sender: senderUserId,
            message,
            timestamp: newChatMessage.timestamp,
          });
        }
      } catch (error) {
        console.error("Error saving chat message:", error);
      }
    }
  );

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// Database connection
mongoose
  .connect("mongodb://localhost:27017/your-database-name", {})
  .then(() => {
    console.log("Successfully connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`App is listening on ${PORT} port`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// async function createAdminUser() {
//   try {
//     // Check if an admin user already exists
//     const existingAdmin = await User.findOne({ isAdmin: true });

//     if (existingAdmin) {
//       console.log("Admin user already exists.");
//       return;
//     }

//     // Generate a random token for email verification

//     // Hash the default admin password using bcrypt
//     const adminPassword = "aleksandre1"; // Change this to a secure password
//     const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

//     // Create a new admin user with the hashed password and email verification token
//     const adminUser = new User({
//       username: "admin", // Change this to the desired admin username
//       password: hashedAdminPassword,
//       email: "admin@example.com", // Change this to the desired admin email
//       isAdmin: true,
//       emailVerified: true,
//     });

//     // Save the admin user to the database
//     await adminUser.save();

//     console.log("Admin user registered successfully.");
//   } catch (error) {
//     console.error("Error creating admin user:", error);
//   }
// }
// createAdminUser();
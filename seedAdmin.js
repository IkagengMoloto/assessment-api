require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await User.findOne({
            email: "admin@test.com"
        });

        if (existingAdmin) {
            console.log("Admin user already exists.");
            process.exit(0);
        }

        const admin = await User.create({
            name: "System Admin",
            email: "admin@test.com",
            password: "Admin123!",
            role: "admin"
        });

        console.log("Admin created successfully:");
        console.log({
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        });

        process.exit(0);

    } catch (error) {
        console.error("Failed to create admin:", error.message);
        process.exit(1);
    }
};

seedAdmin();
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth.routes");
const keyRoutes = require("./src/routes/key.routes");
const adminRoutes = require("./src/routes/admin.routes");
const requestRoutes = require("./src/routes/request.routes");
const transactionRoutes = require("./src/routes/transaction.routes");

const ownerRoutes = require("./src/routes/owner.routes");
const securityRoutes = require("./src/routes/security.routes");
const superAdminRoutes = require("./src/routes/superAdmin.routes");

const errorMiddleware = require("./src/middleware/error.middleware");
const { startOverdueKeysCron } = require("./src/cron/overduekeys");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("Smart Key Backend is running 🚀"));

app.use("/api/auth", authRoutes);
app.use("/api/keys", keyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/superadmin", superAdminRoutes);

// global error handler
app.use(errorMiddleware);

// start cron (optional)
startOverdueKeysCron();

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

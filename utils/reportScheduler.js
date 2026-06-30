const cron = require("node-cron");
const axios = require("axios");
const Sale = require("../models/Sale");
const User = require("../models/User");

// Run daily at 10:00 PM (22:00)
const initScheduler = () => {
  cron.schedule("0 22 * * *", async () => {
    console.log("⏰ Running daily sales report scheduler...");
    try {
      // Get owner email
      const owner = await User.findOne({ role: "owner" });
      if (!owner || !owner.email) {
        console.warn("⚠️ No owner email found to send daily report.");
        return;
      }

      // Time range for today (00:00:00 to 23:59:59)
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      // Fetch today's sales
      const sales = await Sale.find({
        date: { $gte: start, $lte: end }
      });

      if (sales.length === 0) {
        console.log("ℹ️ No sales recorded today. Skipping email report.");
        return;
      }

      // Calculations
      let totalRevenue = 0;
      let totalProfit = 0;
      let totalItems = 0;
      let itemsListHtml = "";

      sales.forEach((s) => {
        totalRevenue += s.total;
        totalProfit += s.profit;
        totalItems += s.quantity;
        itemsListHtml += `<li><strong>${s.productName}</strong>: ${s.quantity} units (Rev: ₹${s.total}, Profit: ₹${s.profit})</li>`;
      });

      // Send via Brevo HTTP API
      await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: {
            name: "Taj Bakery System",
            email: process.env.MAIL_FROM
          },
          to: [{ email: owner.email }],
          subject: `📊 Daily Bakery Sales Report - ${new Date().toLocaleDateString()}`,
          htmlContent: `
            <h2>Daily Sales Summary</h2>
            <p>Here is your sales summary for today, <strong>${new Date().toDateString()}</strong>:</p>
            <hr/>
            <ul>
              <li><strong>Total Revenue</strong>: ₹${totalRevenue.toFixed(2)}</li>
              <li><strong>Total Profit</strong>: ₹${totalProfit.toFixed(2)}</li>
              <li><strong>Total Units Sold</strong>: ${totalItems}</li>
              <li><strong>Total Orders</strong>: ${sales.length}</li>
            </ul>
            <h3>Sold Items Breakdown:</h3>
            <ul>
              ${itemsListHtml}
            </ul>
            <br/>
            <p style="font-size:12px;color:#777;">This is an automated system email from Taj Bakery.</p>
          `
        },
        {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": process.env.BREVO_PASS
          }
        }
      );

      console.log(`✅ Daily sales report email sent successfully to ${owner.email}`);

    } catch (err) {
      console.error("❌ Failed to compile or send daily report:", err.message);
    }
  });
};

module.exports = initScheduler;

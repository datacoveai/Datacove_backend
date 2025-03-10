// import express from "express";
// import {
//   createCheckoutSession,
//   createMembership,
//   webhook,
// } from "../controllers/membership.controller.js";

// import { protectRoute } from "../middleware/protectRoute.js";
// const router = express.Router();

// router.post("/create-membership", async (req, res) => {
//   const { userId, planId, paymentMethodId } = req.body;

//   try {
//     const subscription = await createMembership(
//       userId,
//       planId,
//       paymentMethodId
//     );
//     res.status(200).json({ subscription });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// router.post("/create-checkout-session", protectRoute, createCheckoutSession);
// router.post("/webhook", express.raw({ type: "application/json" }), webhook);

// export default router;

// Step 4: Set up routes
// membershipRoutes.js
import express from "express";

import { protectRoute } from "../middleware/protectRoute.js";
import {
  createCheckoutSession,
  getCurrentSubscription,
  getSessionDetails,
  handleStripeWebhook,
  handleSubscriptionSuccess,
} from "../controllers/membership.controller.js";

const router = express.Router();

// Protected routes (require authentication)
router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.get("/current-subscription", protectRoute, getCurrentSubscription);
router.get("/subscription-success", protectRoute, handleSubscriptionSuccess);
router.get("/get-session-details", getSessionDetails);

// Webhook doesn't need auth - it's called by Stripe
router.post("/webhook", handleStripeWebhook);

export default router;

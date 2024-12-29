import { User, Chapter } from "../models/index.js";
import client from "../helpers/paypal.client.js";
import paypal from "@paypal/checkout-server-sdk";
export const createPayment = async (req, res) => {
  const { chapterId } = req.body;

  try {
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: chapter.price.toString(),
          },
        },
      ],
      application_context: {
        return_url: `https://genesis-greenztls-projects.vercel.app/series/${chapter.seriesId}`,
        cancel_url: `https://genesis-greenztls-projects.vercel.app/${chapter.seriesId}`,
      },
    });

    const order = await client.execute(request);
    res.json({
      id: order.result.id,
      status: order.result.status,
      links: order.result.links,
    });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    res.status(500).json({ message: "Error creating payment order" });
  }
};

export const capturePayment = async (req, res) => {
  const { orderId, userId, chapterId } = req.body;

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client.execute(request);
    if (capture.result.status === "COMPLETED") {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.purchasedChapters.includes(chapterId)) {
        user.purchasedChapters.push(chapterId);
        await user.save();
      }
      res.json({
        message: "Payment successful and chapter added",
        capture,
        chapterId,
      });
    } else {
      res.status(400).json({ message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Error capturing payment:", error);
    res.status(500).json({ message: "Error capturing payment" });
  }
};

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userService } from "../services/User.Service.js";
import { sendEmail } from "../helpers/emailHelper.js"; // Import the email helper
import { generateOTP } from "../helpers/generate-otp.js";
const JWT_SECRET = process.env.JWT_SECRET;

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await userService.read({ email });

    if (existingUser.length > 0) {
      // If user exists and is not verified, resend OTP
      if (!existingUser[0].isVerified) {
        const otp = generateOTP();
        const otpExpiry = Date.now() + 15 * 60 * 1000; // OTP valid for 15 minutes

        // Update user with new OTP and expiry
        await userService.update(existingUser[0]._id, { otp, otpExpiry });

        await sendEmail(email, "Your OTP Code", `Your OTP is: ${otp}`);

        return res.status(200).json({
          message: "User already exists. A new OTP has been sent successfully.",
          data: { _id: existingUser[0]._id },
        });
      } else {
        return res
          .status(400)
          .json({ message: "User already exists and is verified." });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userService.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false, // Set isVerified to false initially
    });

    // Generate and send OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 15 * 60 * 1000; // OTP valid for 15 minutes

    // Update user with OTP and expiry
    await userService.update(newUser._id, { otp, otpExpiry });

    await sendEmail(email, "Your OTP Code", `Your OTP is: ${otp}`);

    res.status(201).json({
      message: "User registered successfully. Check your email for the OTP.",
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Find the user
    const user = await userService.readById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP is valid and not expired
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // If valid, set isVerified to true and clear OTP
    await userService.update(userId, {
      isVerified: true,
      otp: null,
      otpExpiry: null,
    });

    res.status(200).json({
      message: "OTP verified successfully. Your account is now verified.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user
    const user = await userService.read({ email });
    if (user.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if the user is verified
    if (!user[0].isVerified) {
      return res
        .status(403)
        .json({ message: "Account not verified. Please verify your email." });
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a token
    const token = jwt.sign(
      { id: user[0]._id, email: user[0].email },
      JWT_SECRET,
      { expiresIn: "5d" }
    );

    // Send response with user object
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user[0]._id,
        name: user[0].name,
        email: user[0].email,
        isVerified: user[0].isVerified,
        purchasedChapters: user[0].purchasedChapters,
        // Add any other user fields you want to include
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userService.read({ email });
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user);
    if (user[0].isVerified) {
      return res
        .status(404)
        .json({ message: "Already verified! Please login" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await userService.update(user[0]._id, { otp, otpExpiry });

    await sendEmail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

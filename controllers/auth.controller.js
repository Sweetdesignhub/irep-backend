
import {
  authenticateUser,
  refreshAuthToken,
} from "../services/auth.service.js";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/email.util.js";
import prisma from "../config/config.js";
import bcrypt from "bcrypt";

// //register user
// export const registerUser = async (req, res) => {
//   const { name, email, password, confirmPassword, role, termsAccepted } =
//     req.body;

//   try {
//     // 1. Validate input fields
//     if (
//       !name ||
//       !email ||
//       !password ||
//       !confirmPassword ||
//       termsAccepted === undefined
//     ) {
//       return res.status(400).json({
//         success: false,
//         error: "All fields are required.",
//       });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         error: "Passwords do not match.",
//       });
//     }

//     // 2. Check if user already exists
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         error: "A user with this email already exists.",
//       });
//     }

//     // 3. Validate role
//     const allowedRoles = ["USER", "ADMIN"];
//     if (role && !allowedRoles.includes(role)) {
//       return res.status(400).json({
//         success: false,
//         error: `Invalid role. Allowed roles are: ${allowedRoles.join(", ")}`,
//       });
//     }

//     // 4. Hash the password
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     // 5. Create the user
//     const newUser = await prisma.user.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         role: role || "USER", // Default role is USER
//         termsAccepted,
//       },
//     });

//     // 6. Create a default organization for the user
//     const defaultOrganization = await prisma.organization.create({
//       data: {
//         name: "Default Organization",
//         description: "Automatically created for the user",
//         owner: { connect: { id: newUser.id } },
//       },
//     });

//     // 7. Generate an email verification token
//     const emailVerificationToken = jwt.sign(
//       { userId: newUser.id },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     // 8. Generate the email verification URL
//     const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${emailVerificationToken}`;

//     // 9. Send verification email
//     const emailHTML = `
//       <html>
//         <body>
//           <h2>Welcome to Our Platform, ${name}!</h2>
//           <p>Please verify your email by clicking the link below:</p>
//           <a href="${verificationUrl}">Verify Email</a>
//           <p>If you did not register, you can safely ignore this email.</p>
//         </body>
//       </html>
//     `;
//     await sendVerificationEmail(email, emailHTML);

//     // 10. Respond with success
//     res.status(201).json({
//       success: true,
//       message:
//         "Registration successful. Please check your email for verification.",
//       userId: newUser.id,
//       organizationId: defaultOrganization.id,
//     });
//   } catch (error) {
//     console.error("Error during registration:", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal Server Error",
//     });
//   }
// };

// send email verification mail to users
// export const verifyEmail = async (req, res) => {
//   const { token } = req.query;

//   if (!token) {
//     return res.status(400).json({
//       success: false,
//       error: "Token is required",
//     });
//   }

//   try {
//     // Decode the token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Find the user by ID
//     const user = await prisma.user.findUnique({
//       where: { id: decoded.userId },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: "User not found",
//       });
//     }

//     // Mark email as verified
//     await prisma.user.update({
//       where: { id: user.id },
//       data: { emailVerified: true },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Email verified successfully",
//     });
//   } catch (error) {
//     console.error("Error verifying email:", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal Server Error",
//     });
//   }
// };

// Sign-In
export const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { accessToken, refreshToken, user } = await authenticateUser(
      email,
      password
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
    };

    res.cookie("refreshToken", refreshToken, options);
    res.cookie("accessToken", accessToken, options);

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      message: "Sign-in successful",
    });
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
};


export const validateToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      res.status(200).json({ message: "Token is valid", user: decoded });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Refresh Token
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, error: "Refresh token is required" });
  }

  try {
    const { accessToken } = refreshAuthToken(refreshToken);
    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired refresh token" });
  }
};

// Sign-Out
export const signOut = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res
    .status(200)
    .json({ success: true, message: "Successfully signed out" });
};

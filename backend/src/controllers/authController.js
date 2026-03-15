import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {

  const { name, email, password } = req.body;

  try {

    const existingUser = await User.findOne({ email });

    // Check if user already exists
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // hashing password with bcrypt

    //create new user with hashed password
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};


export const loginUser = async (req,res) => {
    const { email, password } = req.body;
    try{
        const user = await User.findOne({ email });
        // check if user exists
        if(!user){
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        // Compare provided password with hashed password in database
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        // create jwt tocken
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    }catch(error){
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
}

export const getProfile = async (req, res) => {

  try {

    const user = await User.findById(req.user.userId).select("-password"); // Exclude password from response

    res.status(200).json(user);

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });

  }

};
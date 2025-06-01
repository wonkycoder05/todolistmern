import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Users from '../models/users.js';
import { userSendMail } from './userSendMail.js';

const { DEFAULT_CLIENT_URL } = process.env


/// check password and confirmPassword
function isMatch(password, confirm_password) {
    if (password === confirm_password) return true
    return false
}

// validate email
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

// validate password
function validatePassword(password) {
    const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/
    return re.test(password)
}


// user sign-up
export const signUp = async (req, res) => {
    try {
        const { personal_id, name, email, password, confirmPassword, address, phone_number } = req.body;

        if (!personal_id || !name || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }

        if (name.length < 3) return res.status(400).json({ message: "Your name must be at least 3 letters long" });

        if (!isMatch(password, confirmPassword)) return res.status(400).json({ message: "Password did not match" });

        if (!validateEmail(email)) return res.status(400).json({ message: "Invalid emails" });

        if (!validatePassword(password)) {
            return res.status(400).json({
                message: "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters"
            });
        }

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "This email is already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            personal_id,
            name,
            email,
            password: hashedPassword,
            address,
            phone_number
        };

        // create email notification for user activation
        const refreshToken = createRefreshToken(newUser)

        const url = `${DEFAULT_CLIENT_URL}/user/activate/${refreshToken}`;

        userSendMail(email, url, "Verify your email address", "Confirm Email")

        res.json({ message: "Register Success! Please activate your email to start" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// create refresh token
function createRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d'} )
}

// email activation
export const activateEmail = async (req, res) => {
    try {
        const { activation_token } = req.body;
        const user = jwt.verify(activation_token, process.env.REFRESH_TOKEN_SECRET)

        const { personal_id, name, email, password, address, phone_number } = user

        const existingUser = await Users.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "This email already exists." });
        }

        const newUser = new Users({
            personal_id,
            name,
            email,
            password,
            address,
            phone_number
        })

        await newUser.save()

        res.json({ message: "Account has been activated. Please login now!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// user sign-in
export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Users.findOne({ email })

        if (!email || !password) return res.status(400).json({ message: "Please fill in all fields" })

        if (!user) return res.status(400).json({ message: "Invalid Credentials" })

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" })

        const refresh_token = createRefreshToken({ id: user._id })

        const expiry = 24 * 60 * 60 * 1000 // 1 day

        res.cookie('refreshtoken', refresh_token, {
            httpOnly: true,
            path: '/api/user/refresh_token',
            maxAge: expiry,
            expires: new Date(Date.now() + expiry)
        })

        res.json({
            message: "Sign In successfully!",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// user information
export const userInfor = async (req, res) => {
    try {
        const userId = req.user.id
        const userInfor = await Users.findById(userId).select("-password")

        res.json(userInfor)
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


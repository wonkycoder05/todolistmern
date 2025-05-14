import express from 'express';
import { signIn, signUp, userInfor } from '../controllers/users.js';
import { auth } from '../middleware/auth.js';

const router = express.Router()

router.get("/user-infor", auth, userInfor)

router.post("/signup", signUp)
router.post("/signin", signIn)

export default router
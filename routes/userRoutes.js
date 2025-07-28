import express from 'express';
import { auth } from "../middlewares/Auth.js";
import { getUserCreations, getLikeCreation, getPublishedCreations } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/get-user-creations', auth, getUserCreations);
userRouter.get('/get-published-creations', auth, getPublishedCreations);
userRouter.post('/like-creation', auth, getLikeCreation);

export default userRouter;
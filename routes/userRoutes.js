import express from 'express';
import { auth } from "../middlewares/Auth.js";
import { getUserCreations, getLikeCreation, getPublishedCreations, getUserStats, getUserPlan, deleteCreation, togglePublish } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/get-user-creations', auth, getUserCreations);
userRouter.get('/get-user-stats', auth, getUserStats);
userRouter.get('/get-user-plan', auth, getUserPlan);
userRouter.get('/get-published-creations', auth, getPublishedCreations);
userRouter.post('/like-creation', auth, getLikeCreation);
userRouter.delete('/delete-creation/:id', auth, deleteCreation);
userRouter.patch('/toggle-publish/:id', auth, togglePublish);

export default userRouter;
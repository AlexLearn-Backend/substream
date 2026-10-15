import { Router } from "express";

import {
  createUser, deleteUser,
  getUser, getUsers,
  updateUser
} from "../controllers/user.controllers.js";


const userRouter = Router();


userRouter.get('/', getUsers);
userRouter.get('/:id', getUser);
userRouter.post('/', createUser);
userRouter.patch('/:id', updateUser);
userRouter.delete('/:id', deleteUser);


export default userRouter;
import { Router } from "express";
import {
  cancelSubscription, createSubscription,
  deleteSubscription, getSubscription,
  getSubscriptions, getUpcomingRenewals,
  updateSubscription, getUserSubscriptions
} from "../controllers/subscription.controllers.js";


const subscriptionRouter = Router();


subscriptionRouter.get('/', getSubscriptions);
subscriptionRouter.get('/upcoming-renewals', getUpcomingRenewals);
subscriptionRouter.get('/:id', getSubscription);
subscriptionRouter.post('/', createSubscription);
subscriptionRouter.patch('/:id', updateSubscription);
subscriptionRouter.delete('/:id', deleteSubscription);
subscriptionRouter.get('/user/:id', getUserSubscriptions);
subscriptionRouter.patch('/:id/cancel', cancelSubscription);


export default subscriptionRouter;
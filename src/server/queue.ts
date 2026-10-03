import { deliverOrder } from "@/lib/orders";

export async function enqueueDelivery(orderId: string) {
  await deliverOrder(orderId);
}

import { Expo } from "expo-server-sdk";
import db from "@/lib/db";

const expo = new Expo();

export async function sendPushNotification({
  employeeId,
  title,
  body,
  data,
}: {
  employeeId: string;
  title: string;
  body: string;
  data?: any;
}) {
  try {
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: { expoPushToken: true },
    });

    if (
      !employee?.expoPushToken ||
      !Expo.isExpoPushToken(employee.expoPushToken)
    ) {
      if (employee?.expoPushToken) {
        console.error(`Invalid Push token: ${employee.expoPushToken}`);
      } else {
        console.log(`No push token found for employee ${employeeId}`);
      }
      return;
    }

    // 3. Construct the Message
    const messages = [
      {
        to: employee.expoPushToken,
        sound: "default" as const,
        title: title,
        body: body,
        data: data || {},
        priority: "high" as const,
        channelId: "default_v4",
      },
    ];

    // 4. Send the Notification
    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("Push notification sent:", ticketChunk);
      } catch (error) {
        console.error("Error sending push chunk:", error);
      }
    }
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
  }
}
export async function sendPushToUser({
  userId,
  title,
  body,
  data,
}: {
  userId: string;
  title: string;
  body: string;
  data?: any;
}) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        employee: { select: { expoPushToken: true } },
        // freeLancer: { select: { expoPushToken: true } } // TODO: Add to FreeLancer schema if needed
      },
    });

    const token = user?.employee?.expoPushToken;

    if (!token || !Expo.isExpoPushToken(token)) {
      console.log(`No valid push token for user ${userId}`);
      return;
    }

    const messages = [
      {
        to: token,
        sound: "default" as const,
        title,
        body,
        data: data || {},
        priority: "high" as const,
        channelId: "default_v4",
      },
    ];

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    console.error("Error in sendPushToUser:", error);
  }
}

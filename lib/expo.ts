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

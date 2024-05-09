import path from "path";
import { app, ipcMain, shell } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";

import puppeteer from "puppeteer";
import { Client } from "@notionhq/client";
import moment from "moment";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isProd) {
    mainWindow.setMenu(null);
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    // mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("openExternal", async (event, path) => {
  try {
    shell.openExternal(path);
  } catch (error) {
    event.reply("toastError", `${error}`);
  }
});

ipcMain.on("loginShopee", async (event, newPath) => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: newPath,
      userDataDir: "./data/session",
    });
    const page = await browser.newPage();
    await page.goto("https://shopee.vn");
  } catch (error) {
    event.reply("toastError", `${error}`);
  }
});

ipcMain.on("testChromeApp", async (event, newPath) => {
  try {
    const browser = await puppeteer.launch({ executablePath: newPath });
    await browser.close();
    event.reply("testChromeApp", "OK");
  } catch (error) {
    event.reply("testChromeAppError", `${error}`);
  }
});

ipcMain.on("testNotionConnect", async (event, params) => {
  const { notionApiKey, notionPageId } = params;

  try {
    const notion = new Client({ auth: notionApiKey });
    await notion.pages.retrieve({ page_id: notionPageId });
    event.reply("testNotionConnect", "OK");
  } catch (error) {
    event.reply("testNotionConnectError", `${error}`);
  }
});

ipcMain.on("scrapeCart", async (event, params) => {
  const { chromeApp, notionApiKey, notionPageId } = params;

  try {
    const browser = await puppeteer.launch({
      executablePath: chromeApp,
      userDataDir: "./data/session",
    });
    const page = await browser.newPage();
    await page.goto("https://shopee.vn/");

    const api =
      "https://shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=20&offset=";
    const urls = Array.from({ length: 1000 }, (_, i) => `${api}${i * 20}`);

    const rawData = [];

    let index = 0;
    let isStop = false;
    let chunkData = [];
    const chunkSize = 5;
    do {
      chunkData = await Promise.all(
        urls
          .slice(index, index + chunkSize)
          .map((url) =>
            page.evaluate((url) => fetch(url).then((res) => res.json()), url)
          )
      );

      if (
        index === 1 ||
        chunkData.every((data) => data.data.next_offset === -1)
      ) {
        isStop = true;
      }

      if (!isStop) rawData.push(...chunkData);

      index += 1;
    } while (!isStop);

    await browser.close();

    const orderDataRaw = rawData
      .map((data) => data.data.order_data.details_list)
      .filter((data) => data)
      .flat();
    const orderItems = orderDataRaw.map((order) => ({
      ctime: order.shipping?.tracking_info.ctime,
      order_id: order.info_card.order_id,
      final_total: order.info_card.final_total,
      status: order.status.status_label.text,
      delivery: order.shipping?.tracking_info.description,
      shop_name: order.info_card.order_list_cards[0].shop_info.shop_name,
      products: order.info_card.order_list_cards[0].product_info.item_groups
        .map((group) => group.items.map((product) => product.name))
        .flat(),
    }));

    const notion = new Client({ auth: notionApiKey });
    const pageBlocks = await notion.blocks.children.list({
      block_id: notionPageId,
    });
    const pageOrder = pageBlocks.results.find(
      (object: any) =>
        object.type === "child_database" &&
        object.child_database.title === "Đơn hàng Shopee"
    );

    let pageOrderId = pageOrder?.id;
    if (!pageOrder) {
      const newDatabase = await notion.databases.create({
        icon: { type: "emoji", emoji: "📑" },
        parent: { type: "page_id", page_id: notionPageId },
        title: [{ type: "text", text: { content: "Đơn hàng Shopee" } }],
        properties: {
          "Mã DH": { rich_text: {} },
          "Đơn hàng": { title: {} },
          "Tên Shop": { rich_text: {} },
          "Sản phẩm": { rich_text: {} },
          "Trạng thái": { rich_text: {} },
          "Vận chuyển": { rich_text: {} },
          "Thanh toán": { number: { format: "number_with_commas" } },
        },
      });

      pageOrderId = newDatabase.id;
    }

    const database = await notion.databases.query({
      database_id: pageOrderId,
    });
    const pages = database.results.filter((item) => item.object === "page");

    await Promise.all(
      orderItems.map((orderItem) => {
        const findPage = pages.find(
          (page: any) =>
            page.properties["Mã DH"].rich_text[0].plain_text.includes(`${orderItem.order_id}`)
        );

        const orderTime = orderItem.ctime
          ? moment(new Date(orderItem.ctime * 1000)).format("MM.YYYY")
          : "#";
        const orderName = `${orderTime}-${orderItem.products.join("-")}`;

        let statusName = "";
        switch (orderItem.status) {
          case "label_on_the_way":
            statusName = "Đơn hàng đang giao";
            break;
          case "label_order_completed":
            statusName = "Đơn hàng đã giao";
            break;
          case "label_order_cancelled":
            statusName = "Đơn hàng đã hủy";
            break;
          case "label_waiting_pickup":
            statusName = "Đơn hàng đang chờ lấy";
            break;
          case "label_preparing_order":
            statusName = "Đơn hàng đang chuẩn bị";
            break;
          default:
            break;
        }

        if (findPage) {
          return notion.pages.update({
            page_id: findPage.id,
            properties: {
              "Mã DH": {
                rich_text: [{ text: { content: `${orderItem.order_id}` } }],
              },
              "Đơn hàng": {
                title: [{ text: { content: orderName } }],
              },
              "Tên Shop": {
                rich_text: [{ text: { content: orderItem.shop_name } }],
              },
              "Sản phẩm": {
                rich_text: [
                  { text: { content: orderItem.products.join(", ") } },
                ],
              },
              "Trạng thái": {
                rich_text: [{ text: { content: statusName } }],
              },
              "Vận chuyển": {
                rich_text: [{ text: { content: orderItem.delivery || "" } }],
              },
              "Thanh toán": { number: orderItem.final_total / 100000 },
            },
          });
        }

        return notion.pages.create({
          parent: { database_id: pageOrderId },
          properties: {
            "Mã DH": {
              rich_text: [{ text: { content: `${orderItem.order_id}` } }],
            },
            "Đơn hàng": {
              title: [{ text: { content: orderName } }],
            },
            "Tên Shop": {
              rich_text: [{ text: { content: orderItem.shop_name } }],
            },
            "Sản phẩm": {
              rich_text: [{ text: { content: orderItem.products.join(", ") } }],
            },
            "Trạng thái": {
              rich_text: [{ text: { content: statusName } }],
            },
            "Vận chuyển": {
              rich_text: [{ text: { content: orderItem.delivery || "" } }],
            },
            "Thanh toán": { number: orderItem.final_total / 100000 },
          },
        });
      })
    );

    event.reply("scrapeCart", "OK");
  } catch (error) {
    console.log(error);
    event.reply("scrapeCartError", `${error}`);
  }
});

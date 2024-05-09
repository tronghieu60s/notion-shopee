import { shell } from "electron";
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { Cardano, Chrome, FolderConnection, Login } from "iconsax-react";
import Head from "next/head";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function HomePage() {
  const [input, setInput] = useState({
    chromeApp: "",
    notionApiKey: "",
    notionPageId: "",
  });

  const [checkedScrapeCart, setCheckedScrapeCart] = useState(false);
  const [checkedScrapeOrder, setCheckedScrapeOrder] = useState(true);

  useEffect(() => {
    const newInput = JSON.parse(localStorage.getItem("_input.cache")) || "{}";
    setInput(newInput);
  }, []);

  useEffect(() => {
    localStorage.setItem("_input.cache", JSON.stringify(input));
  }, [input]);

  useEffect(() => {
    window.ipc.on("toastError", (message: string) => {
      toast.error(message);
    });
  }, []);

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  }, []);

  const onLoginShopee = useCallback(() => {
    window.ipc.send("loginShopee", input.chromeApp);
  }, [input.chromeApp]);

  const onTestChromeApp = useCallback(() => {
    toast.promise(
      new Promise((resolve, reject) => {
        window.ipc.send("testChromeApp", input.chromeApp);
        window.ipc.on("testChromeAppError", (message: string) => {
          reject(message);
        });
        window.ipc.on("testChromeApp", (message: string) => {
          if (message === "OK") {
            resolve("OK");
          }
          reject("Error");
        });
      }),
      { loading: "Loading", success: "Success", error: (error) => error }
    );
  }, [input.chromeApp]);

  const onTestNotionConnect = useCallback(() => {
    toast.promise(
      new Promise((resolve, reject) => {
        window.ipc.send("testNotionConnect", {
          notionApiKey: input.notionApiKey,
          notionPageId: input.notionPageId,
        });
        window.ipc.on("testNotionConnectError", (message: string) => {
          reject(message);
        });
        window.ipc.on("testNotionConnect", (message: string) => {
          if (message === "OK") {
            resolve("OK");
          }
          reject("Error");
        });
      }),
      { loading: "Loading", success: "Success", error: (error) => error }
    );
  }, [input.notionApiKey, input.notionPageId]);

  const onScrapeData = useCallback(async () => {
    if (checkedScrapeCart) {
    }

    if (checkedScrapeOrder) {
      await toast.promise(
        new Promise((resolve, reject) => {
          window.ipc.send("scrapeCart", {
            chromeApp: input.chromeApp,
            notionApiKey: input.notionApiKey,
            notionPageId: input.notionPageId,
          });
          window.ipc.on("scrapeCartError", (message: string) => {
            reject(message);
          });
          window.ipc.on("scrapeCart", (message: string) => {
            if (message === "OK") {
              resolve("OK");
            }
            reject("Error");
          });
        }),
        { loading: "Loading", success: "Success", error: (error) => error }
      );
    }
  }, [
    input.chromeApp,
    input.notionApiKey,
    input.notionPageId,
    checkedScrapeCart,
    checkedScrapeOrder,
  ]);

  return (
    <div className="flex flex-row justify-between gap-10 p-3">
      <Head>
        <title>Notion Shopee</title>
      </Head>
      <Toaster />
      <div className="w-1/2 flex flex-col gap-5">
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Tools được chia sẻ miễn phí và phi lợi nhuận, mọi hình thức thu phí
          đều là lừa đảo. Chúc bạn có trải nghiệm vui.
        </div>
        <div className="w-full lg:w-2/3 flex flex-col gap-3">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="chromeApp" value="Chrome App" />
            </div>
            <TextInput
              id="chromeApp"
              name="chromeApp"
              type="text"
              placeholder="Please enter path of chrome.exe..."
              value={input.chromeApp}
              onChange={onChange}
              helperText="The application uses Chrome to scrape data so you need to type the correct path of Chrome."
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="notionApiKey" value="Notion API Key *" />
            </div>
            <TextInput
              id="notionApiKey"
              name="notionApiKey"
              type="text"
              placeholder="Please enter your Notion API Key..."
              value={input.notionApiKey}
              onChange={onChange}
              helperText={
                <span>
                  The application requires permission to "read" and "write" to
                  your account in Notion, so the app requires an API Key.
                  <a
                    href="#"
                    className="ml-1 font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                    onClick={() =>
                      window.ipc.send(
                        "openExternal",
                        "https://www.notion.so/my-integrations"
                      )
                    }
                  >
                    Learn more »
                  </a>
                  .
                </span>
              }
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="notionPageId" value="Notion Page Id *" />
            </div>
            <TextInput
              id="notionPageId"
              name="notionPageId"
              type="text"
              placeholder="Please enter your Notion Page Id..."
              value={input.notionPageId}
              onChange={onChange}
              helperText={
                <span>
                  By default, Notion is only allowed to use data from an
                  authorized page, so the app requires a Page Id.
                  <a
                    href="#"
                    className="ml-1 font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                    onClick={() =>
                      window.ipc.send(
                        "openExternal",
                        "https://github.com/tronghieu60s/notion-shopee/blob/master/README.md"
                      )
                    }
                  >
                    Learn more »
                  </a>
                  .
                </span>
              }
            />
          </div>
        </div>
      </div>
      <div className="w-1/2 flex flex-col gap-5">
        <div className="flex flex-row justify-end">
          <Button color="blue" onClick={onLoginShopee}>
            <span>Login Shopee</span>
            <Login size={20} className="ml-2" />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <Button color="blue" onClick={onTestChromeApp}>
              <Chrome size={20} className="mr-2" />
              <span>Test Chrome</span>
            </Button>
            <Button color="blue" onClick={onTestNotionConnect}>
              <FolderConnection size={20} className="mr-2" />
              <span>Test Notion Connect</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {/* <div className="flex items-center gap-2">
            <Checkbox
              id="scrapeCart"
              checked={checkedScrapeCart}
              onChange={(event) => setCheckedScrapeCart(event.target.checked)}
            />
            <Label htmlFor="scrapeCart">Scrape Cart</Label>
          </div> */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="scrapeOrder"
              checked={checkedScrapeOrder}
              onChange={(event) => setCheckedScrapeOrder(event.target.checked)}
            />
            <Label htmlFor="scrapeOrder">Scrape Order</Label>
          </div>
        </div>
        <div>
          <Button color="dark" onClick={onScrapeData}>
            <Cardano size={20} className="mr-2" />
            <span>Run Scrape Data</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Button, Checkbox, FileInput, Label, TextInput } from "flowbite-react";
import { Cardano, Chrome, FolderConnection, Login } from "iconsax-react";

export default function HomePage() {
  const execute = async () => {
    window.ipc.send("pathUpdate", "hihi");
  };

  return (
    <div className="flex flex-row justify-between gap-10 p-3">
      <div className="w-1/2">
        <div className="w-full lg:w-1/2 flex flex-col gap-3">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="file" value="Chrome App *" />
            </div>
            <FileInput
              id="file"
              accept=".exe"
              helperText="This is a mandatory requirement, the application uses Chrome to scrape data so you need to choose the correct path."
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="notionApiKey" value="Notion API Key" />
            </div>
            <TextInput
              id="notionApiKey"
              type="text"
              placeholder="Please enter your Notion API Key..."
              required
              helperText={
                <span>
                  The application requires permission to "read" and "write" to
                  your Notion, so the app requires an API Key. How to get Notion
                  API Key
                  <a
                    href="https://github.com/tronghieu60s/notion-shopee/blob/master/README.md"
                    className="ml-1 font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                  >
                    here
                  </a>
                  .
                </span>
              }
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="notionPageId" value="Notion Page Id" />
            </div>
            <TextInput
              id="notionPageId"
              type="text"
              placeholder="Please enter your Notion Page Id..."
              required
              helperText={
                <span>
                  By default, Notion is only allowed to use data from an
                  authorized page, so the app requires a Page Id. How to get
                  Notion Page Id
                  <a
                    href="https://github.com/tronghieu60s/notion-shopee/blob/master/README.md"
                    className="ml-1 font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                  >
                    here
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
          <Button color="blue">
            <span>Login</span>
            <Login size={20} className="ml-2" />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <span>Please perform a system check before operating.</span>
          <div className="flex flex-row gap-2">
            <Button color="blue">
              <Chrome size={20} className="mr-2" />
              <span>Test Chrome</span>
            </Button>
            <Button color="blue">
              <FolderConnection size={20} className="mr-2" />
              <span>Test Notion Connect</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Checkbox id="scrapeCart" />
            <Label htmlFor="scrapeCart">Scrape Cart</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="scrapeOrder" checked />
            <Label htmlFor="scrapeOrder">Scrape Order</Label>
          </div>
        </div>
        <div>
          <Button color="dark">
            <Cardano size={20} className="mr-2" />
            <span>Run Scrape Data</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

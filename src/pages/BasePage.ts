import{Page} from "@playwright/test";
import { UtilElementAction } from "../utils/utilElementActions";
import { createLogger,type Logger } from "../utils/logger";

//The keyword abstract tells TypeScript that you cannot directly create an instance of BasePage.

export abstract class BasePage{
    protected readonly page:Page;
    protected readonly el:UtilElementAction;
    protected readonly log:Logger;

    protected constructor(page:Page,scope:string)
    {
        this.page=page;
        this.el=new UtilElementAction(page,scope);
        this.log=createLogger(scope);
    }

    protected async goto(relativePath:string):Promise<void>{
        await this.page.goto(relativePath);
        await this.page.waitForLoadState('domcontentloaded');
    }
}
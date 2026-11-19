import{test as base,expect} from "@playwright/test";
import { LoginPage} from "../pages/LoginPage";
import { ItemDetailPage } from "../pages/ItemDetailPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutStepOnePage } from "../pages/CheckoutStepOnePage";
import { CheckoutStepTwoPage } from "../pages/CheckoutSteptwoPage";
import { CheckoutCompletePage } from "../pages/CheckoutCompletePage";
import loginTestData from "../testdata/loginTestData.json";
import { InventoryPage } from "../pages/InventoryPage";

type loginRecord={
    username:string;
    password:string;
};

export type InvalidLoginState={
    loginPage:LoginPage;
    username:string;
};

export type SelectedItemState={
    inventoryPage:InventoryPage;
    itemId:string;
};
const users=loginTestData as loginRecord[];
const validUser=users.find(({username})=>username==='standard_user');
const invalidUer=users.find(({username})=>username==='locked_out_user');
const Selected_item_id='test-allthethings-tshirt-red';

if(!validUser || !invalidUer)
{
    throw new Error('Required standard_user and locked_out_user test data is missing');
}

export type Testixture={
    //page objects
    loginPage: LoginPage;
    inventoryPage: InventoryPage;
    itemDetailPage: ItemDetailPage;
    cartPage: CartPage;
    checkoutStepOnePage: CheckoutStepOnePage;
    checkoutStepTwoPage: CheckoutStepTwoPage;
    checkoutCompletePage: CheckoutCompletePage;

     // Ready-to-use application states
      invalidLogin: InvalidLoginState;
    validLogin: LoginPage;
    loginWithInventory: InventoryPage;
    loginWithSelectedItem: SelectedItemState
};
 export const test=base.extend<Testixture>({
    loginPage:async({page},use)=>{
        await use (new LoginPage(page));
    },
    inventoryPage: async ({ page }, use) => {
        await use(new InventoryPage(page));
    },
    cartPage: async ({ page }, use) => {
        await use(new CartPage(page));
    },
    checkoutStepOnePage: async ({ page }, use) => {
        await use(new CheckoutStepOnePage(page));
    },
    checkoutStepTwoPage: async ({ page }, use) => {
        await use(new CheckoutStepTwoPage(page));
    },
    checkoutCompletePage: async ({ page }, use) => {
        await use(new CheckoutCompletePage(page));
    },
     // Independent negative state: the locked-out account remains on login.
     invalidLogin:async({page,loginPage},use)=>{
        await loginPage.open();
        await loginPage.loginAs(invalidUer.username,invalidUer.password);
        await expect(page.locator('[data-test="error"]')).toBeVisible();
        await use({loginPage,username:invalidUer.username});
     },

      // Successful authentication state.
     validLogin:async({loginPage},use)=>{//page is not used becoz loginPage has inbuilt page
        await loginPage.open();
        await loginPage.loginAs(validUser.username,validUser.password);
        await loginPage.waitForLoginButtonHidden();
        await use(loginPage);
    },
        // Depends on validLogin and guarantees that inventory is loaded.
        loginWithInventory:async({validLogin,inventoryPage},use)=>{
            await inventoryPage.assertLoaded();
            await use(inventoryPage);
        },

          // Depends on inventory and guarantees that one item is in the cart.
          loginWithSelectedItem:async({loginWithInventory},use)=>{
            await loginWithInventory.addToCart(Selected_item_id);
            await use({inventoryPage:loginWithInventory,itemId:Selected_item_id})
          },

 })
 export{expect}
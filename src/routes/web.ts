import express, { Express } from 'express';
import { NextFunction, Request, Response } from "express";
import { fileUploadMiddleware, productUploadMiddleware } from 'src/middleware/multer';
import passport from 'passport';
import { isAdmin, isLogin } from 'src/middleware/auth';
import { getAdminBrandPage, getAdminCategoryPage, getAdminOrderPage, getAdminProductPage, getAdminUserPage, getDashboardPage } from 'controllers/admin/dashboard.controller';
import { getAdminCreateUserPage, getAdminViewUserPage, postAdminCreateUser, postAdminDeleteUser, postAdminUpdateUser } from 'controllers/admin/admin.user.controller';
import { getAdminCreateCategoryPage, getAdminViewCategoryPage, postAdminCreateCategory, postAdminDeleteCategory, postAdminUpdateCategory } from 'controllers/admin/admin.category.controller';
import { getAdminCreateBrandPage, getAdminViewBrandPage, postAdminCreateBrand, postAdminDeleteBrand, postAdminUpdateBrand } from 'controllers/admin/admin.brand.controller';
import { getAdminCreateProductPage, getAdminViewProductPage, postAdminCreateProduct, postAdminDeleteProduct, postAdminUpdateProduct } from 'controllers/admin/admin.product.controller';
import { getCardPage, getCheckOutPage, getDetailProductPage, getHomePage, getLoginPage, getOrderHistoryPage, getRegisterPage, getSuccessRedirectPage, getThanksPage, postAddProductToCart, postDeleteProductInCart, postHandleCartToCheckOut, postLogout, postPlaceOrder, postRegister } from 'controllers/user/user.controller';
import { getAdminViewOrderPage } from 'controllers/admin/admin.order.controller';


const router = express.Router();

const webRoutes = (app: Express) => {
    // User routes
    router.get("/", getHomePage);

    router.get("/register", isLogin, getRegisterPage);
    router.post("/register", postRegister);
    
    router.get("/login", isLogin, getLoginPage);
    router.post('/login', (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate('local', (err: any, user: any, info: any) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                const session = req.session as any;
                session.messages = [info?.message || 'Email hoặc mật khẩu không chính xác!'];
                return req.session.save((saveErr) => {
                    if (saveErr) return next(saveErr);
                    return res.redirect('/login');
                });
            }

            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    return next(loginErr);
                }
                return req.session.save((saveErr) => {
                    if (saveErr) return next(saveErr);
                    return res.redirect('/success-redirect');
                });
            });
        })(req, res, next);
    });
    router.get("/success-redirect", getSuccessRedirectPage);
    router.post("/logout", postLogout);
    
    router.get("/detail-product/:id", getDetailProductPage);

    //cart
    router.post("/add-product-to-cart/:id", postAddProductToCart);
    router.post("/delete-product-in-cart/:id", postDeleteProductInCart);
    router.get("/cart", getCardPage);
    router.post("/handle-cart-to-checkout", postHandleCartToCheckOut);

    router.get("/checkout", getCheckOutPage);
    
    router.post("/place-order", postPlaceOrder);
    router.get("/thanks", getThanksPage);
    router.get("/order-history", getOrderHistoryPage);

    // Admin routes
    router.get("/admin", getDashboardPage);
    router.get("/admin/user", getAdminUserPage);
    router.get("/admin/category", getAdminCategoryPage);
    router.get("/admin/brand", getAdminBrandPage);
    router.get("/admin/product", getAdminProductPage);
    router.get("/admin/order", getAdminOrderPage);

    router.get("/admin/create-user", getAdminCreateUserPage);
    router.post("/admin/handle-create-user", fileUploadMiddleware("avatar"), postAdminCreateUser);
    router.get("/admin/handle-view-user/:id", getAdminViewUserPage);
    router.post("/admin/handle-update-user", fileUploadMiddleware("avatar"), postAdminUpdateUser);
    router.post("/admin/handle-delete-user/:id", postAdminDeleteUser);

    router.get("/admin/create-category", getAdminCreateCategoryPage);
    router.post("/admin/handle-create-category", postAdminCreateCategory);
    router.get("/admin/handle-view-category/:id", getAdminViewCategoryPage);
    router.post("/admin/handle-update-category", postAdminUpdateCategory);
    router.post("/admin/handle-delete-category/:id", postAdminDeleteCategory);

    router.get("/admin/create-brand", getAdminCreateBrandPage);
    router.post("/admin/handle-create-brand", fileUploadMiddleware("logo", "images/brand"), postAdminCreateBrand)
    router.get("/admin/handle-view-brand/:id", getAdminViewBrandPage);
    router.post("/admin/handle-update-brand", fileUploadMiddleware("logo", "images/brand"), postAdminUpdateBrand)
    router.post("/admin/handle-delete-brand/:id", postAdminDeleteBrand);

    router.get("/admin/create-product", getAdminCreateProductPage);
    router.post("/admin/handle-create-product", productUploadMiddleware("images/product"), postAdminCreateProduct);
    router.get("/admin/handle-view-product/:id", getAdminViewProductPage);
    router.post("/admin/handle-update-product", productUploadMiddleware("images/product"), postAdminUpdateProduct);
    router.post("/admin/handle-delete-product/:id", postAdminDeleteProduct);

    router.get("/admin/handle-view-order/:id", getAdminViewOrderPage);


    app.use("/", isAdmin, router);
}

export default webRoutes;
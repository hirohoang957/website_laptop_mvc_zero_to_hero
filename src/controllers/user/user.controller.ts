import { NextFunction, Request, Response } from "express";
import { getAllProducts, getProducts, getProductById } from "services/admin/admin.product.service";
import { getAllBrands, getAllCategories, getAllOrders, getOrderDetailAdmin } from "services/admin/admin.service";
import { registerNewUser } from "services/user/auth.service";
import { addProductToCart, deleteProductInCart, getAllOrderById, getBestSellingProducts, getCartDetailByUserId, getProductRecommendation, handlePlaceOrder, updateCartDetailBeforeCheckout } from "services/user/user.service";
import { AdminUserSchema, TAdminUserSchema } from "src/validation/admin.user.schema";

const getHomePage = async (req: Request, res: Response) => {
    const products = await getProducts();
    const bestSellingProducts = await getBestSellingProducts();
    const brands = await getAllBrands();
    return res.render("user/home/show.ejs", {
        products: products,
        bestSellingProducts: bestSellingProducts,
        brands: brands,
    });
}

const getDetailProductPage = async (req: Request, res: Response) => {
    const {id} = req.params;
    let productsRecommendation = new Array();
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/product-recommendation?id=${id}`);
        const productsIdRecommendation = await response.json();
        productsRecommendation =  await getProductRecommendation(productsIdRecommendation.products);
    }
    catch (e) {
        console.log(e);
    }
    

    const brands = await getAllBrands();
    const categories = await getAllCategories();
    const product = await getProductById(id as string);
    return res.render("user/product/detail.ejs", {
        product: product,
        brands: brands,
        categories: categories,
        productsRecommendation: productsRecommendation
    })
}

const getLoginPage = async (req: Request, res: Response) => {
    const { session } = req as any;
    const messages = session?.messages ?? [];
    if (session?.messages) {
        session.messages = [];
    }
    return res.render("user/auth/login.ejs", { messages });
}

const getRegisterPage = async (req: Request, res: Response) => {
    const oldData = {
        fullName: "",
        email: "",
        password: "", 
        confirmPassword: ""
    }

    const errors: string[] = [];

    return res.render("user/auth/register.ejs", {
        oldData, errors
    });
}

const postRegister = async (req: Request, res: Response) => {
    const {fullName, email, password, confirmPassword} = req.body as TAdminUserSchema;

    const validate = await AdminUserSchema.safeParseAsync(req.body);
    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.message} (${item.path[0]})`);

        const oldData = {
            fullName, email, password, confirmPassword
        };

        return res.render("user/auth/register.ejs", {
            errors, oldData
        });
    }

    await registerNewUser(fullName as string, email, password);
    return res.redirect("/login");
}

const getSuccessRedirectPage = async (req: Request, res: Response) => {
    const user = req.user as any;
    if (user?.role?.name === "ADMIN"){
        res.redirect("/admin");
    } else {
        res.redirect("/");
    }
}

const postLogout = (req: Request, res: Response, next: NextFunction) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
}

const postAddProductToCart = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    if (user) {
        await addProductToCart(1, +id, user);
    } else {
        return res.redirect("/login");
    }

    return res.redirect("/");
}

const getCardPage = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.redirect("/login");
    const cartDetails = await getCartDetailByUserId(user.id);
    const totalPrice = cartDetails?.map(item => +item.priceCurr * +item.quantity)
        ?.reduce((a,b) => a+b, 0);

    return res.render("user/cart/cart.ejs", {cartDetails, totalPrice});
}

const postDeleteProductInCart = async (req: Request, res: Response) => {
    const {id} = req.params;
    const user = req.user;

    if (user) {
        await deleteProductInCart(+id, user.id, user?.sumCart ?? 0);
    } else {
        return res.redirect("/login");
    }

    return res.redirect("/cart");
}

const getCheckOutPage = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.redirect("/login");

    const cartDetails = await getCartDetailByUserId(user.id);
    const totalPrice = cartDetails?.map(item => +item.priceCurr * +item.quantity)
        ?.reduce((a,b) => a+b, 0);

    return res.render("user/checkout/checkout.ejs", {cartDetails, totalPrice});
}

const postHandleCartToCheckOut = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.redirect("/login");

    const cartDetails: {id: string; quantity: string}[] = req.body?.cartDetails ?? [];
    await updateCartDetailBeforeCheckout(cartDetails, user.id)
   
    return res.redirect("/checkout");
}

const postPlaceOrder = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.redirect("/login");
    const {receiverName, receiverAddress, receiverPhone, totalPrice, paymentMethod} = req.body;

   await handlePlaceOrder(user.id, receiverName, receiverAddress, receiverPhone, totalPrice, paymentMethod);
    return res.redirect("/thanks");
}

const getThanksPage = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.redirect("/login");
    return res.render("user/checkout/end.ejs");
}

const getOrderHistoryPage = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.redirect("/login");

    const orders = await getAllOrderById(user.id);

    return res.render("user/checkout/history.ejs", {
        orders,
    });
}

export {
    getHomePage,
    getDetailProductPage,
    getLoginPage,
    getRegisterPage,
    postRegister,
    getSuccessRedirectPage,
    postLogout,
    postAddProductToCart,
    getCardPage,
    postDeleteProductInCart,
    getCheckOutPage,
    postHandleCartToCheckOut,
    postPlaceOrder,
    getThanksPage,
    getOrderHistoryPage
}
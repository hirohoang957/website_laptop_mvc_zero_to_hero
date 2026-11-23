import { Request, Response } from "express";
import { getOrderByIdAdmin, getOrderDetailAdmin } from "services/admin/admin.service";

const getAdminViewOrderPage = async (req: Request, res: Response) => {
    const {id} = req.params;

    const [order, orderDetails] = await Promise.all([
        getOrderByIdAdmin(+id),
        getOrderDetailAdmin(+id),
    ]);

    return res.render("admin/order/detail.ejs", {
        order,
        orderDetails,
        id,
    })
}

export {
    getAdminViewOrderPage
}
import { Request, Response } from "express";
import { getBrandById, handleCreateBrand, handleDeleteBrand, handleUpdateBrand } from "services/admin/admin.service";
import { AdminBrandSchema, TAdminBrandSchema } from "src/validation/admin.brand.schema";

const getAdminCreateBrandPage = async (req: Request, res: Response) => {
    const errors: Array<string> = [];
    const oldData = {
        name: ""
    }
    return res.render("admin/brand/create.ejs", {
        errors: errors,
        oldData: oldData
    });
}

const postAdminCreateBrand = async (req: Request, res: Response) => {
    const { name } = req.body as TAdminBrandSchema;
    const file = req.file;
    const logo = file?.filename ?? "";

    const validate = await AdminBrandSchema.safeParseAsync(req.body);
    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.message} (${item.path[0]})`);
        const oldData = {
            name: name
        };
        return res.render("admin/brand/create.ejs", {
            errors, oldData
        });
    }

    const newbrand = await handleCreateBrand(name, logo);
    return res.redirect("/admin/brand");
}

const getAdminViewBrandPage = async (req: Request, res: Response) => {
    const { id } = req.params;
    const errors: Array<string> = [];
    const brand = await getBrandById(id as string);
    return res.render("admin/brand/detail.ejs", {
        brand: brand,
        errors: errors
    })
}

const postAdminUpdateBrand = async (req: Request, res: Response) => {
    const { name, id } = req.body as TAdminBrandSchema;
    const file = req.file;
    const logo = file?.filename ?? "";

    // const validate = await AdminBrandSchema.safeParseAsync(req.body);
    // if (!validate.success) {
    //     const errorsZod = validate.error.issues;
    //     const errors = errorsZod?.map(item => `${item.message} (${item.path[0]})`);
    //     const brand = {
    //         name: name,
    //         id: id
    //     };
    //     return res.render("admin/brand/detail.ejs", {
    //         errors, brand
    //     });
    // }

    const newbrand = await handleUpdateBrand(id as string, name, logo);
    return res.redirect("/admin/brand");
}

const postAdminDeleteBrand = async (req: Request, res: Response) => {
    const {id} = req.params;
    await handleDeleteBrand(id as string);
    return res.redirect("/admin/brand");
}

export {
    getAdminCreateBrandPage,
    postAdminCreateBrand,
    getAdminViewBrandPage,
    postAdminUpdateBrand,
    postAdminDeleteBrand
}
import { Request, Response } from "express";
import { getCategoryById, handleCreateCategory, handleDeleteCategory } from "services/admin/admin.service";
import { AdminCategorySchema, TAdminCategorySchema } from "src/validation/admin.category.schema";

const getAdminCreateCategoryPage = async (req: Request, res: Response) => {
    const errors: Array<string> = [];
    const oldData = {
        name: ""
    }
    return res.render("admin/category/create.ejs", {
        errors: errors,
        oldData: oldData
    });
}

const postAdminCreateCategory = async (req: Request, res: Response) => {
    const { name } = req.body as TAdminCategorySchema;

    const validate = await AdminCategorySchema.safeParseAsync(req.body);
    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.message} (${item.path[0]})`);
        const oldData = {
            name: name
        };
        return res.render("admin/category/create.ejs", {
            errors, oldData
        });
    }

    const newcategory = await handleCreateCategory(name);
    return res.redirect("/admin/category");
}

const postAdminDeleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    await handleDeleteCategory(id as string);
    return res.redirect("/admin/category");
}

const getAdminViewCategoryPage = async (req: Request, res: Response) => {
    const errors: Array<string> = [];
    const {id} = req.params;
    const category = await getCategoryById(id as string);
    return res.render("admin/category/detail.ejs", {
        errors: errors,
        category: category
    });
}

const postAdminUpdateCategory = async (req: Request, res: Response) => {
    const { id, name } = req.body as TAdminCategorySchema;

    const validate = await AdminCategorySchema.safeParseAsync(req.body);
    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.message} (${item.path[0]})`);
        const category = {
            id: id,
            name: name
        };
        return res.render("admin/category/detail.ejs", {
            errors, category
        });
    }

    const newcategory = await handleCreateCategory(name);
    return res.redirect("/admin/category");
}

export {
    getAdminCreateCategoryPage,
    postAdminCreateCategory,
    postAdminDeleteCategory,
    getAdminViewCategoryPage,
    postAdminUpdateCategory
}
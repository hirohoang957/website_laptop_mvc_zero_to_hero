import { Request, Response } from "express";
import { getAllRoles, getUserById, handleCreateUser, handleDeleteUser, handleUpdateUser } from "services/admin/admin.service";
import { AdminUpdateUserSchema, AdminUserSchema,  } from "src/validation/admin.user.schema";

const getAdminCreateUserPage = async (req: Request, res: Response) => {
    const errors: Array<string> = [];
    const oldData = {
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phone: "",
        roleId: "",
        status: "",
        address: ""
    }
    const roles = await getAllRoles();
    return res.render("admin/user/create.ejs", {
        roles: roles,
        errors: errors,
        oldData: oldData
    });
}

const postAdminCreateUser = async (req: Request, res: Response) => {
    const roles = await getAllRoles();
    const { email, password, confirmPassword, fullName, phone, roleId, status, address } = req.body;
    const file = req.file;
    const avatar = file?.filename ?? "";

    const validate = await AdminUserSchema.safeParseAsync(req.body);
    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.message} (${item.path[0]})`);
        const oldData = {
            email: email, password: password, confirmPassword: confirmPassword, 
            fullName: fullName, phone: phone, roleId: roleId, status: status, 
            address: address
        };
        return res.render("admin/user/create.ejs", {
            errors, oldData, roles
        });
    }
    
    //handle create user
    const user = await handleCreateUser(fullName , email, password, address , phone, status, avatar, roleId);
    return res.redirect("/admin/user");
}

const getAdminViewUserPage = async (req: Request, res: Response) => {
    const { id } = req.params;
    const errors: Array<string> = [];
    const user = await getUserById(id as string);
    const roles = await getAllRoles();
    return res.render("admin/user/detail.ejs", {
        user: user,
        roles: roles,
        errors: errors
    })
}

const postAdminUpdateUser = async (req: Request, res: Response) => {
    const { id, fullName, address, phone, status, roleId, email } = req.body;
    const roles = await getAllRoles();
    const file = req.file;
    const avatar = file?.filename ?? "";

    const validate = await AdminUpdateUserSchema.safeParseAsync(req.body);
    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.message} (${item.path[0]})`);
        const avatar = await getUserById(id as string);
        const user = {
            username: email, id: id,
            fullName: fullName, phone: phone, roleId: roleId, status: status, 
            address: address, avatar: avatar?.avatar
        };

        return res.render("admin/user/detail.ejs", {
            user: user,
            roles: roles,
            errors: errors
        })
    }

    await handleUpdateUser(id, fullName, address, phone, status, roleId, avatar);
    return res.redirect("/admin/user");
}

const postAdminDeleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    await handleDeleteUser(id as string);
    return res.redirect("/admin/user");
}

export {
    getAdminCreateUserPage,
    postAdminCreateUser,
    getAdminViewUserPage,
    postAdminUpdateUser,
    postAdminDeleteUser
}